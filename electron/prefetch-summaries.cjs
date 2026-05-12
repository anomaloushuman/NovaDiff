"use strict";

/**
 * Background LLM prefetch: Rust CLI orders jobs (`prefetch-summary-queue`); this
 * module runs them sequentially in the Electron main process (one in-flight
 * request at a time so local Ollama/LM Studio stays responsive).
 */

const { runCompareEngine } = require("./compare-runner.cjs");
const { summarizeChange } = require("./llm.cjs");
const { buildDiffExcerpt } = require("./diff-excerpt.cjs");

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
    eligibleChanges: eligible,
  });

  for (let i = 0; i < jobs.length; i++) {
    if (signal.aborted) {
      break;
    }
    const job = jobs[i];
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
      const excerpt = buildDiffExcerpt(diffPayload);
      const text = await summarizeChange({
        ...llmSettings,
        relPath,
        kind,
        leftLabel,
        rightLabel,
        lineAdditions: diffPayload?.line_additions,
        lineDeletions: diffPayload?.line_deletions,
        truncated: diffPayload?.truncated,
        diffExcerpt: excerpt,
      });
      summaryByPath.set(relPath, text);
      webContents?.send("summary-prefetch-progress", {
        state: "file-done",
        path: relPath,
        index: i + 1,
        total: jobs.length,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      webContents?.send("summary-prefetch-progress", {
        state: "file-error",
        path: relPath,
        message: msg,
        index: i + 1,
        total: jobs.length,
      });
    }
  }

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
