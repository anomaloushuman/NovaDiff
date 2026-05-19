const KNOWN_SECTION_HEADINGS = [
  "Workspace overview — roots, comparison intent, scale of change",
  "Change landscape — interpret counts, dominant extensions, depth hotspots, risk intuition",
  "Subsystem map — group paths into coherent areas (config, tests, app, infra, vendor…) using only evidence from the sample paths and top segments",
  "Cross-cutting concerns — security, build/release, migrations, observability (flag unknowns honestly)",
  "Documentation & tooling gaps — what would require Doxygen/clangd/tree-sitter or runtime profiling to validate",
  "Suggested verification — tests, manual checks, staged rollout",
  "Repository overview",
  "Architectural layout",
  "Key subsystems",
  "Dependency signals",
  "Operational considerations",
  "Suggested onboarding and verification",
  "Overview",
  "Key changes",
  "Impact",
  "Risks & follow-ups",
  "Selected change",
  "Semantic context",
];

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countMatches(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}

function normalizeMalformedCodeFences(source: string): string {
  let out = String(source ?? "").replace(/\r\n?/g, "\n");
  out = out.replace(/([^\n])```(?=(?:mermaid|markdown|md|text|txt|diff)\b)/gi, "$1\n\n```");
  out = out.replace(/```(mermaid|markdown|md|text|txt|diff)(?=\S)/gi, "```$1\n");
  out = out.replace(/([^\n])```(?=[A-Z0-9`])/g, "$1\n```\n\n");
  return out;
}

function looksLikeRawDiffDump(text: string): boolean {
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

function normalizeFenceChunk(chunk: string): string {
  const match = String(chunk ?? "").match(/^```([^\n`]*)\n?([\s\S]*?)```$/);
  if (!match) {
    return chunk;
  }
  const rawLang = (match[1] ?? "").trim();
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

function normalizeCompactListMarkers(block: string): string {
  let out = block;
  out = out.replace(/(Summary)(\d+)(:)/g, "$1 $2$3");
  out = out.replace(/([^\n*])([*+])\s+(?=[A-Z0-9`\[])/g, "$1\n$2 ");
  out = out.replace(/([^\n])\n([*+]\s)/g, "$1\n\n$2");
  out = out.replace(/([*+]\s[^\n]+?)(?=(?:[*+]\s))/g, "$1\n");
  return out;
}

function promoteKnownHeadings(block: string): string {
  let out = block;
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

function splitDenseParagraphs(block: string): string {
  const trimmed = block.trim();
  if (!trimmed || trimmed.length < 560) {
    return block;
  }
  if (/^(#{1,6}\s|[-*]\s|\d+\.\s|```|>|<|\|)/.test(trimmed)) {
    return block;
  }
  const sentences = trimmed.split(/(?<=[.!?])\s+(?=[A-Z0-9`])/);
  if (sentences.length < 4) {
    return block;
  }
  const groups: string[] = [];
  for (let index = 0; index < sentences.length; index += 2) {
    groups.push(sentences.slice(index, index + 2).join(" ").trim());
  }
  return groups.join("\n\n");
}

function normalizeMarkdownChunk(chunk: string): string {
  let out = chunk.replace(/\r\n?/g, "\n").trim();
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

export function normalizeGeneratedMarkdown(source: string): string {
  const normalizedSource = normalizeMalformedCodeFences(source);
  return normalizedSource
    .split(/(```[\s\S]*?```)/g)
    .map((chunk, index) =>
      index % 2 === 1 ? normalizeFenceChunk(chunk) : normalizeMarkdownChunk(chunk),
    )
    .join("")
    .trim();
}
