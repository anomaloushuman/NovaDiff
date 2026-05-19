"use strict";

/**
 * Local LLM from the main process (no CORS). Ollama + LM Studio; streaming for live UI.
 */

const STREAM_CHANNEL = "llm-stream-token";
const REPETITION_LINE_WINDOW_MAX = 6;
const REPETITION_MIN_LINE_LEN = 24;
const REPETITION_MIN_PARAGRAPH_LEN = 80;

function normalizeBase(url) {
  const s = (url || "").trim().replace(/\/+$/, "");
  return s || "http://127.0.0.1:11434";
}

/**
 * @param {import("electron").WebContents} webContents
 * @param {string} text
 */
function sendAccumulated(webContents, text) {
  webContents.send(STREAM_CHANNEL, { text });
}

function normalizeRepeatUnit(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function arraysEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function trimRepeatedParagraphSuffix(text) {
  const blocks = String(text || "").split(/\n\s*\n/);
  if (blocks.length < 2) {
    return null;
  }
  for (let win = Math.min(3, Math.floor(blocks.length / 2)); win >= 1; win--) {
    const tail = blocks.slice(-win);
    const prev = blocks.slice(-win * 2, -win);
    const tailNorm = tail.map(normalizeRepeatUnit);
    const prevNorm = prev.map(normalizeRepeatUnit);
    if (
      tailNorm.length === prevNorm.length &&
      tailNorm.every((part) => part.length >= REPETITION_MIN_PARAGRAPH_LEN) &&
      arraysEqual(tailNorm, prevNorm)
    ) {
      return blocks.slice(0, -win).join("\n\n").trimEnd();
    }
  }
  return null;
}

function trimRepeatedLineSuffix(text) {
  const lines = String(text || "").split("\n");
  const norm = lines.map(normalizeRepeatUnit);
  for (
    let win = Math.min(REPETITION_LINE_WINDOW_MAX, Math.floor(lines.length / 2));
    win >= 2;
    win--
  ) {
    const tail = norm.slice(-win);
    const prev = norm.slice(-win * 2, -win);
    if (
      tail.length === prev.length &&
      tail.every((line) => line.length >= REPETITION_MIN_LINE_LEN) &&
      arraysEqual(tail, prev)
    ) {
      return lines.slice(0, -win).join("\n").trimEnd();
    }
  }
  return null;
}

function sanitizeModelResponse(text) {
  let current = String(text || "").trim();
  let trimmedRepeated = false;
  for (;;) {
    const next =
      trimRepeatedParagraphSuffix(current) ?? trimRepeatedLineSuffix(current);
    if (!next || next === current) {
      break;
    }
    current = next;
    trimmedRepeated = true;
  }
  return { text: current, trimmedRepeated };
}

function ollamaGenerationOptions(payload) {
  return {
    num_predict: ollamaNumPredict(payload),
    temperature: 0.2,
    top_p: 0.9,
    repeat_penalty: 1.08,
    repeat_last_n: 192,
  };
}

function lmStudioGenerationOptions(payload) {
  return {
    temperature: 0.2,
    top_p: 0.9,
    frequency_penalty: 0.2,
    presence_penalty: 0.05,
    max_tokens: lmStudioMaxTokens(payload),
  };
}

/**
 * Ollama: newline-delimited JSON, each with message.content delta.
 */
function ollamaNumPredict(payload) {
  if (payload?.selectionDoc) {
    return 1800;
  }
  if (payload?.codebaseDoc) {
    return 8192;
  }
  if (payload?.workspaceDoc) {
    return 8192;
  }
  if (payload?.commitMessage) {
    return 768;
  }
  if (payload?.summaryChunkMode === "extract") {
    return 640;
  }
  if (payload?.summaryChunkMode === "synthesize") {
    return 1600;
  }
  return 2200;
}

async function streamOllamaChat(url, body, webContents, signal) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, stream: true }),
    signal,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t.slice(0, 800) || `HTTP ${res.status}`);
  }
  if (!res.body) {
    throw new Error("Ollama returned no response body.");
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let acc = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split("\n");
    buf = parts.pop() ?? "";
    for (const line of parts) {
      const t = line.trim();
      if (!t) continue;
      let j;
      try {
        j = JSON.parse(t);
      } catch {
        continue;
      }
      if (j.error) {
        throw new Error(
          typeof j.error === "string" ? j.error : JSON.stringify(j.error),
        );
      }
      const piece = j?.message?.content;
      if (typeof piece === "string" && piece.length > 0) {
        if (piece.startsWith(acc)) {
          acc = piece;
        } else {
          acc += piece;
        }
        const sanitized = sanitizeModelResponse(acc);
        acc = sanitized.text;
        sendAccumulated(webContents, acc);
        if (sanitized.trimmedRepeated) {
          await reader.cancel().catch(() => {});
          return acc;
        }
      }
    }
  }
  const tail = buf.trim();
  if (tail) {
    try {
      const j = JSON.parse(tail);
      const piece = j?.message?.content;
      if (typeof piece === "string" && piece.length > 0) {
        if (piece.startsWith(acc)) {
          acc = piece;
        } else {
          acc += piece;
        }
        const sanitized = sanitizeModelResponse(acc);
        acc = sanitized.text;
        sendAccumulated(webContents, acc);
        if (sanitized.trimmedRepeated) {
          await reader.cancel().catch(() => {});
          return acc;
        }
      }
    } catch {
      /* ignore trailing garbage */
    }
  }
  if (!acc.trim()) {
    throw new Error("Ollama returned an empty streamed reply.");
  }
  return acc;
}

