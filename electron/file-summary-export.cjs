"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { marked } = require("marked");
const { htmlToPdfFile } = require("./novadiff-docs-pdf.cjs");
const { normalizeMarkdownDocument } = require("./novadiff-docs-html.cjs");

marked.setOptions({ gfm: true, breaks: false });

const MERMAID_ESM =
  "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs";

const NOVADIFF_DOCS = "novadiff-docs";
const SELECTIONS_DIR = "selections";

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeMermaidForHtml(s) {
  return String(s ?? "")
    .replace(/<\/script/gi, "<\\/script")
    .replace(/<!--/g, "<\\!--");
}

function injectMermaidFences(md) {
  return String(md ?? "").replace(
    /```mermaid\s*\n([\s\S]*?)```/gi,
    (_, code) =>
      `<pre class="mermaid">${escapeMermaidForHtml(String(code).trim())}</pre>`,
  );
}

function markdownToHtml(md) {
  const normalized = normalizeMarkdownDocument(md || "_Empty._");
  const withM = injectMermaidFences(normalized);
  return marked.parse(withM);
}

function isReservedNovadiffRel(relPath) {
  const s = String(relPath ?? "").replace(/\\/g, "/").replace(/^\/+/, "");
  return s === NOVADIFF_DOCS || s.startsWith(`${NOVADIFF_DOCS}/`);
}

/**
 * @param {string} relPath
 * @returns {string[]}
 */
