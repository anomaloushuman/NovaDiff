"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { marked } = require("marked");

marked.setOptions({ gfm: true, breaks: false });

const NOVADIFF_DOCS = "novadiff-docs";
const DEFAULT_BUNDLE_KEY = "change-report";

const MERMAID_ESM =
  "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs";
const WORKSPACE_SECTION_HEADINGS = [
  "Workspace overview — roots, comparison intent, scale of change",
  "Change landscape — interpret counts, dominant extensions, depth hotspots, risk intuition",
  "Subsystem map — group paths into coherent areas (config, tests, app, infra, vendor…) using only evidence from the sample paths and top segments",
  "Cross-cutting concerns — security, build/release, migrations, observability (flag unknowns honestly)",
  "Documentation & tooling gaps — what would require Doxygen/clangd/tree-sitter or runtime profiling to validate",
  "Suggested verification — tests, manual checks, staged rollout",
];
const CODEBASE_SECTION_HEADINGS = [
  "Repository overview",
  "Architectural layout",
  "Key subsystems",
  "Dependency signals",
  "Operational considerations",
  "Documentation gaps",
  "Suggested onboarding and verification",
];
const COMMON_SHORT_HEADINGS = [
  "Overview",
  "Key changes",
  "Impact",
  "Risks & follow-ups",
  "Selected change",
  "Semantic context",
];
const KNOWN_SECTION_HEADINGS = [
  ...WORKSPACE_SECTION_HEADINGS,
  ...CODEBASE_SECTION_HEADINGS,
  ...COMMON_SHORT_HEADINGS,
];

function bundleKeyOf(bundle) {
  const raw = String(bundle?.bundleKey ?? bundle?.docMode ?? DEFAULT_BUNDLE_KEY).trim();
  return raw || DEFAULT_BUNDLE_KEY;
}

function bundleBaseDir(root, bundleOrKey) {
  const bundleKey =
    typeof bundleOrKey === "string" ? bundleOrKey : bundleKeyOf(bundleOrKey);
  return path.join(root, NOVADIFF_DOCS, bundleKey);
}