/**
 * LM Studio / OpenAI-style SSE: lines `data: {...}` with choices[0].delta.content
 */
function lmStudioMaxTokens(payload) {
  if (payload?.selectionDoc) {
    return 1800;
  }
  if (payload?.codebaseDoc) {
    return 8192;
  }
  if (payload?.workspaceDoc) {
    return 8192;
  }
  if (payload?.commitMessage) {
    return 768;
  }
  if (payload?.summaryChunkMode === "extract") {
    return 640;
  }
  if (payload?.summaryChunkMode === "synthesize") {
    return 1600;
  }
  return 2200;
}

async function streamLmStudioChat(url, body, webContents, signal) {
  const payloadMeta = body?.payload ?? null;
  const { payload: _payload, ...requestBody } = body || {};
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...requestBody,
      stream: true,
      ...lmStudioGenerationOptions(payloadMeta),
      max_tokens: body.max_tokens ?? lmStudioMaxTokens(payloadMeta),
    }),
    signal,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t.slice(0, 800) || `HTTP ${res.status}`);
  }
  if (!res.body) {
    throw new Error("LM Studio returned no response body.");
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let acc = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const s = line.trim();
      if (!s.startsWith("data:")) continue;
      const data = s.slice(5).trim();
      if (data === "[DONE]") continue;
      let j;
      try {
        j = JSON.parse(data);
      } catch {
        continue;
      }
      const d = j?.choices?.[0]?.delta?.content;
      if (typeof d === "string" && d.length > 0) {
        acc += d;
        const sanitized = sanitizeModelResponse(acc);
        acc = sanitized.text;
        sendAccumulated(webContents, acc);
        if (sanitized.trimmedRepeated) {
          await reader.cancel().catch(() => {});
          return acc;
        }
      }
    }
  }
  const tail = buf.trim();
  if (tail.startsWith("data:")) {
    const data = tail.slice(5).trim();
    if (data && data !== "[DONE]") {
      try {
        const j = JSON.parse(data);
        const d = j?.choices?.[0]?.delta?.content;
        if (typeof d === "string" && d.length > 0) {
          acc += d;
          const sanitized = sanitizeModelResponse(acc);
          acc = sanitized.text;
          sendAccumulated(webContents, acc);
          if (sanitized.trimmedRepeated) {
            await reader.cancel().catch(() => {});
            return acc;
          }
        }
      } catch {
        /* ignore */
      }
    }
  }
  if (!acc.trim()) {
    throw new Error("LM Studio returned an empty streamed reply.");
  }
  return acc;
}

/**
 * Whole-workspace / project documentation (paired with local LLM).
 * Inspired by structured doc generators (entity index, topics, diagrams); we only
 * supply path-level diff statistics — not a full AST parse like Doxygen.
 * @param {object} payload
 */