function safeSummarySegments(relPath) {
  const norm = String(relPath || "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (!norm || norm.includes("\0")) {
    throw new Error("invalid relPath");
  }
  if (isReservedNovadiffRel(norm)) {
    throw new Error("reserved path");
  }
  const parts = norm.split("/").filter(Boolean);
  if (parts.length === 0) {
    throw new Error("empty path");
  }
  if (parts.length > 48) {
    throw new Error("path too deep");
  }
  for (const p of parts) {
    if (p === "." || p === "..") {
      throw new Error("invalid segment");
    }
    if (/[<>:"|?*\x00-\x1f]/.test(p)) {
      throw new Error("invalid segment");
    }
    if (p.length > 180) {
      throw new Error("segment too long");
    }
  }
  return parts;
}

const MAX_ABS = process.platform === "win32" ? 220 : 400;

/**
 * @param {string} targetRoot
 * @param {string} relPath
 */
function resolveSummaryDirAbs(targetRoot, relPath) {
  const norm = String(relPath || "").replace(/\\/g, "/").replace(/^\/+/, "");
  const summariesRoot = path.join(targetRoot, NOVADIFF_DOCS, "summaries");
  try {
    const segs = safeSummarySegments(norm);
    const cand = path.join(summariesRoot, ...segs);
    if (cand.length > MAX_ABS) {
      throw new Error("path too long");
    }
    return cand;
  } catch {
    const hash = crypto.createHash("sha256").update(norm).digest("hex");
    return path.join(summariesRoot, "_by-hash", hash);
  }
}

function safeArtifactSegment(raw) {
  const norm = String(raw || "").trim();
  if (norm && /^[A-Za-z0-9._-]{1,120}$/.test(norm)) {
    return norm;
  }
  return crypto.createHash("sha256").update(norm).digest("hex");
}

function resolveSelectionBaseDirAbs(targetRoot, relPath) {
  const norm = String(relPath || "").replace(/\\/g, "/").replace(/^\/+/, "");
  const selectionsRoot = path.join(targetRoot, NOVADIFF_DOCS, SELECTIONS_DIR);
  try {
    const segs = safeSummarySegments(norm);
    const cand = path.join(selectionsRoot, ...segs);
    if (cand.length > MAX_ABS) {
      throw new Error("path too long");
    }
    return cand;
  } catch {
    const hash = crypto.createHash("sha256").update(norm).digest("hex");
    return path.join(selectionsRoot, "_by-hash", hash);
  }
}

function resolveSelectionDirAbs(targetRoot, relPath, selectionKey) {
  const base = resolveSelectionBaseDirAbs(targetRoot, relPath);
  const seg = safeArtifactSegment(selectionKey);
  const cand = path.join(base, seg);
  if (cand.length <= MAX_ABS) {
    return cand;
  }
  return path.join(base, crypto.createHash("sha256").update(seg).digest("hex"));
}

const PAGE_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif;
    background: #0d1117; color: #e6edf3; line-height: 1.55; font-size: 14px; }
  .top { padding: 16px 20px; border-bottom: 1px solid #30363d; background: #161b22; }
  .top h1 { margin: 0 0 6px; font-size: 1.05rem; font-weight: 600; word-break: break-all; }
  .meta { font-size: 0.82rem; color: #8b949e; }
  main { padding: 18px 22px; max-width: 900px; }
  .md { font-size: 0.92rem; }
  .md h1, .md h2, .md h3 { margin-top: 1.1em; margin-bottom: 0.45em; color: #f0f6fc; }
  .md pre { background: #161b22; padding: 12px; border-radius: 8px; overflow: auto;
    border: 1px solid #30363d; font-size: 0.8rem; white-space: pre-wrap; }
  .md code { background: #21262d; padding: 2px 5px; border-radius: 4px; font-size: 0.85em; }
  .md pre code { background: none; padding: 0; }
  .md table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 0.86rem; }
  .md th, .md td { border: 1px solid #30363d; padding: 6px 8px; text-align: left; }
  .mermaid { margin: 14px 0; overflow-x: auto; }
`;

function buildFileSummaryDocument(meta) {
  const {
    relPath,
    kind,
    leftTitle,
    rightTitle,
    generatedAt,
    markdown,
  } = meta;
  const bodyHtml = markdownToHtml(markdown);
  const hasMermaid = /<pre class="mermaid">/.test(bodyHtml);
  const mermaidScript = hasMermaid
    ? `<script type="module">
  import mermaid from "${MERMAID_ESM}";
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "strict",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
  });
  try {
    await mermaid.run({ querySelector: ".mermaid" });
  } catch (e) {
    console.error(e);
  }
  window.__PDF_READY = true;
</script>`
    : "<script>window.__PDF_READY = true;</script>";

  const title = escapeHtml(relPath);
  const metaLine = [
    `Kind: ${escapeHtml(kind || "")}`,
    `Baseline: ${escapeHtml(leftTitle || "")}`,
    `Target: ${escapeHtml(rightTitle || "")}`,
    `Generated: ${escapeHtml(generatedAt || new Date().toISOString())}`,
  ].join(" · ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title} · NovaDiff summary</title>
  <style>${PAGE_CSS}</style>
</head>
<body>
  <header class="top">
    <h1>${title}</h1>
    <div class="meta">${metaLine}</div>
  </header>
  <main>
    <article class="md">${bodyHtml}</article>
  </main>
${mermaidScript}
</body>
</html>`;
}

function buildSelectionSummaryDocument(meta) {
  const {
    relPath,
    kind,
    leftTitle,
    rightTitle,
    generatedAt,
    markdown,
    label,
    requestedMode,
    effectiveMode,
    symbol,
  } = meta;
  const bodyHtml = markdownToHtml(markdown);
  const hasMermaid = /<pre class="mermaid">/.test(bodyHtml);
  const mermaidScript = hasMermaid
    ? `<script type="module">
  import mermaid from "${MERMAID_ESM}";
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "strict",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
  });
  try {
    await mermaid.run({ querySelector: ".mermaid" });
  } catch (e) {
    console.error(e);
  }
  window.__PDF_READY = true;
</script>`
    : "<script>window.__PDF_READY = true;</script>";

  const title = escapeHtml(`${relPath} · ${label || "Selected diff documentation"}`);
  const metaLine = [
    `Kind: ${escapeHtml(kind || "")}`,
    `Baseline: ${escapeHtml(leftTitle || "")}`,
    `Target: ${escapeHtml(rightTitle || "")}`,
    `Requested mode: ${escapeHtml(requestedMode || "exact")}`,
    `Effective mode: ${escapeHtml(effectiveMode || "exact")}`,
    symbol?.name ? `Symbol: ${escapeHtml(`${symbol.kind} ${symbol.name}`)}` : null,
    `Generated: ${escapeHtml(generatedAt || new Date().toISOString())}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title} · NovaDiff selection</title>
  <style>${PAGE_CSS}</style>
</head>
<body>
  <header class="top">
    <h1>${title}</h1>
    <div class="meta">${metaLine}</div>
  </header>
  <main>
    <article class="md">${bodyHtml}</article>
  </main>
${mermaidScript}
</body>
</html>`;
}

/**
 * Writes summary.md + summary.html + summary.pdf under novadiff-docs/summaries/… for one compared path.
 * @param {object} p
 * @param {string} p.targetRoot right tree root (where novadiff-docs lives)
 * @param {string} p.relPath compared relative path
 * @param {string} p.kind change kind
 * @param {string} [p.leftTitle]
 * @param {string} [p.rightTitle]
 * @param {string} p.markdown summary body
 */
async function exportFileSummaryArtifacts(p) {
  const targetRoot = String(p?.targetRoot ?? "").trim();
  const markdown = String(p?.markdown ?? "").trim();
  const relPath = String(p?.relPath ?? "").trim();
  if (!targetRoot) {
    throw new Error("Missing targetRoot");
  }
  if (!markdown) {
    return { ok: false, skipped: true, reason: "empty" };
  }
  if (!relPath || isReservedNovadiffRel(relPath)) {
    return { ok: false, skipped: true, reason: "reserved" };
  }

  const dirAbs = resolveSummaryDirAbs(targetRoot, relPath);
  await fs.mkdir(dirAbs, { recursive: true });
  if (dirAbs.includes(`${path.sep}_by-hash${path.sep}`)) {
    await fs.writeFile(
      path.join(dirAbs, "_source-rel.txt"),
      String(relPath).replace(/\\/g, "/"),
      "utf8",
    );
  }

  const html = buildFileSummaryDocument({
    relPath,
    kind: String(p?.kind ?? "modified"),
    leftTitle: p?.leftTitle,
    rightTitle: p?.rightTitle,
    generatedAt: p?.generatedAt,
    markdown,
  });
  const markdownPath = path.join(dirAbs, "summary.md");
  const htmlPath = path.join(dirAbs, "summary.html");
  const pdfPath = path.join(dirAbs, "summary.pdf");
  const metaPath = path.join(dirAbs, "meta.json");
  const meta = {
    relPath,
    kind: String(p?.kind ?? "modified"),
    leftTitle: p?.leftTitle,
    rightTitle: p?.rightTitle,
    generatedAt: p?.generatedAt ?? new Date().toISOString(),
    summaryEvidence: p?.summaryEvidence ?? null,
  };
  await fs.writeFile(markdownPath, `${markdown}\n`, "utf8");
  await fs.writeFile(htmlPath, html, "utf8");
  await fs.writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`, "utf8");

  let pdfWarning = null;
  try {
    await htmlToPdfFile(html, pdfPath, { landscape: false });
  } catch (e) {
    pdfWarning = e instanceof Error ? e.message : String(e);
  }

  return {
    ok: true,
    markdownPath,
    htmlPath,
    pdfPath,
    pdfWarning,
  };
}

/**
 * Reads any saved per-file Markdown summaries under novadiff-docs/summaries/.
 * Missing summaries are skipped.
 * @param {object} p
 * @param {string} p.targetRoot
 * @param {string[]} p.relPaths
 */
async function readFileSummaryMarkdowns(p) {
  const targetRoot = String(p?.targetRoot ?? "").trim();
  const relPaths = Array.isArray(p?.relPaths) ? p.relPaths : [];
  if (!targetRoot) {
    throw new Error("Missing targetRoot");
  }

  const items = await Promise.all(
    relPaths.map(async (rawRel) => {
      const relPath = String(rawRel ?? "").trim();
      if (!relPath || isReservedNovadiffRel(relPath)) {
        return null;
      }
      const dirAbs = resolveSummaryDirAbs(targetRoot, relPath);
      const mdPath = path.join(dirAbs, "summary.md");
      const metaPath = path.join(dirAbs, "meta.json");
      const htmlPath = path.join(dirAbs, "summary.html");
      try {
        const [markdown, metaRaw] = await Promise.all([
          fs.readFile(mdPath, "utf8"),
          fs.readFile(metaPath, "utf8").catch(() => ""),
        ]);
        if (!markdown.trim()) {
          return null;
        }
        let meta = null;
        if (metaRaw.trim()) {
          try {
            meta = JSON.parse(metaRaw);
          } catch {
            meta = null;
          }
        }
        return {
          relPath,
          kind: typeof meta?.kind === "string" ? meta.kind : undefined,
          markdown,
          badges: Array.isArray(meta?.summaryEvidence?.badges)
            ? meta.summaryEvidence.badges
            : undefined,
          htmlRelPath: path.relative(targetRoot, htmlPath).split(path.sep).join("/"),
        };
      } catch (e) {
        if (e && typeof e === "object" && e.code === "ENOENT") {
          return null;
        }
        throw e;
      }
    }),
  );
  return items.filter(Boolean);
}

/**
 * Writes a persisted selected-lines / symbol documentation artifact bundle.
 * @param {object} p
 */
async function exportSelectionSummaryArtifacts(p) {
  const targetRoot = String(p?.targetRoot ?? "").trim();
  const markdown = String(p?.markdown ?? "").trim();
  const relPath = String(p?.relPath ?? "").trim();
  const selectionKey = String(p?.selectionKey ?? "").trim();
  if (!targetRoot) {
    throw new Error("Missing targetRoot");
  }
  if (!markdown) {
    return { ok: false, skipped: true, reason: "empty" };
  }
  if (!relPath || isReservedNovadiffRel(relPath)) {
    return { ok: false, skipped: true, reason: "reserved" };
  }
  if (!selectionKey) {
    return { ok: false, skipped: true, reason: "missing-selection-key" };
  }

  const baseDirAbs = resolveSelectionBaseDirAbs(targetRoot, relPath);
  await fs.mkdir(baseDirAbs, { recursive: true });
  if (baseDirAbs.includes(`${path.sep}_by-hash${path.sep}`)) {
    await fs.writeFile(
      path.join(baseDirAbs, "_source-rel.txt"),
      String(relPath).replace(/\\/g, "/"),
      "utf8",
    );
  }
  const dirAbs = resolveSelectionDirAbs(targetRoot, relPath, selectionKey);
  await fs.mkdir(dirAbs, { recursive: true });
  const meta = {
    relPath,
    kind: String(p?.kind ?? "modified"),
    label: String(p?.label ?? "Selected diff documentation"),
    selectionKey,
    requestedMode: String(p?.requestedMode ?? "exact"),
    effectiveMode: String(p?.effectiveMode ?? "exact"),
    lineRanges: Array.isArray(p?.lineRanges) ? p.lineRanges : [],
    symbol: p?.symbol ?? null,
    leftTitle: p?.leftTitle,
    rightTitle: p?.rightTitle,
    generatedAt: p?.generatedAt ?? new Date().toISOString(),
  };
  const html = buildSelectionSummaryDocument({
    ...meta,
    markdown,
  });
  const markdownPath = path.join(dirAbs, "summary.md");
  const htmlPath = path.join(dirAbs, "summary.html");
  const pdfPath = path.join(dirAbs, "summary.pdf");
  const metaPath = path.join(dirAbs, "meta.json");
  await fs.writeFile(markdownPath, `${markdown}\n`, "utf8");
  await fs.writeFile(htmlPath, html, "utf8");
  await fs.writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`, "utf8");

  let pdfWarning = null;
  try {
    await htmlToPdfFile(html, pdfPath, { landscape: false });
  } catch (e) {
    pdfWarning = e instanceof Error ? e.message : String(e);
  }

  return {
    ok: true,
    markdownPath,
    htmlPath,
    pdfPath,
    pdfWarning,
  };
}

/**
 * Reads saved selected-lines / symbol docs under novadiff-docs/selections/.
 * @param {object} p
 * @param {string} p.targetRoot
 * @param {string[]} p.relPaths
 */
async function readSelectionSummaryMarkdowns(p) {
  const targetRoot = String(p?.targetRoot ?? "").trim();
  const relPaths = Array.isArray(p?.relPaths) ? p.relPaths : [];
  if (!targetRoot) {
    throw new Error("Missing targetRoot");
  }

  const groups = await Promise.all(
    relPaths.map(async (rawRel) => {
      const relPath = String(rawRel ?? "").trim();
      if (!relPath || isReservedNovadiffRel(relPath)) {
        return [];
      }
      const baseDir = resolveSelectionBaseDirAbs(targetRoot, relPath);
      let entries;
      try {
        entries = await fs.readdir(baseDir, { withFileTypes: true });
      } catch (e) {
        if (e && typeof e === "object" && e.code === "ENOENT") {
          return [];
        }
        throw e;
      }
      const items = await Promise.all(
        entries.map(async (entry) => {
          if (!entry.isDirectory()) {
            return null;
          }
          const dirAbs = path.join(baseDir, entry.name);
          try {
            const [markdown, metaRaw] = await Promise.all([
              fs.readFile(path.join(dirAbs, "summary.md"), "utf8"),
              fs.readFile(path.join(dirAbs, "meta.json"), "utf8"),
            ]);
            if (!markdown.trim()) {
              return null;
            }
            const meta = JSON.parse(metaRaw);
            return {
              relPath,
              kind: String(meta?.kind ?? "modified"),
              label: String(meta?.label ?? entry.name),
              selectionKey: String(meta?.selectionKey ?? entry.name),
              requestedMode: String(meta?.requestedMode ?? "exact"),
              effectiveMode: String(meta?.effectiveMode ?? "exact"),
              lineRanges: Array.isArray(meta?.lineRanges) ? meta.lineRanges : [],
              symbol: meta?.symbol ?? null,
              generatedAt: meta?.generatedAt,
              markdown,
              htmlRelPath: path
                .relative(targetRoot, path.join(dirAbs, "summary.html"))
                .split(path.sep)
                .join("/"),
            };
          } catch (e) {
            if (e && typeof e === "object" && e.code === "ENOENT") {
              return null;
            }
            throw e;
          }
        }),
      );
      return items.filter(Boolean);
    }),
  );
  const out = groups.flat();
  out.sort((a, b) => {
    const pathCmp = a.relPath.localeCompare(b.relPath);
    if (pathCmp !== 0) {
      return pathCmp;
    }
    return String(a.generatedAt ?? "").localeCompare(String(b.generatedAt ?? ""));
  });
  return out;
}

module.exports = {
  exportFileSummaryArtifacts,
  readFileSummaryMarkdowns,
  exportSelectionSummaryArtifacts,
  readSelectionSummaryMarkdowns,
  isReservedNovadiffRel,
};