function bundleModeMeta(bundle) {
  switch (bundleKeyOf(bundle)) {
    case "codebase-baseline":
      return {
        bundleLabel: "Baseline codebase",
        overviewTitle: "Explore the baseline codebase bundle",
        overviewBody:
          "Review the full-codebase narrative, structural metrics, and heuristic diagrams for the baseline tree.",
        narrativeTitle: "Baseline codebase narrative",
        narrativeSubtitle:
          "Repository-level documentation for the baseline tree, grounded in the heuristic codebase scan.",
        metricsTitle: "Baseline codebase metrics",
        metricsSubtitle:
          "Structural repository metrics for the baseline tree, styled for quick scanning.",
        diagramsTitle: "Baseline codebase diagrams",
        diagramsSubtitle:
          "Heuristic architecture and dependency diagrams for the baseline tree.",
        releaseTitle: "Baseline release rollup",
        releaseSubtitle:
          "A PR-style rollup of deterministic signals and saved summary context for the baseline bundle.",
        primaryDiagramTitle: "File extension mix",
        secondaryDiagramTitle: "Directory depth",
      };
    case "codebase-target":
      return {
        bundleLabel: "Target codebase",
        overviewTitle: "Explore the target codebase bundle",
        overviewBody:
          "Review the full-codebase narrative, structural metrics, and heuristic diagrams for the target tree.",
        narrativeTitle: "Target codebase narrative",
        narrativeSubtitle:
          "Repository-level documentation for the target tree, grounded in the heuristic codebase scan.",
        metricsTitle: "Target codebase metrics",
        metricsSubtitle:
          "Structural repository metrics for the target tree, styled for quick scanning.",
        diagramsTitle: "Target codebase diagrams",
        diagramsSubtitle:
          "Heuristic architecture and dependency diagrams for the target tree.",
        releaseTitle: "Target release rollup",
        releaseSubtitle:
          "A PR-style rollup of deterministic signals and saved summary context for the target bundle.",
        primaryDiagramTitle: "File extension mix",
        secondaryDiagramTitle: "Directory depth",
      };
    default:
      return {
        bundleLabel: "Change report",
        overviewTitle: "Explore the compare bundle",
        overviewBody:
          "Review the AI narrative, change metrics, and interactive diagrams from one place.",
        narrativeTitle: "AI project narrative",
        narrativeSubtitle:
          "Readable long-form documentation for the compare, with section navigation and cleaner Markdown rendering.",
        metricsTitle: "Compare metrics",
        metricsSubtitle:
          "Quantitative signals for the compare, styled for quicker scanning and anchored navigation.",
        diagramsTitle: "Diagrams",
        diagramsSubtitle:
          "Interactive diagrams generated from the compare and the target-tree heuristic scan.",
        releaseTitle: "Release / PR rollup",
        releaseSubtitle:
          "A searchable handoff page with deterministic risk signals, confidence badges, and saved summaries.",
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

function escapeRegex(s) {
  return String(s ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countMatches(text, pattern) {
  return String(text ?? "").match(pattern)?.length ?? 0;
}

function normalizeMalformedCodeFences(source) {
  let out = String(source ?? "").replace(/\r\n?/g, "\n");
  out = out.replace(/([^\n])```(?=(?:mermaid|markdown|md|text|txt|diff)\b)/gi, "$1\n\n```");
  out = out.replace(/```(mermaid|markdown|md|text|txt|diff)(?=\S)/gi, "```$1\n");
  out = out.replace(/([^\n])```(?=[A-Z0-9`])/g, "$1\n```\n\n");
  return out;
}

function looksLikeRawDiffDump(text) {
  const sample = String(text ?? "").toLowerCase();
  if (sample.length < 80) {
    return false;
  }
  const styleHits = countMatches(sample, /equal|added|removed|empty/g);
  const rowHits = countMatches(
    sample,
    /\d{1,4}\s*\d{0,4}\s*(?:equal|added|removed|empty)/g,
  );
  const digitHits = countMatches(sample, /\d/g);
  return rowHits >= 3 || (styleHits >= 6 && digitHits >= 10);
}

function normalizeFenceChunk(chunk) {
  const match = String(chunk ?? "").match(/^```([^\n`]*)\n?([\s\S]*?)```$/);
  if (!match) {
    return chunk;
  }
  const rawLang = String(match[1] ?? "").trim();
  const body = String(match[2] ?? "").trim();
  const lang = rawLang.replace(/[^a-z0-9_-].*$/i, "");
  if (lang.toLowerCase() !== "mermaid" && looksLikeRawDiffDump(body)) {
    return "\n\n_Raw diff excerpt omitted from saved summary._\n\n";
  }
  if (!body) {
    return "";
  }
  return `\`\`\`${lang}\n${body}\n\`\`\``;
}

function normalizeCompactListMarkers(block) {
  let out = String(block ?? "");
  out = out.replace(/(Summary)(\d+)(:)/g, "$1 $2$3");
  out = out.replace(/([^\n*])([*+])\s+(?=[A-Z0-9`\[])/g, "$1\n$2 ");
  out = out.replace(/([^\n])\n([*+]\s)/g, "$1\n\n$2");
  out = out.replace(/([*+]\s[^\n]+?)(?=(?:[*+]\s))/g, "$1\n");
  return out;
}

function injectMermaidFences(md) {
  return String(md ?? "").replace(
    /```mermaid\s*\n([\s\S]*?)```/gi,
    (_, code) =>
      `<pre class="mermaid">${escapeMermaidForHtml(String(code).trim())}</pre>`,
  );
}

function normalizeMarkdownDocument(md) {
  function promoteKnownHeadings(chunk) {
    let out = String(chunk ?? "");
    out = out.replace(
      /(##\s+[^\n#]+?)(?=(?:\s*###|\s*##|```|$|(?<!\*)[*+]\s))/g,
      "$1\n\n",
    );
    out = out.replace(
      /(###\s+[^\n#]+?)(?=(?:\s*###|\s*##|```|$|(?<!\*)[*+]\s))/g,
      "$1\n\n",
    );
    for (const heading of KNOWN_SECTION_HEADINGS) {
      const escaped = escapeRegex(heading);
      out = out.replace(
        new RegExp(`\\s*###\\s*(${escaped})(?=[A-Z0-9\`])`, "g"),
        (_match, matchedHeading) => `\n\n### ${matchedHeading}\n\n`,
      );
      out = out.replace(
        new RegExp(`(^|\\n)\\s*(?:###\\s+)?(${escaped})(?=\\s|$)`, "g"),
        (_match, prefix, matchedHeading) => `${prefix}### ${matchedHeading}\n\n`,
      );
      out = out.replace(
        new RegExp(`([^#\\n])(${escaped})(?=[A-Z0-9\`])`, "g"),
        (_match, prefix, matchedHeading) =>
          `${prefix}\n\n### ${matchedHeading}\n\n`,
      );
    }
    return out;
  }
  function splitDenseParagraphs(chunk) {
    const trimmed = String(chunk ?? "").trim();
    if (!trimmed || trimmed.length < 560) {
      return chunk;
    }
    if (/^(#{1,6}\s|[-*]\s|\d+\.\s|```|>|<|\|)/.test(trimmed)) {
      return chunk;
    }
    const sentences = trimmed.split(/(?<=[.!?])\s+(?=[A-Z0-9`])/);
    if (sentences.length < 4) {
      return chunk;
    }
    const groups = [];
    for (let index = 0; index < sentences.length; index += 2) {
      groups.push(sentences.slice(index, index + 2).join(" ").trim());
    }
    return groups.join("\n\n");
  }
  function normalizeChunk(chunk) {
    let out = String(chunk ?? "").replace(/\r\n?/g, "\n").trim();
    out = promoteKnownHeadings(out);
    out = out.replace(/([^#\n])(?=(?:##|###)\s)/g, "$1\n\n");
    out = normalizeCompactListMarkers(out);
    out = out.replace(/([^\n])\n(#{2,6}\s)/g, "$1\n\n$2");
    out = out.replace(/(#{2,6}[^\n]+)\n(?!\n|#|[-*] |\d+\. |>|\|)/g, "$1\n\n");
    out = out
      .split(/\n{2,}/)
      .map((part) => splitDenseParagraphs(part))
      .join("\n\n");
    out = out.replace(/\n{3,}/g, "\n\n");
    return out;
  }
  const normalizedSource = normalizeMalformedCodeFences(md);
  return normalizedSource
    .split(/(```[\s\S]*?```)/g)
    .map((chunk, index) =>
      index % 2 === 1 ? normalizeFenceChunk(chunk) : normalizeChunk(chunk),
    )
    .join("")
    .trim();
}

function stripTags(html) {
  return String(html ?? "").replace(/<[^>]+>/g, "");
}

function slugify(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function addHeadingAnchors(html) {
  const seen = new Map();
  return String(html ?? "").replace(/<(h[1-3])>([\s\S]*?)<\/\1>/g, (match, tag, body) => {
    const plain = stripTags(body).replace(/\s+/g, " ").trim();
    if (!plain) {
      return match;
    }
    const base = slugify(plain) || "section";
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    const id = n === 0 ? base : `${base}-${n + 1}`;
    return `<${tag} id="${id}"><a class="heading-anchor" href="#${id}" aria-label="Link to ${escapeHtml(plain)}">#</a>${body}</${tag}>`;
  });
}

function markdownToHtml(md) {
  const normalized = normalizeMarkdownDocument(md || "_Empty._");
  const withM = injectMermaidFences(normalized);
  return addHeadingAnchors(marked.parse(withM));
}

function mermaidSection(title, def) {
  const body = escapeMermaidForHtml(String(def || "").trim());
  const titleId = slugify(title) || "diagram";
  if (!body) {
    return `<section class="viz-card"><h2 id="${titleId}">${escapeHtml(title)}</h2><p><em>(empty)</em></p></section>`;
  }
  return `<section class="viz-card"><h2 id="${titleId}">${escapeHtml(title)}</h2><pre class="mermaid">${body}</pre></section>`;
}

const SHARED_CSS = `
  * { box-sizing: border-box; }
  :root {
    color-scheme: dark;
    --page-bg: #07101a;
    --page-bg-a: rgba(56, 217, 255, 0.08);
    --page-bg-b: rgba(155, 125, 255, 0.08);
    --page-text: #e8edf8;
    --page-link: #7ee7ff;
    --page-top-bg: rgba(10, 16, 24, 0.9);
    --page-top-muted: #8ea2c0;
    --page-subtle: #97a6bc;
    --page-chip-text: #b4c0d3;
    --page-nav-bg: rgba(10, 16, 24, 0.72);
    --page-nav-link: #d6e2f2;
    --page-nav-active: #f2f7ff;
    --page-card-border: rgba(255, 255, 255, 0.08);
    --page-card-start: rgba(20, 28, 40, 0.92);
    --page-card-end: rgba(11, 17, 26, 0.94);
    --page-card-shadow: 0 18px 60px rgba(0, 0, 0, 0.28);
    --page-toc-title: #93a7c1;
    --page-toc-link: #bcc9db;
    --page-toc-link-subtle: #96aac4;
    --page-hero-text: #a7b4c7;
    --page-link-card-text: #9eb0c6;
    --page-md-text: #dce6f3;
    --page-md-heading: #f6f9ff;
    --page-md-heading-soft: #e8f1fb;
    --page-heading-anchor: #82e6ff;
    --page-quote-text: #afbed2;
    --page-pre-bg: rgba(7, 11, 18, 0.86);
    --page-code-bg: rgba(255, 255, 255, 0.06);
    --page-table-head-text: #ecf3fd;
    --page-empty-text: #9fb0c6;
    --page-empty-bg: rgba(255, 255, 255, 0.035);
  }
  @media (prefers-color-scheme: light) {
    :root {
      color-scheme: light;
      --page-bg: #eef4fb;
      --page-bg-a: rgba(13, 167, 215, 0.09);
      --page-bg-b: rgba(120, 93, 247, 0.08);
      --page-text: #162235;
      --page-link: #0d8fba;
      --page-top-bg: rgba(255, 255, 255, 0.88);
      --page-top-muted: #5f7289;
      --page-subtle: #617489;
      --page-chip-text: #44556b;
      --page-nav-bg: rgba(245, 248, 253, 0.82);
      --page-nav-link: #203149;
      --page-nav-active: #162235;
      --page-card-border: rgba(20, 32, 51, 0.1);
      --page-card-start: rgba(255, 255, 255, 0.96);
      --page-card-end: rgba(243, 247, 252, 0.98);
      --page-card-shadow: 0 18px 54px rgba(26, 46, 72, 0.12);
      --page-toc-title: #5d7187;
      --page-toc-link: #4b5d72;
      --page-toc-link-subtle: #698097;
      --page-hero-text: #596d84;
      --page-link-card-text: #617389;
      --page-md-text: #223247;
      --page-md-heading: #122033;
      --page-md-heading-soft: #223247;
      --page-heading-anchor: #0d8fba;
      --page-quote-text: #506379;
      --page-pre-bg: rgba(237, 243, 251, 0.98);
      --page-code-bg: rgba(20, 32, 51, 0.07);
      --page-table-head-text: #122033;
      --page-empty-text: #5d7187;
      --page-empty-bg: rgba(20, 32, 51, 0.04);
    }
  }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    background:
      radial-gradient(circle at top, var(--page-bg-a), transparent 28%),
      radial-gradient(circle at 85% 10%, var(--page-bg-b), transparent 30%),
      var(--page-bg);
    color: var(--page-text);
    line-height: 1.65;
    font-size: 15px;
  }
  a { color: var(--page-link); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .shell { min-height: 100vh; }
  .top {
    position: sticky;
    top: 0;
    z-index: 20;
    padding: 20px 24px 18px;
    border-bottom: 1px solid var(--page-card-border);
    background: var(--page-top-bg);
    backdrop-filter: blur(18px);
  }
  .top-kicker {
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--page-top-muted);
    margin-bottom: 8px;
  }
  .top-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
  }
  .top h1 {
    margin: 0;
    font-size: clamp(1.35rem, 2vw, 1.9rem);
    font-weight: 750;
    letter-spacing: -0.03em;
  }
  .top-subtitle {
    margin: 8px 0 0;
    max-width: 70ch;
    color: var(--page-subtle);
    font-size: 0.95rem;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
    min-width: 220px;
  }
  .meta-chip {
    padding: 7px 10px;
    border-radius: 999px;
    border: 1px solid var(--page-card-border);
    background: var(--page-code-bg);
    color: var(--page-chip-text);
    font-size: 0.78rem;
    white-space: nowrap;
  }
  nav.page-nav {
    position: sticky;
    top: 108px;
    z-index: 18;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 14px 24px;
    background: var(--page-nav-bg);
    border-bottom: 1px solid var(--page-card-border);
    backdrop-filter: blur(16px);
  }
  nav.page-nav a {
    padding: 8px 14px;
    border-radius: 999px;
    background: var(--page-code-bg);
    border: 1px solid var(--page-card-border);
    color: var(--page-nav-link);
    font-weight: 600;
    font-size: 0.82rem;
  }
  nav.page-nav a:hover {
    background: rgba(56, 217, 255, 0.12);
    color: #8eeaff;
    text-decoration: none;
  }
  nav.page-nav a.active {
    background: linear-gradient(135deg, rgba(56, 217, 255, 0.18), rgba(155, 125, 255, 0.16));
    border-color: rgba(126, 231, 255, 0.28);
    color: var(--page-nav-active);
    box-shadow: 0 0 0 1px rgba(126, 231, 255, 0.12) inset;
  }
  main.content {
    max-width: 1320px;
    margin: 0 auto;
    padding: 28px 24px 40px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 280px;
    gap: 24px;
    align-items: start;
  }
  main.content.no-toc {
    grid-template-columns: minmax(0, 1fr);
  }
  .content-main { min-width: 0; display: grid; gap: 18px; }
  .content-side { min-width: 0; }
  .content-card,
  .toc-card,
  .viz-card,
  .hero-card,
  .link-card {
    border-radius: 18px;
    border: 1px solid var(--page-card-border);
    background:
      linear-gradient(180deg, var(--page-card-start) 0%, var(--page-card-end) 100%);
    box-shadow:
      var(--page-card-shadow),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }
  .content-card,
  .viz-card,
  .hero-card {
    padding: 24px 26px;
  }
  .toc-card {
    position: sticky;
    top: 170px;
    padding: 18px;
    max-height: calc(100vh - 190px);
    overflow: auto;
  }
  .toc-title {
    margin: 0 0 10px;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--page-toc-title);
    font-weight: 700;
  }
  .toc {
    display: grid;
    gap: 6px;
  }
  .toc a {
    display: block;
    padding: 7px 10px;
    border-radius: 10px;
    color: var(--page-toc-link);
    font-size: 0.84rem;
    line-height: 1.35;
  }
  .toc a.level-3 {
    padding-left: 20px;
    font-size: 0.8rem;
    color: var(--page-toc-link-subtle);
  }
  .toc a:hover {
    background: rgba(255, 255, 255, 0.05);
    text-decoration: none;
  }
  .hero-card h2 {
    margin: 0 0 8px;
    font-size: clamp(1.2rem, 1.7vw, 1.5rem);
    line-height: 1.2;
  }
  .hero-card p {
    margin: 0;
    color: var(--page-hero-text);
    max-width: 72ch;
  }
  .overview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
    margin-top: 18px;
  }
  .link-card {
    display: block;
    padding: 18px;
    color: inherit;
    text-decoration: none;
    transition: transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
  }
  .link-card:hover {
    transform: translateY(-1px);
    border-color: rgba(126, 231, 255, 0.24);
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.32);
    text-decoration: none;
  }
  .link-card h3 {
    margin: 0 0 6px;
    font-size: 1rem;
  }
  .link-card p {
    margin: 0;
    color: var(--page-link-card-text);
    font-size: 0.9rem;
  }
  .md {
    font-size: 1rem;
    color: var(--page-md-text);
    overflow-wrap: anywhere;
  }
  .md > :first-child { margin-top: 0; }
  .md > :last-child { margin-bottom: 0; }
  .md p, .md ul, .md ol, .md blockquote, .md table, .md pre {
    margin: 0 0 1rem;
  }
  .md p, .md li {
    max-width: 82ch;
  }
  .md h1, .md h2, .md h3 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 1.45em;
    margin-bottom: 0.6em;
    color: var(--page-md-heading);
    line-height: 1.2;
    scroll-margin-top: 165px;
  }
  .md h1 { font-size: 1.7rem; }
  .md h2 { font-size: 1.2rem; }
  .md h3 { font-size: 1rem; color: var(--page-md-heading-soft); }
  .heading-anchor {
    opacity: 0;
    color: var(--page-heading-anchor);
    font-size: 0.78em;
    text-decoration: none;
    transition: opacity 120ms ease;
  }
  .md h1:hover .heading-anchor,
  .md h2:hover .heading-anchor,
  .md h3:hover .heading-anchor,
  .md h1:focus-within .heading-anchor,
  .md h2:focus-within .heading-anchor,
  .md h3:focus-within .heading-anchor {
    opacity: 1;
  }
  .md ul, .md ol {
    padding-left: 1.35rem;
  }
  .md li + li {
    margin-top: 0.38rem;
  }
  .md blockquote {
    padding: 12px 16px;
    border-left: 3px solid rgba(126, 231, 255, 0.45);
    background: rgba(255, 255, 255, 0.035);
    color: var(--page-quote-text);
    border-radius: 0 12px 12px 0;
  }
  .md pre {
    background: var(--page-pre-bg);
    padding: 15px 16px;
    border-radius: 14px;
    overflow: auto;
    border: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 0.84rem;
    white-space: pre-wrap;
  }
  .md code {
    background: var(--page-code-bg);
    padding: 2px 6px;
    border-radius: 6px;
    font-size: 0.86em;
  }
  .md pre code { background: none; padding: 0; }
  .md table {
    display: block;
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
    max-width: 100%;
    overflow: auto;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 0.9rem;
  }
  .md th, .md td {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding: 10px 12px;
    text-align: left;
    vertical-align: top;
  }
  .md th {
    background: rgba(255, 255, 255, 0.05);
    color: var(--page-table-head-text);
    font-weight: 700;
  }
  .md tr:last-child td { border-bottom: none; }
  .viz-card + .viz-card { margin-top: 18px; }
  .viz-card h2 {
    margin: 0 0 12px;
    font-size: 1.02rem;
  }
  .mermaid {
    margin: 0;
    overflow-x: auto;
    padding: 8px 0 2px;
  }
  .empty-state {
    padding: 16px 18px;
    color: var(--page-empty-text);
    background: var(--page-empty-bg);
    border-radius: 14px;
  }
  .filter-bar {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .filter-input {
    width: min(420px, 100%);
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid var(--page-card-border);
    background: var(--page-code-bg);
    color: var(--page-text);
    font: inherit;
  }
  .badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 14px;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    border-radius: 999px;
    border: 1px solid var(--page-card-border);
    background: var(--page-code-bg);
    font-size: 0.8rem;
  }
  .badge.good { color: #82e6b5; }
  .badge.neutral { color: var(--page-chip-text); }
  .badge.warn { color: #ffd089; }
  .release-grid {
    display: grid;
    gap: 14px;
  }
  .release-card {
    border-radius: 16px;
    border: 1px solid var(--page-card-border);
    background: var(--page-code-bg);
    padding: 16px 18px;
  }
  .release-card h3 {
    margin: 0 0 8px;
    font-size: 1rem;
  }
  .release-card p {
    margin: 0 0 10px;
    color: var(--page-subtle);
  }
  .release-card ul {
    margin: 0;
    padding-left: 1.2rem;
  }
  .release-card[hidden] {
    display: none !important;
  }
  .release-link {
    font-weight: 700;
  }
  @media (max-width: 1180px) {
    nav.page-nav { top: 132px; }
    main.content,
    main.content.no-toc {
      grid-template-columns: minmax(0, 1fr);
    }
    .toc-card {
      position: static;
    }
  }
  @media (max-width: 720px) {
    .top, nav.page-nav, main.content { padding-left: 16px; padding-right: 16px; }
    .content-card, .viz-card, .hero-card { padding: 18px; }
    .meta { justify-content: flex-start; }
  }
`;

function navHtml(active) {
  const items = [
    ["index.html", "Overview"],
    ["narrative.html", "Narrative"],
    ["metrics.html", "Metrics"],
    ["diagrams.html", "Diagrams"],
    ["release.html", "Release"],
  ];
  return items
    .map(([href, label]) => {
      const cls = href === active ? ' class="active"' : "";
      return `<a href="${escapeHtml(href)}"${cls}>${escapeHtml(label)}</a>`;
    })
    .join("\n    ");
}

function buildEnhancementScript({ runMermaid, withToc }) {
  const mermaidBlock = runMermaid
    ? `
  import mermaid from "${MERMAID_ESM}";
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  mermaid.initialize({
    startOnLoad: false,
    theme: prefersDark ? "dark" : "default",
    securityLevel: "strict",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
  });
  try {
    await mermaid.run({ querySelector: ".mermaid" });
  } catch (e) {
    console.error(e);
  }`
    : "";
  const tocBlock = withToc
    ? `
  const tocRoot = document.querySelector("[data-toc]");
  if (tocRoot) {
    const headings = Array.from(document.querySelectorAll(".md h2[id], .md h3[id], .viz-card h2[id]"));
    if (headings.length === 0) {
      tocRoot.innerHTML = '<div class="empty-state">No sections detected.</div>';
    } else {
      tocRoot.innerHTML = headings
        .map((heading) => {
          const level = heading.tagName.toLowerCase();
          return '<a class="level-' + level.slice(1) + '" href="#' + heading.id + '">' + heading.textContent + "</a>";
        })
        .join("");
    }
  }`
    : "";
  const filterBlock = `
  const filterInput = document.querySelector("[data-filter-input]");
  if (filterInput instanceof HTMLInputElement) {
    const targets = Array.from(document.querySelectorAll("[data-filter-target]"));
    const applyFilter = () => {
      const query = filterInput.value.trim().toLowerCase();
      targets.forEach((node) => {
        const text = String(node.getAttribute("data-filter-text") || node.textContent || "").toLowerCase();
        node.toggleAttribute("hidden", Boolean(query) && !text.includes(query));
      });
    };
    filterInput.addEventListener("input", applyFilter);
    applyFilter();
  }`;
  return `<script type="module">${mermaidBlock}${tocBlock}${filterBlock}
</script>`;
}

function wrapPage({ title, activeNav, bodyInner, runMermaid, withToc = false, subtitle = "" }) {
  const mode = bundleModeMeta(_bundleStrings);
  const meta = [
    `<span class="meta-chip">Bundle: ${escapeHtml(mode.bundleLabel)}</span>`,
    `<span class="meta-chip">Baseline: ${escapeHtml(bundleMetaLine("leftTitle"))}</span>`,
    `<span class="meta-chip">Target: ${escapeHtml(bundleMetaLine("rightTitle"))}</span>`,
    `<span class="meta-chip">Generated: ${escapeHtml(bundleMetaLine("generatedAt"))}</span>`,
  ].join("");
  const script = buildEnhancementScript({ runMermaid, withToc });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(title)} · NovaDiff</title>
  <style>${SHARED_CSS}</style>
</head>
<body>
  <div class="shell">
  <header class="top">
    <div class="top-kicker">NovaDiff documentation</div>
    <div class="top-row">
      <div>
        <h1>${escapeHtml(title)}</h1>
        ${subtitle ? `<p class="top-subtitle">${escapeHtml(subtitle)}</p>` : ""}
      </div>
      <div class="meta">${meta}</div>
    </div>
  </header>
  <nav class="page-nav">
    ${navHtml(activeNav)}
  </nav>
  <main class="content${withToc ? "" : " no-toc"}">
    <div class="content-main">
      ${bodyInner}
    </div>
    ${
      withToc
        ? `<aside class="content-side"><section class="toc-card"><div class="toc-title">On this page</div><nav class="toc" data-toc></nav></section></aside>`
        : ""
    }
  </main>
  </div>
${script}
</body>
</html>`;
}

/** @type {Record<string, string>} */
let _bundleStrings = {};

function bundleMetaLine(key) {
  return String(_bundleStrings[key] ?? "");
}

/**
 * @param {object} bundle
 */
function buildIndexHtml(bundle) {
  const mode = bundleModeMeta(bundle);
  _bundleStrings = {
    bundleKey: bundleKeyOf(bundle),
    leftTitle: bundle.leftTitle || "Baseline",
    rightTitle: bundle.rightTitle || "Target",
    generatedAt: bundle.generatedAt || new Date().toISOString(),
  };
  const inner = `<section class="hero-card">
    <h2>${escapeHtml(mode.overviewTitle)}</h2>
    <p>${escapeHtml(mode.overviewBody)} These HTML pages are written under <code>novadiff-docs/${escapeHtml(bundleKeyOf(bundle))}/</code>.</p>
    <div class="overview-grid">
      <a class="link-card" href="narrative.html">
        <h3>Narrative</h3>
        <p>Read the editorial walkthrough with section anchors and richer typography.</p>
      </a>
      <a class="link-card" href="metrics.html">
        <h3>Metrics</h3>
        <p>Inspect counts, folder distribution, and summarized structural signals.</p>
      </a>
      <a class="link-card" href="diagrams.html">
        <h3>Diagrams</h3>
        <p>Browse Mermaid-powered charts, import graphs, call graphs, and type sketches.</p>
      </a>
      <a class="link-card" href="release.html">
        <h3>Release</h3>
        <p>Scan deterministic risk signals, confidence badges, and saved file summaries in one place.</p>
      </a>
    </div>
  </section>
  <section class="content-card md">
    <h2>Bundle outputs</h2>
    <ul>
      <li><code>narrative.html</code> for the generated project narrative</li>
      <li><code>metrics.html</code> for compare metrics and supporting summaries</li>
      <li><code>diagrams.html</code> for interactive Mermaid visualizations</li>
      <li><code>release.html</code> for searchable release and PR handoff notes</li>
      <li><code>NovaDiff-Documentation.pdf</code> and <code>NovaDiff-Diagrams.pdf</code> for printable exports</li>
    </ul>
  </section>`;
  return wrapPage({
    title: `${mode.bundleLabel} bundle`,
    activeNav: "index.html",
    bodyInner: inner,
    runMermaid: false,
    withToc: false,
    subtitle: "A polished overview of the generated bundle and the quickest paths into the report.",
  });
}

function buildNarrativeHtml(bundle) {
  const mode = bundleModeMeta(bundle);
  _bundleStrings = {
    bundleKey: bundleKeyOf(bundle),
    leftTitle: bundle.leftTitle || "",
    rightTitle: bundle.rightTitle || "",
    generatedAt: bundle.generatedAt || "",
  };
  const inner = `<article class="content-card md">${markdownToHtml(bundle.aiMarkdown)}</article>`;
  return wrapPage({
    title: mode.narrativeTitle,
    activeNav: "narrative.html",
    bodyInner: inner,
    runMermaid: true,
    withToc: true,
    subtitle: mode.narrativeSubtitle,
  });
}

function buildMetricsHtml(bundle) {
  const mode = bundleModeMeta(bundle);
  _bundleStrings = {
    bundleKey: bundleKeyOf(bundle),
    leftTitle: bundle.leftTitle || "",
    rightTitle: bundle.rightTitle || "",
    generatedAt: bundle.generatedAt || "",
  };
  const inner = `<article class="content-card md">${markdownToHtml(bundle.compareMetricsMd)}</article>`;
  return wrapPage({
    title: mode.metricsTitle,
    activeNav: "metrics.html",
    bodyInner: inner,
    runMermaid: false,
    withToc: true,
    subtitle: mode.metricsSubtitle,
  });
}

function buildDiagramsHtml(bundle) {
  const mode = bundleModeMeta(bundle);
  _bundleStrings = {
    bundleKey: bundleKeyOf(bundle),
    leftTitle: bundle.leftTitle || "",
    rightTitle: bundle.rightTitle || "",
    generatedAt: bundle.generatedAt || "",
  };
  const inner = [
    mermaidSection(mode.primaryDiagramTitle, bundle.changeMixMermaid),
    mermaidSection(mode.secondaryDiagramTitle, bundle.depthMermaid),
    mermaidSection("Module import graph (relative imports)", bundle.importGraphMermaid),
    mermaidSection(
      "Cross-file calls (heuristic)",
      bundle.crossFileCallGraphMermaid,
    ),
    mermaidSection("Types / classes (regex sketch)", bundle.classDiagramMermaid),
  ].join("\n");
  return wrapPage({
    title: mode.diagramsTitle,
    activeNav: "diagrams.html",
    bodyInner: inner,
    runMermaid: true,
    withToc: true,
    subtitle: mode.diagramsSubtitle,
  });
}

function buildReleaseHtml(bundle) {
  const mode = bundleModeMeta(bundle);
  _bundleStrings = {
    bundleKey: bundleKeyOf(bundle),
    leftTitle: bundle.leftTitle || "",
    rightTitle: bundle.rightTitle || "",
    generatedAt: bundle.generatedAt || "",
  };
  const badges = Array.isArray(bundle.confidenceBadges) ? bundle.confidenceBadges : [];
  const riskSignals = Array.isArray(bundle.riskSignals) ? bundle.riskSignals : [];
  const summaries = Array.isArray(bundle.summaryIndex) ? bundle.summaryIndex : [];
  const badgeHtml = badges.length
    ? `<div class="badge-row">${badges
        .map(
          (badge) =>
            `<span class="badge ${escapeHtml(String(badge.tone ?? "neutral"))}">${escapeHtml(
              String(badge.label ?? "Badge"),
            )}</span>`,
        )
        .join("")}</div>`
    : `<div class="empty-state">No confidence badges were stored for this bundle.</div>`;
  const riskHtml = riskSignals.length
    ? riskSignals
        .map((signal) => {
          const evidence = Array.isArray(signal.evidence) ? signal.evidence : [];
          const relPath = typeof signal.rel_path === "string" ? signal.rel_path : "";
          const filterText = [signal.title, signal.category, relPath, ...evidence]
            .filter(Boolean)
            .join(" ");
          return `<article class="release-card" data-filter-target data-filter-text="${escapeHtml(
            filterText,
          )}">
            <h3>${escapeHtml(String(signal.title ?? "Risk signal"))}</h3>
            <p>${escapeHtml(String(signal.category ?? "risk"))} · ${escapeHtml(
              String(signal.severity ?? "medium"),
            )} · ${escapeHtml(String(signal.confidence ?? "medium"))} confidence${
              relPath ? ` · \`${escapeHtml(relPath)}\`` : ""
            }</p>
            ${
              evidence.length > 0
                ? `<ul>${evidence
                    .map((item) => `<li>${escapeHtml(String(item ?? ""))}</li>`)
                    .join("")}</ul>`
                : `<div class="empty-state">No evidence lines captured.</div>`
            }
          </article>`;
        })
        .join("\n")
    : `<div class="empty-state">No deterministic risk signals were stored for this bundle.</div>`;
  const summaryHtml = summaries.length
    ? summaries
        .map((entry) => {
          const relPath = String(entry.relPath ?? "").trim();
          const href =
            typeof entry.htmlRelPath === "string" && entry.htmlRelPath.trim()
              ? entry.htmlRelPath.trim()
              : null;
          const badges = Array.isArray(entry.badges) ? entry.badges : [];
          const filterText = [relPath, entry.kind, entry.markdown, ...badges.map((badge) => badge.label)]
            .filter(Boolean)
            .join(" ");
          return `<article class="release-card" data-filter-target data-filter-text="${escapeHtml(
            filterText,
          )}">
            <h3>${escapeHtml(relPath || "summary")}</h3>
            <p>${escapeHtml(String(entry.kind ?? "modified"))}</p>
            ${
              badges.length > 0
                ? `<div class="badge-row">${badges
                    .map(
                      (badge) =>
                        `<span class="badge ${escapeHtml(
                          String(badge.tone ?? "neutral"),
                        )}">${escapeHtml(String(badge.label ?? "Badge"))}</span>`,
                    )
                    .join("")}</div>`
                : ""
            }
            <div class="md">${markdownToHtml(String(entry.markdown ?? ""))}</div>
            ${
              href
                ? `<p><a class="release-link" href="${escapeHtml(href)}">Open saved summary HTML</a></p>`
                : ""
            }
          </article>`;
        })
        .join("\n")
    : `<div class="empty-state">No saved file summaries were stored for this bundle.</div>`;
  const selectionHtml = Array.isArray(bundle.selectionIndex) && bundle.selectionIndex.length > 0
    ? bundle.selectionIndex
        .slice(0, 40)
        .map((entry) => {
          const relPath = String(entry.relPath ?? "").trim();
          const label = String(entry.label ?? "Selection");
          const htmlRelPath =
            typeof entry.htmlRelPath === "string" && entry.htmlRelPath.trim()
              ? entry.htmlRelPath.trim()
              : null;
          const filterText = [relPath, label, entry.markdown].filter(Boolean).join(" ");
          return `<article class="release-card" data-filter-target data-filter-text="${escapeHtml(
            filterText,
          )}">
            <h3>${escapeHtml(relPath)}</h3>
            <p>${escapeHtml(label)}</p>
            <div class="md">${markdownToHtml(String(entry.markdown ?? ""))}</div>
            ${
              htmlRelPath
                ? `<p><a class="release-link" href="${escapeHtml(
                    htmlRelPath,
                  )}">Open saved selection HTML</a></p>`
                : ""
            }
          </article>`;
        })
        .join("\n")
    : `<div class="empty-state">No saved selected-diff documents were stored for this bundle.</div>`;
  const inner = [
    `<article class="content-card md">${markdownToHtml(bundle.releaseOverviewMd)}</article>`,
    `<section class="content-card">
      <h2>Interactive release explorer</h2>
      <div class="filter-bar">
        <input
          class="filter-input"
          type="search"
          placeholder="Filter risk signals, summaries, and selection docs"
          data-filter-input
        />
      </div>
      <h3>Confidence badges</h3>
      ${badgeHtml}
      <h3>Deterministic risk signals</h3>
      <div class="release-grid">${riskHtml}</div>
      <h3>Saved file summaries</h3>
      <div class="release-grid">${summaryHtml}</div>
      <h3>Saved selection docs</h3>
      <div class="release-grid">${selectionHtml}</div>
    </section>`,
  ].join("\n");
  return wrapPage({
    title: mode.releaseTitle,
    activeNav: "release.html",
    bodyInner: inner,
    runMermaid: false,
    withToc: true,
    subtitle: mode.releaseSubtitle,
  });
}

async function readIfExists(abs) {
  try {
    return await fs.readFile(abs, "utf8");
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "ENOENT") {
      return "";
    }
    throw e;
  }
}

function readBundleMetaFromReadme(readme) {
  const text = String(readme ?? "");
  const pick = (label) => {
    const re = new RegExp(`\\*\\*${escapeRegex(label)}:\\*\\*\\s+(.+?)(?:\\s+—\\s+\`[^\`]*\`)?\\s*$`, "m");
    const match = text.match(re);
    return match ? match[1].trim() : "";
  };
  return {
    leftTitle: pick("Baseline"),
    rightTitle: pick("Target"),
    generatedAt: pick("Generated"),
  };
}