function buildWorkspaceDocPrompt(payload) {
  const { leftLabel, rightLabel, workspaceContext, summaryContext, verificationContext } =
    payload;
  const ctx = String(workspaceContext || "").trim().slice(0, 10_000);
  const summaryHints = String(summaryContext || "").trim().slice(0, 4_000);
  const verificationHints = String(verificationContext || "").trim().slice(0, 4_000);
  return `You are a principal engineer authoring **project documentation for a diff workspace** (baseline tree vs target tree). The app renders your reply as **GitHub-flavored Markdown** with optional Mermaid previews.

Your job is to produce a **readable engineering narrative**, not to echo the raw grounding blocks. Stay **strictly grounded** in the compare data below. Do **not** invent symbols, classes, or APIs that are not reasonably implied by paths and counts. Do not claim Doxygen or Graphviz was executed.

After you finish, the app also writes companion Mermaid (\`.mmd\`) and JSON under **\`novadiff-docs/\`** on the target tree — reference those as the machine-readable diagram layer when helpful.

**Hard rules**
- **Markdown only** — no HTML document wrapper, no JSON, no YAML front matter.
- Do **not** wrap the entire answer in one outer \`\`\`markdown\`\`\` fence.
- Start immediately with a \`##\` title (no preamble).
- Do **not** use Markdown tables in this narrative.
- Include **at most 1 small fenced \`\`\`mermaid\`\`\` diagram**, and only if it genuinely clarifies the explanation. Skip Mermaid entirely if the prose is already clear.
- On-disk \`novadiff-docs/diagrams/*.mmd\` uses **heuristic** scans (marker-based stacks, imports, cross-file call guesses, symbol regexes) — not a full AST or verified call graph.
- Put every heading on its own line and leave a blank line before the paragraph or list that follows.
- Prefer short paragraphs and flat bullet lists over dense wall-of-text prose.
- Do not repeat the heading text in the opening sentence beneath that heading.
- Never place a heading and its body text on the same line.
- Keep paragraphs to 2-4 sentences max; if a section gets long, switch to bullets.
- Use concrete anchors wherever possible: real paths, changed subsystems, summary-backed implementation changes, and deterministic risk signals.
- If the evidence is weak or absent, say \`unknown from the available diff evidence\` rather than guessing.
- The grounding blocks below are **inputs only**. Do not copy their labels or dump them verbatim. Never create output sections named \`Saved per-file summaries\`, \`Deterministic risk signals\`, \`Confidence badges\`, or \`Workspace data\`.
- Do not reproduce exhaustive file inventories. Mention only the most important files or subsystems needed to explain the change.
- If a saved per-file summary looks generic, inconsistent, or weakly supported, ignore it and rely on the deterministic compare evidence instead.

**Core compare data (authoritative):**
---
${ctx}
---

${verificationHints ? `\n**Risk and confidence hints (input only; synthesize, do not quote):**\n---\n${verificationHints}\n---\n` : ""}
${summaryHints ? `\n**Saved summary hints (input only; synthesize, do not quote):**\n---\n${summaryHints}\n---\n` : ""}

**Required sections (use \`###\` headings):**
### Workspace overview — roots, comparison intent, scale of change
### Change landscape — interpret counts, dominant extensions, depth hotspots, risk intuition
### Subsystem map — group paths into coherent areas (config, tests, app, infra, vendor…) using **only** evidence from the sample paths and top segments
### Cross-cutting concerns — security, build/release, migrations, observability (flag unknowns honestly)
### Documentation & tooling gaps — what would require Doxygen/clangd/tree-sitter or runtime profiling to validate
### Suggested verification — tests, manual checks, staged rollout

**Length target:** roughly 450-750 words total.

Tone: technical, explanatory, peer-to-peer. Avoid marketing language. If you have already covered the key points, stop instead of repeating earlier sections.`;
}

function buildCodebaseDocPrompt(payload) {
  const {
    leftLabel,
    rightLabel,
    codebaseContext,
    codebasePerspective = "target",
  } = payload;
  const ctx = String(codebaseContext || "").trim().slice(0, 16_000);
  const perspectiveLabel =
    codebasePerspective === "baseline"
      ? `baseline codebase (${leftLabel})`
      : `target codebase (${rightLabel})`;
  return `You are a principal engineer authoring **full repository documentation** for the ${perspectiveLabel}. The app renders your reply as GitHub-flavored Markdown and pairs it with heuristic diagrams.

You are documenting the repository itself, not only the current diff. Stay strictly grounded in the repository scan data below. Do not invent APIs, services, or symbols that are not reasonably implied by the file inventory, symbol hints, and dependency edges.

Hard rules:
- Markdown only. No HTML document wrapper, no JSON, no YAML front matter.
- Do not wrap the entire response in a single outer fenced code block.
- Start immediately with a \`##\` title.
- Put each heading on its own line with a blank line before the content that follows.
- Prefer short paragraphs and flat bullet lists over dense prose.
- Include at most 1-2 small Mermaid fences only when they genuinely help.
- The scan is heuristic, bounded, and not a full AST or verified call graph. Be honest about uncertainty.
- Never place a heading and its body text on the same line.
- Keep paragraphs to 2-4 sentences max; if a section gets long, use bullets.
- Prefer concrete paths, symbol hints, and dependency markers over generic architectural filler.
- If a claim cannot be supported from the scan data, label it as unknown or omit it.

Repository scan data:
---
${ctx}
---

Use these sections with \`###\` headings:
### Repository overview
### Architectural layout
### Key subsystems
### Dependency signals
### Operational considerations
### Documentation gaps
### Suggested onboarding and verification

Tone: technical, explanatory, peer-to-peer. Stop once the important architectural picture is clear instead of restating points.`;
}

