"use strict";

/**
 * Local LLM from the main process (no CORS). Ollama + LM Studio; streaming for live UI.
 */

const STREAM_CHANNEL = "llm-stream-token";

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

/**
 * Ollama: newline-delimited JSON, each with message.content delta.
 */
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
        sendAccumulated(webContents, acc);
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
        sendAccumulated(webContents, acc);
      }
    } catch {
      /* ignore trailing garbage */
    }
  }
  if (!acc.trim()) {
    throw new Error("Ollama returned an empty streamed reply.");
  }
}

/**
 * LM Studio / OpenAI-style SSE: lines `data: {...}` with choices[0].delta.content
 */
async function streamLmStudioChat(url, body, webContents, signal) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, stream: true, temperature: 0.25 }),
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
        sendAccumulated(webContents, acc);
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
          sendAccumulated(webContents, acc);
        }
      } catch {
        /* ignore */
      }
    }
  }
  if (!acc.trim()) {
    throw new Error("LM Studio returned an empty streamed reply.");
  }
}

function buildSummarizePrompt(payload) {
  const {
    relPath,
    kind,
    leftLabel,
    rightLabel,
    lineAdditions,
    lineDeletions,
    truncated,
    diffExcerpt,
  } = payload;
  const stats =
    lineAdditions != null && lineDeletions != null
      ? `Line changes (approximate): +${lineAdditions} / −${lineDeletions}${
          truncated ? " (diff truncated in UI)" : ""
        }.`
      : "";
  const excerpt =
    diffExcerpt && diffExcerpt.trim().length > 0
      ? `\n\nDiff excerpt (may be truncated for size):\n---\n${diffExcerpt.trim()}\n---\n`
      : "";
  return `You are a staff-level software engineer writing an internal note for other developers. **Your entire reply must be valid GitHub-flavored Markdown only** — the app renders it as a Markdown preview (not raw HTML or plain text).

Context: a folder diff between two trees on disk.
- Baseline (left / old): ${leftLabel}
- Target (right / new): ${rightLabel}
- File (relative path): ${relPath}
- Change kind: ${kind} (added = new file only in target; removed = deleted from baseline; modified = both sides exist but differ)

${stats}${excerpt}

Write a **technical developer breakdown** as **GitHub-flavored Markdown only** (the UI renders a Markdown preview). Treat it as the story of *what* changed and *why it matters* for this codebase (as many paragraphs as needed, or as much as is reasonable for the LLM to generate), *go line by line, function by function, etc.* Go through the changes and name concrete behaviors that changed, not vague praise.

**Output contract (strict):**
- Respond with **nothing except valid Markdown** — no HTML document, no JSON, no XML, no YAML front matter.
- Do **not** wrap the entire answer in a single outer fenced code block (no \`\`\`markdown … \`\`\` around the whole reply).
- Do **not** prefix with filler like "Here is the analysis" or "Sure!" — start immediately with Markdown (e.g. a \`###\` heading).

**Markdown structure (use these sections; adjust titles if needed):**
- \`### Overview\` — 1–3 sentences on scope of the change for this file.
- \`### Mechanics\` — Line-by-line / logical walkthrough: control flow, data structures, APIs, config, scripts, dependencies, error handling, I/O, build tooling implied by the diff. Concrete behaviors only.
- \`### Intent\` — What problem or goal this likely addresses; assumptions encoded.
- \`### Codebase impact\` — Verdict: **net positive**, **neutral**, or **net negative** for maintainability, correctness, security, performance, observability, portability, testability — with reasoning, tradeoffs, debt added or removed.
- \`### Risks & follow-ups\` — Regression vectors, edge cases, rollout/migration, what to verify in review (tests, manual checks, compat).

**Markdown style:** Use bullet/numbered lists, \`###\` / \`##\` headings as needed, **bold** for verdicts and critical terms, tables if they clarify comparisons, and fenced \`\`\`lang code blocks\`\`\` for multi-line code or shell; inline \`backticks\` for paths, flags, symbols.

Tone: precise, technical, peer-to-peer. Avoid marketing language and generic filler.`;
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
    await streamOllamaChat(
      url,
      {
        model: model || "llama3.2",
        messages: [{ role: "user", content: prompt }],
      },
      webContents,
      signal,
    );
    return;
  }

  if (provider === "lmstudio") {
    const url = `${normalizeBase(baseUrl)}/v1/chat/completions`;
    await streamLmStudioChat(
      url,
      {
        model: model || "local-model",
        messages: [{ role: "user", content: prompt }],
      },
      webContents,
      signal,
    );
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
      return content.trim();
    }

    if (provider === "lmstudio") {
      const url = `${normalizeBase(baseUrl)}/v1/chat/completions`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model || "local-model",
          temperature: 0.25,
          messages: [{ role: "user", content: prompt }],
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
      return content.trim();
    }

    throw new Error(`Unknown provider: ${provider}`);
  } finally {
    clearTimeout(t);
  }
}

async function summarizeChange(payload) {
  const prompt = buildSummarizePrompt(payload);
  return completeChat({
    provider: payload.provider,
    baseUrl: payload.baseUrl,
    model: payload.model,
    prompt,
  });
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
  });
  return { ok: true, reply: reply.slice(0, 200) };
}

module.exports = {
  summarizeChange,
  summarizeChangeStream,
  probeProvider,
  completeChat,
};
