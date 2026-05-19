import type { ChangeKind, FileChange } from "./types";

export interface ExtensionCount {
  ext: string;
  count: number;
}

export interface DocWorkspaceMetrics {
  byKind: Record<ChangeKind, number>;
  extensionCounts: ExtensionCount[];
  maxDepth: number;
  /** depth (1 = root file) -> count */
  depthHistogram: { depth: number; count: number }[];
  topRoots: { name: string; count: number }[];
  /** Bounded list for LLM / tables */
  samplePaths: string[];
}

const SAMPLE_CAP = 120;

function fileExtension(rel: string): string {
  const s = rel.replace(/\\/g, "/");
  const base = s.includes("/") ? s.slice(s.lastIndexOf("/") + 1) : s;
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) {
    return "(no ext)";
  }
  return base.slice(dot).toLowerCase();
}

function firstSegment(rel: string): string {
  const s = rel.replace(/\\/g, "/").replace(/^\/+/, "");
  const i = s.indexOf("/");
  return i === -1 ? "." : s.slice(0, i);
}

export function buildDocWorkspaceMetrics(rows: FileChange[]): DocWorkspaceMetrics {
  const byKind: Record<ChangeKind, number> = {
    added: 0,
    removed: 0,
    modified: 0,
  };
  const extMap = new Map<string, number>();
  let maxDepth = 0;
  const depthMap = new Map<number, number>();
  const rootMap = new Map<string, number>();
  const samplePaths: string[] = [];

  for (const r of rows) {
    byKind[r.kind] += 1;
    const ext = fileExtension(r.path);
    extMap.set(ext, (extMap.get(ext) ?? 0) + 1);
    const depth = r.path.replace(/\\/g, "/").split("/").filter(Boolean).length;
    maxDepth = Math.max(maxDepth, depth);
    depthMap.set(depth, (depthMap.get(depth) ?? 0) + 1);
    const root = firstSegment(r.path);
    rootMap.set(root, (rootMap.get(root) ?? 0) + 1);
    if (samplePaths.length < SAMPLE_CAP) {
      samplePaths.push(r.path);
    }
  }

  const extensionCounts: ExtensionCount[] = [...extMap.entries()]
    .map(([ext, count]) => ({ ext, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 24);

  const depthHistogram = [...depthMap.entries()]
    .map(([depth, count]) => ({ depth, count }))
    .sort((a, b) => a.depth - b.depth);

  const topRoots = [...rootMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 16);

  return {
    byKind,
    extensionCounts,
    maxDepth,
    depthHistogram,
    topRoots,
    samplePaths,
  };
}

/** When set, the LLM sees how many compare paths were dropped by root gitignore rules. */
export interface GitignorePromptMeta {
  inputTotal: number;
  skippedGitignore: number;
}

export function metricsToPromptContext(
  metrics: DocWorkspaceMetrics,
  leftTitle: string,
  rightTitle: string,
  leftRoot: string,
  rightRoot: string,
  total: number,
  gitignore?: GitignorePromptMeta | null,
  codebaseOutline?: string | null,
): string {
  const extLines = metrics.extensionCounts
    .slice(0, 16)
    .map((e) => `- ${e.ext}: ${e.count}`)
    .join("\n");
  const depthLines = metrics.depthHistogram
    .map((d) => `- depth ${d.depth}: ${d.count} paths`)
    .join("\n");
  const rootLines = metrics.topRoots
    .map((t) => `- ${t.name}/: ${t.count}`)
    .join("\n");
  const samples = metrics.samplePaths.join("\n");
  const gitignoreLine =
    gitignore && gitignore.skippedGitignore > 0
      ? `Gitignore: compare reported ${gitignore.inputTotal} changed path(s); ${gitignore.skippedGitignore} omitted under baseline and/or target root .gitignore or .git/info/exclude; ${total} path(s) below drive the metrics and samples.`
      : null;
  const outlineBlock =
    codebaseOutline && codebaseOutline.trim().length > 0
      ? [
          "Target codebase outline (heuristic scan of the target tree on disk: extensions, top-level segments, resolved relative JS/TS imports, symbol regex hints). Not a full AST or call graph — treat as orientation only:",
          codebaseOutline.trim().slice(0, 11_000),
        ]
      : [];
  return [
    `Baseline folder label: ${leftTitle}`,
    `Baseline path: ${leftRoot}`,
    `Target folder label: ${rightTitle}`,
    `Target path: ${rightRoot}`,
    `Total changed paths: ${total}`,
    ...(gitignoreLine ? [gitignoreLine] : []),
    `By kind — added: ${metrics.byKind.added}, removed: ${metrics.byKind.removed}, modified: ${metrics.byKind.modified}`,
    `Max path depth (segments): ${metrics.maxDepth}`,
    "Depth histogram:",
    depthLines || "- (empty)",
    "Top first path segments (coarse “module” buckets):",
    rootLines || "- (empty)",
    "Top extensions among changed files:",
    extLines || "- (empty)",
    `Sample of up to ${metrics.samplePaths.length} relative paths (not exhaustive):`,
    samples || "- (empty)",
    ...outlineBlock,
  ].join("\n");
}

export function buildCompareMetricsMarkdown(
  metrics: DocWorkspaceMetrics,
  docRows: FileChange[],
  leftTitle: string,
  rightTitle: string,
): string {
  const body = docRows
    .slice(0, 80)
    .map((r) => `- **${r.kind}** \`${r.path}\``)
    .join("\n");
  return [
    "# Compare metrics",
    "",
    "| Metric | Count |",
    "| --- | --- |",
    `| Added | ${metrics.byKind.added} |`,
    `| Removed | ${metrics.byKind.removed} |`,
    `| Modified | ${metrics.byKind.modified} |`,
    "",
    `**Baseline:** ${leftTitle}`,
    "",
    `**Target:** ${rightTitle}`,
    "",
    "## Changed paths (sample, up to 80)",
    "",
    body || "_none_",
  ].join("\n");
}

export function changeKindPieMermaid(metrics: DocWorkspaceMetrics): string {
  const a = metrics.byKind.added;
  const r = metrics.byKind.removed;
  const m = metrics.byKind.modified;
  return [
    "pie showData",
    `    title Change kinds`,
    `    "Added" : ${a}`,
    `    "Removed" : ${r}`,
    `    "Modified" : ${m}`,
  ].join("\n");
}

export function depthBarMermaid(metrics: DocWorkspaceMetrics): string {
  const rows = metrics.depthHistogram.slice(0, 12);
  if (rows.length === 0) {
    return "flowchart LR\n  empty[No path depth data]";
  }
  const labels = rows.map((d) => `d${d.depth}`);
  const values = rows.map((d) => d.count);
  const maxVal = Math.max(...values, 1);
  const yMax = Math.max(maxVal, Math.ceil(maxVal * 1.15));
  return [
    "xychart-beta",
    '    title "Path depth (segments)"',
    `    x-axis [${labels.map((l) => `"${l}"`).join(", ")}]`,
    `    y-axis "paths" 0 --> ${yMax}`,
    `    bar [${values.join(", ")}]`,
  ].join("\n");
}