function buildCommitMessagePrompt(payload) {
  const { leftLabel, rightLabel, commitContext } = payload;
  const ctx = String(commitContext || "").trim().slice(0, 12_000);
  return `You write git commit messages for a folder diff between two directory trees.

Use ONLY the change list below (paths and kinds). Do not invent files, tickets, or features not implied by the list. Subject line must be imperative mood and at most 72 characters.

Output plain text only — no Markdown code fences, no surrounding quotes.

Use exactly this shape (keep the labels SUBJECT: and BODY: as the first tokens on their lines):

SUBJECT: <one line, <=72 characters, summarize the dominant theme>

BODY:
<Optional blank line. Then 2–10 short lines or hyphen bullets: what changed, where, risks, what to test. Use real paths from the data.>

Folder labels:
- Baseline: ${leftLabel}
- Target: ${rightLabel}

Change data:
---
${ctx}
---

Start your reply with SUBJECT:

Do not restate the same bullet or sentence twice.`;
}

function buildSelectionDocPrompt(payload) {
  const {
    relPath,
    kind,
    leftLabel,
    rightLabel,
    lineAdditions,
    lineDeletions,
    truncated,
    selectionModeRequested = "exact",
    selectionModeEffective = "exact",
    selectionLabel,
    selectedRowCount,
    selectedLineRanges,
    selectedDiffExcerpt,
    focusDiffExcerpt,
    selectionSymbol,
  } = payload;
  const stats =
    lineAdditions != null && lineDeletions != null
      ? `Line changes (approximate): +${lineAdditions} / −${lineDeletions}${
          truncated ? " (diff may be truncated in UI)" : ""
        }.`
      : "";
  const ranges = Array.isArray(selectedLineRanges)
    ? selectedLineRanges
        .map((range) =>
          [
            range?.leftStart != null
              ? `L${range.leftStart}${range.leftEnd && range.leftEnd !== range.leftStart ? `-${range.leftEnd}` : ""}`
              : null,
            range?.rightStart != null
              ? `R${range.rightStart}${range.rightEnd && range.rightEnd !== range.rightStart ? `-${range.rightEnd}` : ""}`
              : null,
          ]
            .filter(Boolean)
            .join(" / "),
        )
        .filter(Boolean)
        .join(", ")
    : "";
  const selectedBlock =
    selectedDiffExcerpt && String(selectedDiffExcerpt).trim()
      ? `\n\nSelected diff rows (authoritative focus):\n---\n${String(selectedDiffExcerpt).trim()}\n---`
      : "";
  const focusBlock =
    focusDiffExcerpt && String(focusDiffExcerpt).trim()
      ? `\n\nAdditional diff context for interpretation:\n---\n${String(focusDiffExcerpt).trim()}\n---`
      : "";
  const symbolBlock = selectionSymbol
    ? `\n\nDetected enclosing symbol:\n- Side: ${selectionSymbol.side}\n- Kind: ${selectionSymbol.kind}\n- Name: ${selectionSymbol.name}\n- Span: ${selectionSymbol.start_line}-${selectionSymbol.end_line}`
    : "";
  return `You are documenting a **selected region of a file diff**, not the whole file. Your response must be valid GitHub-flavored Markdown only.

Context:
- Baseline (left / old): ${leftLabel}
- Target (right / new): ${rightLabel}
- File (relative path): ${relPath}
- Change kind: ${kind}
- Selection label: ${selectionLabel || "Selected diff lines"}
- Selected row count: ${selectedRowCount ?? 0}
- Selection ranges: ${ranges || "(not provided)"}
- Requested mode: ${selectionModeRequested}
- Effective mode: ${selectionModeEffective}
${stats}${symbolBlock}${selectedBlock}${focusBlock}

Write a **concise technical note** about the selected change region.

Rules:
- Anchor the explanation to the selected rows first; do not drift into unrelated file changes.
- If extra context was provided from an enclosing symbol, use it to explain intent and local impact, but keep the output centered on the selected region.
- If the requested semantic expansion fell back to exact mode, say so briefly only if it matters.
- Be concrete about behavior, data flow, and review risk. Avoid filler.
- Stop when the core points are covered; do not restate earlier bullets.

Use exactly these sections:
- \`### Overview\`
- \`### Selected change\`
- \`### Semantic context\`
- \`### Risks & follow-ups\`

Length target: 180-320 words total.`;
}

function bulletBlock(title, values, limit = 8) {
  const items = Array.isArray(values)
    ? values
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
        .slice(0, limit)
    : [];
  if (items.length === 0) {
    return "";
  }
  return `${title}\n${items.map((item) => `- ${item}`).join("\n")}`;
}

function renderSummaryEvidenceBlock(payload) {
  const evidence = payload?.summaryEvidence;
  if (!evidence || typeof evidence !== "object") {
    return "";
  }
  const sections = [
    bulletBlock("File roles / path heuristics:", evidence.file_roles, 8),
    bulletBlock("Touched symbols:", evidence.touched_symbols, 8),
    bulletBlock("Changed line ranges:", evidence.changed_line_ranges, 8),
    bulletBlock("Changed import-like lines:", evidence.changed_imports, 6),
    bulletBlock("Changed export/public-surface lines:", evidence.changed_exports, 6),
    bulletBlock("Cited changed lines:", evidence.cited_changed_lines, 6),
    bulletBlock("Deterministic verification hints:", evidence.verification_hints, 6),
    bulletBlock("Evidence limits:", evidence.evidence_limits, 4),
  ].filter(Boolean);
  if (sections.length === 0) {
    return "";
  }
  return `\n\nDeterministic evidence (authoritative grounding for this summary):\n${sections.join("\n")}`;
}