async function readNovadiffDocsBundle(targetRoot, bundleKey = DEFAULT_BUNDLE_KEY) {
  const root = String(targetRoot ?? "").trim();
  if (!root) {
    throw new Error("Missing targetRoot");
  }
  const base = bundleBaseDir(root, bundleKey);
  const diagrams = path.join(base, "diagrams");
  const [
    readme,
    aiMarkdown,
    compareMetricsMd,
    releaseOverviewMd,
    codebaseOutlineText,
    riskSignalsText,
    summaryIndexText,
    selectionIndexText,
    confidenceBadgesText,
    changeMixMermaid,
    depthMermaid,
    importGraphMermaid,
    crossFileCallGraphMermaid,
    classDiagramMermaid,
  ] = await Promise.all([
    readIfExists(path.join(base, "README.md")),
    readIfExists(path.join(base, "AI_PROJECT_DOC.md")),
    readIfExists(path.join(base, "COMPARE_METRICS.md")),
    readIfExists(path.join(base, "RELEASE_OVERVIEW.md")),
    readIfExists(path.join(base, "codebase-outline.json")),
    readIfExists(path.join(base, "risk-signals.json")),
    readIfExists(path.join(base, "summary-index.json")),
    readIfExists(path.join(base, "selection-index.json")),
    readIfExists(path.join(base, "confidence-badges.json")),
    readIfExists(path.join(diagrams, "change-mix.mmd")),
    readIfExists(path.join(diagrams, "depth-distribution.mmd")),
    readIfExists(path.join(diagrams, "module-imports.mmd")),
    readIfExists(path.join(diagrams, "cross-file-calls.mmd")),
    readIfExists(path.join(diagrams, "types-classes.mmd")),
  ]);
  let codebaseOutline = {};
  if (codebaseOutlineText.trim()) {
    try {
      codebaseOutline = JSON.parse(codebaseOutlineText);
    } catch {
      codebaseOutline = {};
    }
  }
  const parseJsonOr = (text, fallback) => {
    try {
      return text.trim() ? JSON.parse(text) : fallback;
    } catch {
      return fallback;
    }
  };
  const riskSignals = parseJsonOr(riskSignalsText, []);
  const summaryIndex = parseJsonOr(summaryIndexText, []);
  const selectionIndex = parseJsonOr(selectionIndexText, []);
  const confidenceBadges = parseJsonOr(confidenceBadgesText, []);
  return {
    targetRoot: root,
    bundleKey,
    docMode: bundleKey,
    aiMarkdown,
    compareMetricsMd,
    releaseOverviewMd,
    codebaseOutline,
    riskSignals,
    summaryIndex,
    selectionIndex,
    confidenceBadges,
    changeMixMermaid,
    depthMermaid,
    importGraphMermaid,
    crossFileCallGraphMermaid,
    classDiagramMermaid,
    ...readBundleMetaFromReadme(readme),
  };
}

