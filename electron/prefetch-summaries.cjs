"use strict";

/**
 * Background LLM prefetch: Rust CLI orders jobs (`prefetch-summary-queue`); this
 * module runs them sequentially in the Electron main process (one in-flight
 * request at a time so local Ollama/LM Studio stays responsive).
 */

const { runCompareEngine } = require("./compare-runner.cjs");
const { summarizeChange } = require("./llm.cjs");
const { buildDiffExcerpt, buildDiffExcerptChunks } = require("./diff-excerpt.cjs");
const { exportFileSummaryArtifacts } = require("./file-summary-export.cjs");

/** @type {Map<string, string>} */
const summaryByPath = new Map();

/** @type {AbortController | null} */
let prefetchAbort = null;

function clearSummaryPrefetchCache() {
  summaryByPath.clear();
}

function stopSummaryPrefetchWorker() {
  if (prefetchAbort) {
    prefetchAbort.abort();
    prefetchAbort = null;
  }
}

/**
 * @param {string} relPath
 * @returns {string | undefined}
 */
function getPrefetchedSummary(relPath) {
  return summaryByPath.get(relPath);
}

function defaultPrefetchLimit() {
  const raw = process.env.NOVADIFF_PREFETCH_MAX;
  if (raw != null && String(raw).trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 1) {
      return Math.min(5000, Math.floor(n));
    }
  }
  return 200;
}

/**
 * @param {object} opts
 * @param {string} opts.appRoot
 * @param {boolean} opts.isPackaged
 * @param {import("electron").WebContents | null | undefined} opts.webContents
 * @param {string} opts.leftRoot
 * @param {string} opts.rightRoot
 * @param {string} opts.leftLabel
 * @param {string} opts.rightLabel
 * @param {{ path: string; kind: string }[]} opts.changes
 * @param {{ provider: string; baseUrl: string; model: string }} opts.llmSettings
 * @param {number} [opts.limit]
 * @param {AbortSignal} signal
 */
async function runSummaryPrefetchLoop(opts, signal) {
  const {
    appRoot,
    isPackaged,
    webContents,
    leftRoot,
    rightRoot,
    leftLabel,
    rightLabel,
    changes,
    llmSettings,
    limit = defaultPrefetchLimit(),
  } = opts;

  const plan = runCompareEngine(
    appRoot,
    {
      cmd: "prefetch-summary-queue",
      leftRoot,
      rightRoot,
      changes,
      limit,
    },
    isPackaged,
  );

  const jobs = Array.isArray(plan.queue) ? plan.queue : [];
  const inputChanges =
    typeof plan.input_changes === "number" ? plan.input_changes : changes.length;
  const skippedGi =
    typeof plan.skipped_gitignore === "number" ? plan.skipped_gitignore : 0;
  const skippedNd =
    typeof plan.skipped_novadiff_docs === "number" ? plan.skipped_novadiff_docs : 0;
  const skippedNonText =
    typeof plan.skipped_non_text === "number" ? plan.skipped_non_text : 0;
  const eligible =
    typeof plan.eligible_changes === "number"
      ? plan.eligible_changes
      : typeof plan.total_changes === "number"
        ? plan.total_changes
        : changes.length;

  webContents?.send("summary-prefetch-progress", {
    state: "started",
    jobs: jobs.length,
    inputChanges,
    skippedGitignore: skippedGi,
    skippedNovadiffDocs: skippedNd,
    skippedNonText,
    eligibleChanges: eligible,
  });

  const concurrency = Math.min(
    3,
    Math.max(1, Number(process.env.NOVADIFF_PREFETCH_CONCURRENCY) || 2),
  );
  let nextIndex = 0;

  async function runJob(job, i) {
    const relPath = job.path;
    const kind = typeof job.kind === "string" ? job.kind : "modified";
    try {
      const diffPayload = runCompareEngine(
        appRoot,
        {
          cmd: "get-file-diff",
          leftRoot,
          rightRoot,
          relPath,
          kind,
        },
        isPackaged,
      );
      const chunks = buildDiffExcerptChunks(diffPayload);
      const payload =
        chunks.length > 1
          ? {
              ...llmSettings,
              relPath,
              kind,
              leftLabel,
              rightLabel,
              lineAdditions: diffPayload?.line_additions,
              lineDeletions: diffPayload?.line_deletions,
              truncated: diffPayload?.truncated,
              diffChunkList: chunks,
              summaryEvidence: diffPayload?.summary_evidence,
            }
          : {
              ...llmSettings,
              relPath,
              kind,
              leftLabel,
              rightLabel,
              lineAdditions: diffPayload?.line_additions,
              lineDeletions: diffPayload?.line_deletions,
              truncated: diffPayload?.truncated,
              diffExcerpt: chunks[0] || buildDiffExcerpt(diffPayload, 24_000),
              summaryEvidence: diffPayload?.summary_evidence,
            };
      const text = await summarizeChange(payload);
      summaryByPath.set(relPath, text);
      const docRoot = String(rightRoot ?? "").trim();
      if (docRoot) {
        try {
          await exportFileSummaryArtifacts({
            targetRoot: docRoot,
            relPath,
            kind,
            leftTitle: leftLabel,
            rightTitle: rightLabel,
            markdown: text,
            summaryEvidence: diffPayload?.summary_evidence,
          });
        } catch (err) {
          console.warn(
            "[NovaDiff] per-file summary export failed:",
            relPath,
            err,
          );
        }
      }
      webContents?.send("summary-prefetch-progress", {
        state: "file-done",
        path: relPath,
        index: i + 1,
        total: jobs.length,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("Binary or non-text file (skipped)")) {
        webContents?.send("summary-prefetch-progress", {
          state: "file-skipped",
          path: relPath,
          reason: "non-text",
          index: i + 1,
          total: jobs.length,
        });
        return;
      }
      webContents?.send("summary-prefetch-progress", {
        state: "file-error",
        path: relPath,
        message: msg,
        index: i + 1,
        total: jobs.length,
      });
    }
  }

  async function worker() {
    while (!signal.aborted) {
      const i = nextIndex;
      nextIndex += 1;
      if (i >= jobs.length) {
        return;
      }
      await runJob(jobs[i], i);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  webContents?.send("summary-prefetch-progress", {
    state: "finished",
    aborted: signal.aborted,
  });
}

/**
 * Starts prefetch in the background (do not await in IPC handler).
 * @param {object} opts
 */
function startSummaryPrefetchWorker(opts) {
  stopSummaryPrefetchWorker();
  clearSummaryPrefetchCache();
  const ac = new AbortController();
  prefetchAbort = ac;
  const signal = ac.signal;
  return runSummaryPrefetchLoop(opts, signal).finally(() => {
    if (prefetchAbort === ac) {
      prefetchAbort = null;
    }
  });
}

module.exports = {
  startSummaryPrefetchWorker,
  stopSummaryPrefetchWorker,
  clearSummaryPrefetchCache,
  getPrefetchedSummary,
  defaultPrefetchLimit,
};