function buildGroundingContext(payload) {
  if (payload?.selectionDoc) {
    return buildSelectionDocPrompt(payload);
  }
  if (payload?.codebaseDoc && payload?.codebaseContext) {
    return `Repository scan data:\n---\n${String(payload.codebaseContext ?? "").trim().slice(0, 16_000)}\n---`;
  }
  if (payload?.workspaceDoc && payload?.workspaceContext) {
    return [
      `Core compare data:\n---\n${String(payload.workspaceContext ?? "").trim().slice(0, 10_000)}\n---`,
      payload?.verificationContext
        ? `Risk and confidence hints:\n---\n${String(payload.verificationContext ?? "")
            .trim()
            .slice(0, 4_000)}\n---`
        : "",
      payload?.summaryContext
        ? `Saved summary hints:\n---\n${String(payload.summaryContext ?? "")
            .trim()
            .slice(0, 4_000)}\n---`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }
  const evidence = renderSummaryEvidenceBlock(payload);
  const excerpt =
    payload?.diffExcerpt && String(payload.diffExcerpt).trim()
      ? `\n\nDiff excerpt (TSV columns: left line, right line, left style, left snippet, right snippet):\n---\n${String(payload.diffExcerpt).trim()}\n---`
      : "";
  return [
    `File: ${String(payload?.relPath ?? "").trim()}`,
    `Change kind: ${String(payload?.kind ?? "modified").trim()}`,
    payload?.lineAdditions != null || payload?.lineDeletions != null
      ? `Approx line changes: +${Number(payload?.lineAdditions ?? 0)} / -${Number(
          payload?.lineDeletions ?? 0,
        )}${payload?.truncated ? " (truncated diff)" : ""}`
      : "",
    evidence.trim(),
    excerpt.trim(),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function verifierWordLimit(payload) {
  if (payload?.workspaceDoc || payload?.codebaseDoc) {
    return payload?.workspaceDoc
      ? "Keep the revision concise but complete; target roughly 450-750 words total."
      : "Keep the revision concise but complete; do not exceed the practical density of the draft.";
  }
  if (payload?.selectionDoc) {
    return "Stay within roughly 180-320 words total.";
  }
  return "Stay within roughly 180-350 words total.";
}

function buildGroundedRevisionPrompt(payload, draft) {
  const requiredSections = payload?.workspaceDoc
    ? [
        "### Workspace overview — roots, comparison intent, scale of change",
        "### Change landscape — interpret counts, dominant extensions, depth hotspots, risk intuition",
        "### Subsystem map — group paths into coherent areas (config, tests, app, infra, vendor…) using only evidence from the sample paths and top segments",
        "### Cross-cutting concerns — security, build/release, migrations, observability (flag unknowns honestly)",
        "### Documentation & tooling gaps — what would require Doxygen/clangd/tree-sitter or runtime profiling to validate",
        "### Suggested verification — tests, manual checks, staged rollout",
      ]
    : payload?.codebaseDoc
      ? [
          "### Repository overview",
          "### Architectural layout",
          "### Key subsystems",
          "### Dependency signals",
          "### Operational considerations",
          "### Documentation gaps",
          "### Suggested onboarding and verification",
        ]
      : payload?.selectionDoc
        ? [
            "### Overview",
            "### Selected change",
            "### Semantic context",
            "### Risks & follow-ups",
          ]
        : [
            "### Overview",
            "### Key changes",
            "### Impact",
            "### Risks & follow-ups",
          ];
  return `You are revising a technical Markdown summary so it stays strictly grounded in the evidence provided.

Evidence:
---
${buildGroundingContext(payload)}
---

Draft Markdown:
---
${String(draft ?? "").trim()}
---

Rewrite the draft as valid GitHub-flavored Markdown.

Rules:
- Preserve the same overall purpose and section structure.
- Use exactly these section headings:
${requiredSections.map((heading) => `- ${heading}`).join("\n")}
- Remove or soften unsupported claims. If evidence is insufficient, say \`unknown from the available diff/scan evidence\` or omit the claim.
- Prefer concrete anchors: real paths, symbols, changed line ranges, cited diff lines, or deterministic risk signals.
- Delete generic filler, repeated phrasing, and boilerplate meta-commentary.
- Do not introduce new APIs, files, services, or runtime behavior not supported by the evidence.
- Keep Markdown clean: short paragraphs, flat bullets, no outer fenced block.
- For workspace narratives, remove copied grounding labels such as \`Workspace data\`, \`Saved per-file summaries\`, \`Deterministic risk signals\`, \`Confidence badges\`, or \`Summary 1\`.
- For workspace narratives, do not dump exhaustive file inventories or summary-by-summary rollups; synthesize only the most important themes.
- ${verifierWordLimit(payload)}

Return only the revised Markdown.`;
}

function shouldRunVerifier(payload) {
  return Boolean(
    !payload?.commitMessage &&
      (payload?.workspaceDoc ||
        payload?.codebaseDoc ||
        payload?.selectionDoc ||
        payload?.summaryEvidence ||
        payload?.diffExcerpt ||
        Array.isArray(payload?.diffChunkList)),
  );
}

async function reviseGroundedMarkdown(payload, draft) {
  const text = String(draft ?? "").trim();
  if (!text || !shouldRunVerifier(payload)) {
    return text;
  }
  try {
    return await completeChat({
      provider: payload.provider,
      baseUrl: payload.baseUrl,
      model: payload.model,
      prompt: buildGroundedRevisionPrompt(payload, text),
      numPredict: ollamaNumPredict(payload),
      maxOutputTokens: lmStudioMaxTokens(payload),
      timeoutMs: 120_000,
    });
  } catch {
    return text;
  }
}

function buildPerFileSummarizePrompt(payload) {
  const {
    relPath,
    kind,
    leftLabel,
    rightLabel,
    lineAdditions,
    lineDeletions,
    truncated,
    diffExcerpt,
    summaryChunkIndex = 0,
    summaryChunkTotal = 1,
    priorFileSummaryTail,
  } = payload;
  const stats =
    lineAdditions != null && lineDeletions != null
      ? `Line changes (approximate): +${lineAdditions} / −${lineDeletions}${
          truncated ? " (diff may be truncated in UI)" : ""
        }.`
      : "";
  const excerpt =
    diffExcerpt && diffExcerpt.trim().length > 0
      ? `\n\nDiff excerpt (TSV columns: left line, right line, left style, left snippet, right snippet):\n---\n${diffExcerpt.trim()}\n---\n`
      : "";
  const evidence = renderSummaryEvidenceBlock(payload);

  return `You are a staff-level software engineer writing an internal note for other developers. **Your entire reply must be valid GitHub-flavored Markdown only** — the app renders it as a Markdown preview (not raw HTML or plain text).

Context: a folder diff between two trees on disk.
- Baseline (left / old): ${leftLabel}
- Target (right / new): ${rightLabel}
- File (relative path): ${relPath}
- Change kind: ${kind} (added = new file only in target; removed = deleted from baseline; modified = both sides exist but differ)

${stats}${evidence}${excerpt}

Write a **concise developer summary** as GitHub-flavored Markdown. Prefer signal over exhaustiveness. Focus on the most important behavioral changes and review risks; do not do a line-by-line walkthrough unless the diff is tiny.

**Output contract (strict):**
- Respond with **nothing except valid Markdown** — no HTML document, no JSON, no XML, no YAML front matter.
- Do **not** wrap the entire answer in a single outer fenced code block (no \`\`\`markdown … \`\`\` around the whole reply).
- Do **not** prefix with filler like "Here is the analysis" or "Sure!" — start immediately with Markdown (e.g. a \`###\` heading).
- Never copy the raw TSV diff excerpt verbatim; translate it into prose or bullets.
- Do not include fenced code blocks unless a tiny literal snippet is essential to explain the change.
- Prefer citing concrete anchors when available: touched symbols, changed line ranges, changed imports/exports, or cited diff lines.
- If the evidence does not support a risk or impact claim, say so plainly instead of guessing.

**Markdown structure (use these sections; keep it short):**
- \`### Overview\` — 1-2 sentences on scope.
- \`### Key changes\` — 3-6 bullets covering the most important implementation changes only; each bullet should mention at least one concrete anchor when evidence exists.
- \`### Impact\` — 2-4 bullets on correctness, maintainability, performance, compatibility, or observability, grounded in the evidence above.
- \`### Risks & follow-ups\` — up to 4 bullets on regression risk or what to verify, ranked by evidence strength.

**Length target:** Usually 180-350 words total. Be brief.

**Markdown style:** Use bullets, short paragraphs, and inline \`backticks\` for paths, flags, and symbols. Avoid long code blocks unless absolutely necessary.

Tone: precise, technical, peer-to-peer. Avoid marketing language and generic filler. If you have already covered the main points, stop instead of restating them.`;
}

function buildChunkExtractionPrompt(payload, diffExcerpt, index, total) {
  const {
    relPath,
    kind,
    leftLabel,
    rightLabel,
    lineAdditions,
    lineDeletions,
    truncated,
  } = payload;
  const stats =
    lineAdditions != null && lineDeletions != null
      ? `Line changes (approximate): +${lineAdditions} / -${lineDeletions}${truncated ? " (diff may be truncated in UI)" : ""}.`
      : "";
  const evidence = renderSummaryEvidenceBlock(payload);
  return `You are extracting only the most important technical signals from one chunk of a file diff.

Context:
- Baseline: ${leftLabel}
- Target: ${rightLabel}
- File: ${relPath}
- Change kind: ${kind}
- Chunk: ${index + 1}/${total}
${stats}${evidence}

Diff excerpt for this chunk:
---
${String(diffExcerpt || "").trim()}
---

Output GitHub-flavored Markdown only.
Return:
- \`### Chunk findings\`
- 3-6 concise bullets

Rules:
- Mention only the most important behavior, API, config, or control-flow changes in this chunk.
- Do not repeat raw TSV rows or line tables; summarize them in plain language.
- Prefer concrete anchors such as symbol names, changed imports/exports, or cited line ranges when present.
- Skip filler, praise, and repeated context.
- Max 140 words total. Stop once the list is complete; do not restate bullets.`;
}

function buildChunkSynthesisPrompt(payload, chunkSummaries) {
  const {
    relPath,
    kind,
    leftLabel,
    rightLabel,
    lineAdditions,
    lineDeletions,
    truncated,
  } = payload;
  const stats =
    lineAdditions != null && lineDeletions != null
      ? `Line changes (approximate): +${lineAdditions} / -${lineDeletions}${truncated ? " (diff may be truncated in UI)" : ""}.`
      : "";
  const evidence = renderSummaryEvidenceBlock(payload);
  const summaries = chunkSummaries.map((s, i) => `## Chunk ${i + 1}\n${s}`).join("\n\n");
  return `You are producing the final concise file summary from extracted chunk findings.

Context:
- Baseline: ${leftLabel}
- Target: ${rightLabel}
- File: ${relPath}
- Change kind: ${kind}
${stats}${evidence}

Chunk findings:
---
${summaries}
---

Output GitHub-flavored Markdown only using exactly:
- \`### Overview\`
- \`### Key changes\`
- \`### Impact\`
- \`### Risks & follow-ups\`

Rules:
- Be concise and de-duplicate repeated points.
- Prefer 2-5 bullets per section where applicable.
- Focus on the most important changes only, not exhaustive walkthrough.
- Use concrete anchors from the evidence block when available and avoid speculative impact/risk language.
- Max 320 words total. Stop once the sections are complete; do not repeat prior bullets.`;
}

function buildSummarizePrompt(payload) {
  if (payload.commitMessage && payload.commitContext) {
    return buildCommitMessagePrompt(payload);
  }
  if (payload.selectionDoc) {
    return buildSelectionDocPrompt(payload);
  }
  if (payload.codebaseDoc && payload.codebaseContext) {
    return buildCodebaseDocPrompt(payload);
  }
  if (payload.workspaceDoc && payload.workspaceContext) {
    return buildWorkspaceDocPrompt(payload);
  }
  return buildPerFileSummarizePrompt(payload);
}

async function summarizeFileChangeChunked(basePayload, diffChunks) {
  const total = diffChunks.length;
  const chunkSummaries = [];
  for (let i = 0; i < total; i++) {
    const chunkPayload = {
      ...basePayload,
      summaryChunkMode: "extract",
    };
    const prompt = buildChunkExtractionPrompt(basePayload, diffChunks[i], i, total);
    const text = await completeChat({
      provider: basePayload.provider,
      baseUrl: basePayload.baseUrl,
      model: basePayload.model,
      prompt,
      numPredict: ollamaNumPredict(chunkPayload),
      maxOutputTokens: lmStudioMaxTokens(chunkPayload),
      timeoutMs: 180_000,
    });
    chunkSummaries.push(text.trim());
  }
  const synthPayload = {
    ...basePayload,
    summaryChunkMode: "synthesize",
  };
  return completeChat({
    provider: basePayload.provider,
    baseUrl: basePayload.baseUrl,
    model: basePayload.model,
    prompt: buildChunkSynthesisPrompt(basePayload, chunkSummaries),
    numPredict: ollamaNumPredict(synthPayload),
    maxOutputTokens: lmStudioMaxTokens(synthPayload),
    timeoutMs: 180_000,
  });
}

/**
 * @param {object} payload
 * @param {import("electron").WebContents} webContents
 * @param {AbortSignal} signal
 */
async function summarizeChangeStream(payload, webContents, signal) {
  const prompt = buildSummarizePrompt(payload);
  const { provider, baseUrl, model } = payload;

  if (provider === "ollama") {
    const url = `${normalizeBase(baseUrl)}/api/chat`;
    let draft = await streamOllamaChat(
      url,
      {
        model: model || "llama3.2",
        messages: [{ role: "user", content: prompt }],
        options: ollamaGenerationOptions(payload),
      },
      webContents,
      signal,
    );
    draft = await reviseGroundedMarkdown(payload, draft);
    if (draft.trim()) {
      sendAccumulated(webContents, draft);
    }
    return;
  }

  if (provider === "lmstudio") {
    const url = `${normalizeBase(baseUrl)}/v1/chat/completions`;
    let draft = await streamLmStudioChat(
      url,
      {
        model: model || "local-model",
        messages: [{ role: "user", content: prompt }],
        max_tokens: lmStudioMaxTokens(payload),
        payload,
      },
      webContents,
      signal,
    );
    draft = await reviseGroundedMarkdown(payload, draft);
    if (draft.trim()) {
      sendAccumulated(webContents, draft);
    }
    return;
  }

  throw new Error(`Unknown provider: ${provider}`);
}

/**
 * Non-streaming (probe / legacy).
 */
async function completeChat(opts) {
  const {
    provider,
    baseUrl,
    model,
    prompt,
    timeoutMs = 120_000,
    numPredict,
    maxOutputTokens,
  } = opts;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    if (provider === "ollama") {
      const url = `${normalizeBase(baseUrl)}/api/chat`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model || "llama3.2",
          stream: false,
          messages: [{ role: "user", content: prompt }],
          options: {
            ...ollamaGenerationOptions({}),
            num_predict: numPredict ?? 8192,
          },
        }),
        signal: ctrl.signal,
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(text.slice(0, 500) || `HTTP ${res.status}`);
      }
      const data = JSON.parse(text);
      const content = data?.message?.content;
      if (typeof content !== "string" || !content.trim()) {
        throw new Error("Ollama returned an empty reply.");
      }
      return sanitizeModelResponse(content).text;
    }

    if (provider === "lmstudio") {
      const url = `${normalizeBase(baseUrl)}/v1/chat/completions`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model || "local-model",
          messages: [{ role: "user", content: prompt }],
          ...lmStudioGenerationOptions({}),
          max_tokens: maxOutputTokens ?? 8192,
        }),
        signal: ctrl.signal,
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(text.slice(0, 500) || `HTTP ${res.status}`);
      }
      const data = JSON.parse(text);
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) {
        throw new Error("LM Studio returned an empty reply.");
      }
      return sanitizeModelResponse(content).text;
    }

    throw new Error(`Unknown provider: ${provider}`);
  } finally {
    clearTimeout(t);
  }
}

