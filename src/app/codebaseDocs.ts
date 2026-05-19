import type { CodebaseOutline } from "./types";

function sampleFilePaths(outline: CodebaseOutline, cap = 60): string[] {
  const files = Array.isArray(outline.files) ? outline.files : [];
  return files
    .map((file) => String(file.path ?? "").trim())
    .filter(Boolean)
    .slice(0, cap);
}

function sampleSymbolLines(outline: CodebaseOutline, cap = 40): string[] {
  const entries = Array.isArray(outline.symbol_spans_by_file)
    ? outline.symbol_spans_by_file
    : [];
  const out: string[] = [];
  for (const entry of entries) {
    if (out.length >= cap) {
      break;
    }
    const path = String(entry.path ?? "").trim();
    const names = Array.isArray(entry.symbols)
      ? entry.symbols
          .slice(0, 10)
          .map((symbol) => `${symbol.kind} ${symbol.name}`)
          .join(", ")
      : "";
    if (path && names) {
      out.push(`- ${path}: ${names}`);
    }
  }
  return out;
}

function depthHistogram(outline: CodebaseOutline): Array<{ depth: number; count: number }> {
  const files = Array.isArray(outline.files) ? outline.files : [];
  const map = new Map<number, number>();
  for (const file of files) {
    const depth = Number(file.depth ?? 0);
    if (depth > 0) {
      map.set(depth, (map.get(depth) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([depth, count]) => ({ depth, count }))
    .sort((a, b) => a.depth - b.depth);
}

export function buildCodebasePromptContext(
  outline: CodebaseOutline,
  rootLabel: string,
  rootPath: string,
  perspective: "baseline" | "target",
): string {
  const extLines = (outline.by_extension ?? [])
    .slice(0, 16)
    .map((entry) => `- ${entry.ext}: ${entry.count}`)
    .join("\n");
  const topDirLines = (outline.top_directories ?? [])
    .slice(0, 14)
    .map((entry) => `- ${entry.name}/: ${entry.count}`)
    .join("\n");
  const stackLines = (outline.detected_projects ?? [])
    .slice(0, 16)
    .map((entry) => `- ${entry.kind ?? "unknown"}: ${(entry.markers ?? []).join(", ")}`)
    .join("\n");
  const fileLines = sampleFilePaths(outline).map((file) => `- ${file}`).join("\n");
  const symbolLines = sampleSymbolLines(outline).join("\n");
  const histogramLines = depthHistogram(outline)
    .map((entry) => `- depth ${entry.depth}: ${entry.count} files`)
    .join("\n");
  return [
    `Codebase perspective: ${perspective}`,
    `Repository label: ${rootLabel}`,
    `Repository path: ${rootPath}`,
    `Total indexed files: ${outline.total_files ?? 0}`,
    `Resolved relative import edges: ${Array.isArray(outline.import_edges) ? outline.import_edges.length : 0}`,
    `Cross-file call edges (heuristic): ${
      Array.isArray(outline.cross_file_call_edges) ? outline.cross_file_call_edges.length : 0
    }`,
    "Top extensions:",
    extLines || "- (empty)",
    "Top first-level directories:",
    topDirLines || "- (empty)",
    "Directory depth histogram:",
    histogramLines || "- (empty)",
    "Detected project stacks:",
    stackLines || "- (none detected)",
    "Sample files:",
    fileLines || "- (empty)",
    "Sample symbol spans:",
    symbolLines || "- (no symbol span hints)",
  ].join("\n");
}

export function buildCodebaseMetricsMarkdown(
  outline: CodebaseOutline,
  rootLabel: string,
  rootPath: string,
  perspective: "baseline" | "target",
): string {
  const importCount = Array.isArray(outline.import_edges) ? outline.import_edges.length : 0;
  const callCount = Array.isArray(outline.cross_file_call_edges)
    ? outline.cross_file_call_edges.length
    : 0;
  const symbolFiles = Array.isArray(outline.symbol_spans_by_file)
    ? outline.symbol_spans_by_file.length
    : 0;
  const topExtensions = (outline.by_extension ?? [])
    .slice(0, 20)
    .map((entry) => `| \`${entry.ext}\` | ${entry.count} |`)
    .join("\n");
  const topDirectories = (outline.top_directories ?? [])
    .slice(0, 20)
    .map((entry) => `| \`${entry.name}\` | ${entry.count} |`)
    .join("\n");
  const stacks = (outline.detected_projects ?? [])
    .slice(0, 24)
    .map((entry) => `- **${entry.kind ?? "unknown"}**: ${(entry.markers ?? []).join(", ")}`)
    .join("\n");
  const files = sampleFilePaths(outline, 80).map((file) => `- \`${file}\``).join("\n");
  return [
    `# ${perspective === "baseline" ? "Baseline" : "Target"} codebase metrics`,
    "",
    `**Repository:** ${rootLabel}`,
    "",
    `**Path:** \`${rootPath}\``,
    "",
    "| Metric | Value |",
    "| --- | --- |",
    `| Indexed files | ${outline.total_files ?? 0} |`,
    `| Symbol-bearing files | ${symbolFiles} |`,
    `| Relative import edges | ${importCount} |`,
    `| Cross-file call edges (heuristic) | ${callCount} |`,
    "",
    "## Top extensions",
    "",
    "| Extension | Count |",
    "| --- | --- |",
    topExtensions || "| _(none)_ | 0 |",
    "",
    "## Top directories",
    "",
    "| Directory | Files |",
    "| --- | --- |",
    topDirectories || "| _(none)_ | 0 |",
    "",
    "## Detected project stacks",
    "",
    stacks || "_None detected_",
    "",
    "## Sample files",
    "",
    files || "_No files indexed_",
  ].join("\n");
}

export function codebaseExtensionPieMermaid(outline: CodebaseOutline): string {
  const entries = (outline.by_extension ?? []).slice(0, 8);
  if (entries.length === 0) {
    return "flowchart LR\n  empty[No extension data]";
  }
  return [
    "pie showData",
    "    title File extensions",
    ...entries.map((entry) => `    "${entry.ext}" : ${entry.count}`),
  ].join("\n");
}

export function codebaseDepthMermaid(outline: CodebaseOutline): string {
  const rows = depthHistogram(outline).slice(0, 14);
  if (rows.length === 0) {
    return "flowchart LR\n  empty[No file depth data]";
  }
  return [
    "flowchart TB",
    ...rows.map((row, index) => `    d${index}["depth ${row.depth} (${row.count})"]`),
  ].join("\n");
}
