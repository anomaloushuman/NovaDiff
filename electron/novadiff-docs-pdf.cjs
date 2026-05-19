"use strict";

const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { BrowserWindow } = require("electron");
const { marked } = require("marked");

marked.setOptions({ gfm: true, breaks: false });

const MERMAID_ESM =
  "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs";
const DEFAULT_BUNDLE_KEY = "change-report";

function bundleKeyOf(bundle) {
  const raw = String(bundle?.bundleKey ?? bundle?.docMode ?? DEFAULT_BUNDLE_KEY).trim();
  return raw || DEFAULT_BUNDLE_KEY;
}

function bundleBaseDir(root, bundle) {
  return path.join(root, "novadiff-docs", bundleKeyOf(bundle));
}

function bundleModeMeta(bundle) {
  switch (bundleKeyOf(bundle)) {
    case "codebase-baseline":
      return {
        label: "Baseline codebase",
        narrativeTitle: "baseline codebase",
        metricsTitle: "Baseline codebase metrics",
        primaryDiagramTitle: "File extension mix",
        secondaryDiagramTitle: "Directory depth",
      };
    case "codebase-target":
      return {
        label: "Target codebase",
        narrativeTitle: "target codebase",
        metricsTitle: "Target codebase metrics",
        primaryDiagramTitle: "File extension mix",
        secondaryDiagramTitle: "Directory depth",
      };
    default:
      return {
        label: "Change report",
        narrativeTitle: "project",
        metricsTitle: "Compare metrics",
        primaryDiagramTitle: "Change mix",
        secondaryDiagramTitle: "Path depth",
      };
  }
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Avoid closing HTML script regions inside embedded Mermaid. */
function escapeMermaidForHtml(s) {
  return String(s ?? "")
    .replace(/<\/script/gi, "<\\/script")
    .replace(/<!--/g, "<\\!--");
}

function renderSymbolsTable(outline) {
  const arr = Array.isArray(outline?.symbols_by_file)
    ? outline.symbols_by_file
    : [];
  let rows = "";
  let n = 0;
  for (const entry of arr) {
    if (n >= 70) {
      break;
    }
    const p = escapeHtml(entry?.path ?? "");
    const syms = Array.isArray(entry?.symbols)
      ? entry.symbols.map((x) => escapeHtml(String(x))).join(", ")
      : "";
    rows += `<tr><td style="vertical-align:top"><code>${p}</code></td><td>${syms}</td></tr>`;
    n += 1;
  }
  if (!rows) {
    return "<p><em>No symbol hints in outline.</em></p>";
  }
  return `<table style="width:100%;font-size:8pt;border-collapse:collapse">
<thead><tr><th style="border:1px solid #ccc;padding:4px;width:38%">File</th><th style="border:1px solid #ccc;padding:4px">Symbols / defs (regex)</th></tr></thead>
<tbody>${rows}</tbody></table>`;
}

function renderImportEdgesTable(outline) {
  const edges = Array.isArray(outline?.import_edges)
    ? outline.import_edges
    : [];
  let rows = "";
  let n = 0;
  for (const e of edges) {
    if (n >= 120) {
      break;
    }
    const from = escapeHtml(e?.from ?? "");
    const to = escapeHtml(e?.to ?? "");
    rows += `<tr><td><code>${from}</code></td><td><code>${to}</code></td></tr>`;
    n += 1;
  }
  if (!rows) {
    return "<p><em>No resolved relative import edges.</em></p>";
  }
  return `<table style="width:100%;font-size:8pt;border-collapse:collapse">
<thead><tr><th style="border:1px solid #ccc;padding:4px">From</th><th style="border:1px solid #ccc;padding:4px">To</th></tr></thead>
<tbody>${rows}</tbody></table>`;
}

function renderDetectedProjects(outline) {
  const arr = Array.isArray(outline?.detected_projects)
    ? outline.detected_projects
    : [];
  if (!arr.length) {
    return "<p><em>No marker-based stacks detected at repo root.</em></p>";
  }
  let rows = "";
  let n = 0;
  for (const p of arr) {
    if (n >= 28) {
      break;
    }
    const kind = escapeHtml(p?.kind ?? "");
    const markers = Array.isArray(p?.markers)
      ? p.markers.map((m) => escapeHtml(String(m))).join(", ")
      : "";
    rows += `<tr><td style="border:1px solid #ccc;padding:4px"><strong>${kind}</strong></td><td style="border:1px solid #ccc;padding:4px">${markers}</td></tr>`;
    n += 1;
  }
  return `<table style="width:100%;font-size:8pt;border-collapse:collapse">
<thead><tr><th style="border:1px solid #ccc;padding:4px;width:22%">Stack</th><th style="border:1px solid #ccc;padding:4px">Markers</th></tr></thead>
<tbody>${rows}</tbody></table>`;
}

function renderCrossFileCallEdges(outline) {
  const edges = Array.isArray(outline?.cross_file_call_edges)
    ? outline.cross_file_call_edges
    : [];
  let rows = "";
  let n = 0;
  for (const e of edges) {
    if (n >= 90) {
      break;
    }
    const from = escapeHtml(e?.from_file ?? "");
    const to = escapeHtml(e?.to_file ?? "");
    const via = escapeHtml(e?.via ?? "");
    rows += `<tr><td><code>${from}</code></td><td><code>${to}</code></td><td><code>${via}</code></td></tr>`;
    n += 1;
  }
  if (!rows) {
    return "<p><em>No unambiguous cross-file call edges (heuristic).</em></p>";
  }
  return `<table style="width:100%;font-size:8pt;border-collapse:collapse">
<thead><tr><th style="border:1px solid #ccc;padding:4px">From file</th><th style="border:1px solid #ccc;padding:4px">To file</th><th style="border:1px solid #ccc;padding:4px">Callee</th></tr></thead>
<tbody>${rows}</tbody></table>`;
}

function mermaidBlock(title, def) {
  const body = escapeMermaidForHtml(String(def || "").trim());
  if (!body) {
    return `<h3>${escapeHtml(title)}</h3><p><em>(empty)</em></p>`;
  }
  return `<h3>${escapeHtml(title)}</h3><pre class="mermaid">${body}</pre>`;
}

function buildMainPdfHtml(bundle) {
  const mode = bundleModeMeta(bundle);
  const outline = bundle.codebaseOutline ?? {};
  const aiMd = String(bundle.aiMarkdown ?? "");
  const cmpMd = String(bundle.compareMetricsMd ?? "");
  const aiHtml = marked.parse(aiMd || "_No narrative._");
  const cmpHtml = marked.parse(cmpMd || "_No metrics._");

  const pie = String(bundle.changeMixMermaid ?? "");
  const depth = String(bundle.depthMermaid ?? "");
  const imports = String(bundle.importGraphMermaid ?? "");
  const calls = String(bundle.crossFileCallGraphMermaid ?? "");
  const classes = String(bundle.classDiagramMermaid ?? "");

  const meta = [
    `Baseline: ${escapeHtml(bundle.leftTitle || "")}`,
    `Target: ${escapeHtml(bundle.rightTitle || "")}`,
    `Generated: ${escapeHtml(bundle.generatedAt || new Date().toISOString())}`,
  ].join("<br/>");

  const outlineJson = JSON.stringify(outline, null, 2);
  const jsonSnippet = escapeHtml(outlineJson.slice(0, 12_000));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>NovaDiff documentation</title>
  <style>
    @page { margin: 12mm; }
    body { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 10pt; line-height: 1.35; color: #111; max-width: 100%; }
    h1 { font-size: 17pt; page-break-after: avoid; }
    h2 { font-size: 13pt; margin-top: 1.1em; page-break-after: avoid; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    h3 { font-size: 11pt; margin-top: 0.9em; page-break-after: avoid; }
    .meta { background: #f6f8fa; padding: 10px; border-radius: 6px; margin-bottom: 14px; font-size: 9pt; }
    .break { page-break-before: always; }
    .md { font-size: 9.5pt; }
    .md pre { background: #f6f8fa; padding: 8px; overflow: auto; font-size: 8pt; white-space: pre-wrap; }
    .md code { background: #f0f0f0; padding: 1px 4px; border-radius: 3px; font-size: 8.5pt; }
    table { border-collapse: collapse; }
    .mermaid { font-size: 9pt; margin: 8px 0 16px; }
    .note { font-size: 8.5pt; color: #444; margin: 6px 0 12px; }
    pre.json { font-size: 7pt; background: #fafafa; padding: 8px; white-space: pre-wrap; max-height: none; }
  </style>
</head>
<body>
  <h1>NovaDiff — ${escapeHtml(mode.label)}</h1>
  <div class="meta">${meta}</div>
  <p class="note">Diagrams use Mermaid heuristics (imports, cross-file call guesses, type sketches). They are <strong>not</strong> compiler-grade call graphs. The module graph is file-to-file (JS/TS relative imports). The call graph links files when a callee name maps to exactly one definition in the repo (regex across many languages).</p>

  <h2 class="break">AI ${escapeHtml(mode.narrativeTitle)} narrative</h2>
  <div class="md">${aiHtml}</div>

  <h2 class="break">${escapeHtml(mode.metricsTitle)}</h2>
  <div class="md">${cmpHtml}</div>

  <h2 class="break">Detected stacks (marker files)</h2>
  ${renderDetectedProjects(outline)}
  <h2 class="break">Class / symbol index (heuristic)</h2>
  ${renderSymbolsTable(outline)}

  <h2 class="break">Module import edges (tabular)</h2>
  <p class="note">Use together with the flowchart in the Diagrams PDF for a &ldquo;call graph&rdquo;-style overview at module boundaries.</p>
  ${renderImportEdgesTable(outline)}

  <h2 class="break">Cross-file call edges (tabular)</h2>
  <p class="note">Edges appear only when a call site name uniquely resolves to a single definition path (very conservative).</p>
  ${renderCrossFileCallEdges(outline)}

  <h2 class="break">Codebase outline (JSON excerpt)</h2>
  <pre class="json">${jsonSnippet}${outlineJson.length > 12000 ? "\n… truncated …" : ""}</pre>

  <h2 class="break">Diagrams (Mermaid)</h2>
  ${mermaidBlock(mode.primaryDiagramTitle, pie)}
  ${mermaidBlock(mode.secondaryDiagramTitle, depth)}
  ${mermaidBlock("Module import graph (relative imports)", imports)}
  ${mermaidBlock("Cross-file calls (heuristic)", calls)}
  ${mermaidBlock("Types / classes (regex sketch)", classes)}

  <script type="module">
    import mermaid from "${MERMAID_ESM}";
    mermaid.initialize({
      startOnLoad: false,
      theme: "neutral",
      securityLevel: "strict",
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
    });
    try {
      await mermaid.run({ querySelector: ".mermaid" });
    } catch (e) {
      console.error(e);
    }
    window.__PDF_READY = true;
  </script>
</body>
</html>`;
}

function buildDiagramsPdfHtml(bundle) {
  const mode = bundleModeMeta(bundle);
  const pie = String(bundle.changeMixMermaid ?? "");
  const depth = String(bundle.depthMermaid ?? "");
  const imports = String(bundle.importGraphMermaid ?? "");
  const calls = String(bundle.crossFileCallGraphMermaid ?? "");
  const classes = String(bundle.classDiagramMermaid ?? "");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>NovaDiff diagrams</title>
  <style>
    @page { margin: 10mm; size: A4 landscape; }
    body { font-family: system-ui, sans-serif; font-size: 10pt; }
    h1 { font-size: 16pt; }
    h3 { page-break-after: avoid; }
    .break { page-break-before: always; }
    .mermaid { margin: 12px 0; }
  </style>
</head>
<body>
  <h1>NovaDiff — ${escapeHtml(mode.label)} diagram pack</h1>
  <p style="font-size:9pt;color:#444">Target: ${escapeHtml(bundle.rightTitle || "")} · ${escapeHtml(bundle.generatedAt || "")}</p>
  ${mermaidBlock(mode.primaryDiagramTitle, pie)}
  <div class="break"></div>
  ${mermaidBlock(mode.secondaryDiagramTitle, depth)}
  <div class="break"></div>
  ${mermaidBlock("Module import graph", imports)}
  <div class="break"></div>
  ${mermaidBlock("Cross-file calls (heuristic)", calls)}
  <div class="break"></div>
  ${mermaidBlock("Types / classes", classes)}
  <script type="module">
    import mermaid from "${MERMAID_ESM}";
    mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "strict" });
    try { await mermaid.run({ querySelector: ".mermaid" }); } catch (e) { console.error(e); }
    window.__PDF_READY = true;
  </script>
</body>
</html>`;
}

async function waitForPdfReady(webContents, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (Date.now() > deadline) {
      throw new Error("Timed out waiting for diagram render (check network for Mermaid CDN).");
    }
    const ok = await webContents
      .executeJavaScript("Boolean(window.__PDF_READY)")
      .catch(() => false);
    if (ok) {
      return;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}

/**
 * @param {string} html
 * @param {string} outPdfPath
 * @param {{ landscape?: boolean }} opts
 */
async function htmlToPdfFile(html, outPdfPath, opts = {}) {
  const win = new BrowserWindow({
    show: false,
    width: opts.landscape ? 1400 : 1100,
    height: opts.landscape ? 900 : 1400,
    webPreferences: {
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  });

  const dir = path.join(
    os.tmpdir(),
    "novadiff-pdf",
    `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  await fs.mkdir(dir, { recursive: true });
  const tmpHtml = path.join(dir, "bundle.html");
  await fs.writeFile(tmpHtml, html, "utf8");

  try {
    await win.loadURL(pathToFileURL(tmpHtml).href);
    await waitForPdfReady(win.webContents, 45_000);
    const data = await win.webContents.printToPDF({
      printBackground: true,
      landscape: Boolean(opts.landscape),
      pageSize: "A4",
      marginsType: 0,
    });
    await fs.writeFile(outPdfPath, data);
  } finally {
    win.destroy();
    try {
      await fs.unlink(tmpHtml);
      await fs.rm(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

/**
 * @param {object} bundle same shape as writeNovadiffDocsBundle
 * @param {string} _appRoot reserved for packaged asset resolution
 */
async function generateNovadiffDocsPdf(bundle, _appRoot) {
  const root = bundle?.targetRoot?.trim?.();
  if (!root) {
    throw new Error("Missing targetRoot for PDF.");
  }
  const base = bundleBaseDir(root, bundle);

  const mainPdf = path.join(base, "NovaDiff-Documentation.pdf");
  const diagramsPdf = path.join(base, "NovaDiff-Diagrams.pdf");

  const mainHtml = buildMainPdfHtml(bundle);
  await htmlToPdfFile(mainHtml, mainPdf, { landscape: false });

  const diagHtml = buildDiagramsPdfHtml(bundle);
  await htmlToPdfFile(diagHtml, diagramsPdf, { landscape: true });
}

module.exports = { generateNovadiffDocsPdf, htmlToPdfFile };