async function summarizeChange(payload) {
  if (payload.commitMessage && payload.commitContext) {
    const prompt = buildSummarizePrompt(payload);
    return completeChat({
      provider: payload.provider,
      baseUrl: payload.baseUrl,
      model: payload.model,
      prompt,
      numPredict: ollamaNumPredict(payload),
      maxOutputTokens: lmStudioMaxTokens(payload),
    });
  }
  if (payload.codebaseDoc && payload.codebaseContext) {
    const prompt = buildSummarizePrompt(payload);
    const draft = await completeChat({
      provider: payload.provider,
      baseUrl: payload.baseUrl,
      model: payload.model,
      prompt,
      numPredict: ollamaNumPredict(payload),
      maxOutputTokens: lmStudioMaxTokens(payload),
    });
    return reviseGroundedMarkdown(payload, draft);
  }
  if (payload.workspaceDoc && payload.workspaceContext) {
    const prompt = buildSummarizePrompt(payload);
    const draft = await completeChat({
      provider: payload.provider,
      baseUrl: payload.baseUrl,
      model: payload.model,
      prompt,
      numPredict: ollamaNumPredict(payload),
      maxOutputTokens: lmStudioMaxTokens(payload),
    });
    return reviseGroundedMarkdown(payload, draft);
  }
  if (Array.isArray(payload.diffChunkList) && payload.diffChunkList.length > 1) {
    const { diffChunkList, ...rest } = payload;
    const draft = await summarizeFileChangeChunked(rest, diffChunkList);
    return reviseGroundedMarkdown(payload, draft);
  }
  const prompt = buildSummarizePrompt(payload);
  const draft = await completeChat({
    provider: payload.provider,
    baseUrl: payload.baseUrl,
    model: payload.model,
    prompt,
    numPredict: ollamaNumPredict(payload),
    maxOutputTokens: lmStudioMaxTokens(payload),
  });
  return reviseGroundedMarkdown(payload, draft);
}

async function probeProvider(provider, baseUrl, model) {
  const prompt =
    "Reply with exactly the word: ok (lowercase). Nothing else.";
  const reply = await completeChat({
    provider,
    baseUrl,
    model,
    prompt,
    timeoutMs: 20_000,
    numPredict: 128,
    maxOutputTokens: 256,
  });
  return { ok: true, reply: reply.slice(0, 200) };
}

module.exports = {
  summarizeChange,
  summarizeChangeStream,
  probeProvider,
  completeChat,
};