async function refreshNovadiffDocsHtmlFromDisk(targetRoot, bundleKey = DEFAULT_BUNDLE_KEY) {
  const bundle = await readNovadiffDocsBundle(targetRoot, bundleKey);
  await writeNovadiffDocsHtml(bundle);
}

/**
 * Writes interactive HTML alongside the Markdown bundle.
 * @param {object} bundle same shape as writeNovadiffDocsBundle
 */
async function writeNovadiffDocsHtml(bundle) {
  const root = bundle?.targetRoot?.trim?.();
  if (!root) {
    throw new Error("Missing targetRoot");
  }
  const base = bundleBaseDir(root, bundle);
  await fs.mkdir(base, { recursive: true });

  const files = [
    ["index.html", buildIndexHtml(bundle)],
    ["narrative.html", buildNarrativeHtml(bundle)],
    ["metrics.html", buildMetricsHtml(bundle)],
    ["diagrams.html", buildDiagramsHtml(bundle)],
    ["release.html", buildReleaseHtml(bundle)],
  ];
  for (const [name, html] of files) {
    await fs.writeFile(path.join(base, name), html, "utf8");
  }
}

module.exports = {
  writeNovadiffDocsHtml,
  refreshNovadiffDocsHtmlFromDisk,
  normalizeMarkdownDocument,
  NOVADIFF_DOCS,
};
