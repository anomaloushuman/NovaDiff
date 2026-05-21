import type { FileChange } from "./types";

/** Mirrors graph-core ChangeAnalysis — kept local so the renderer does not import node:fs. */
export interface ChangeAnalysis {
  fileChanges: { filePath: string; changeLevel: string; details: string[] }[];
  newFiles: string[];
  deletedFiles: string[];
  structurallyChangedFiles: string[];
  cosmeticOnlyFiles: string[];
  unchangedFiles: string[];
}

export interface UpdateDecision {
  action: "SKIP" | "PARTIAL_UPDATE" | "ARCHITECTURE_UPDATE" | "FULL_UPDATE";
  filesToReanalyze: string[];
  rerunArchitecture: boolean;
  rerunTour: boolean;
  reason: string;
}

function topDirectory(filePath: string): string | null {
  const parts = filePath.split("/").filter(Boolean);
  if (parts.length < 2) {
    return null;
  }
  return parts[0] ?? null;
}

function detectDirectoryChanges(
  newFiles: string[],
  deletedFiles: string[],
  allKnownFiles: string[],
): boolean {
  const existingDirs = new Set(
    allKnownFiles.map((f) => topDirectory(f)).filter(Boolean) as string[],
  );
  for (const f of newFiles) {
    const dir = topDirectory(f);
    if (dir && !existingDirs.has(dir)) {
      return true;
    }
  }
  for (const f of deletedFiles) {
    const dir = topDirectory(f);
    if (dir && !existingDirs.has(dir)) {
      return true;
    }
  }
  return false;
}

function summarizeChanges(analysis: ChangeAnalysis): string {
  const parts: string[] = [];
  if (analysis.newFiles.length > 0) {
    parts.push(`${analysis.newFiles.length} new`);
  }
  if (analysis.deletedFiles.length > 0) {
    parts.push(`${analysis.deletedFiles.length} deleted`);
  }
  if (analysis.structurallyChangedFiles.length > 0) {
    parts.push(`${analysis.structurallyChangedFiles.length} modified`);
  }
  return parts.join(", ");
}

/** Browser-safe copy of graph-core classifyUpdate (no node:fs / node:path). */
export function classifyUpdate(
  analysis: ChangeAnalysis,
  totalFilesInGraph: number,
  allKnownFiles: string[] = [],
): UpdateDecision {
  const { newFiles, deletedFiles, structurallyChangedFiles, cosmeticOnlyFiles } = analysis;
  const structuralCount = structurallyChangedFiles.length + newFiles.length + deletedFiles.length;

  if (structuralCount === 0) {
    const cosmeticCount = cosmeticOnlyFiles.length;
    const reason =
      cosmeticCount > 0
        ? `${cosmeticCount} file(s) have cosmetic-only changes (no structural impact)`
        : "No changes detected";
    return {
      action: "SKIP",
      filesToReanalyze: [],
      rerunArchitecture: false,
      rerunTour: false,
      reason,
    };
  }

  const triggeredByCount = structuralCount > 30;
  const triggeredByPercentage =
    totalFilesInGraph > 0 && structuralCount / totalFilesInGraph > 0.5;
  if (triggeredByCount || triggeredByPercentage) {
    const thresholdReason =
      triggeredByCount && triggeredByPercentage
        ? ">30 files and >50% of project"
        : triggeredByCount
          ? ">30 files"
          : ">50% of project";
    return {
      action: "FULL_UPDATE",
      filesToReanalyze: [...structurallyChangedFiles, ...newFiles],
      rerunArchitecture: true,
      rerunTour: true,
      reason: `${structuralCount} files have structural changes (${thresholdReason}) — full rebuild recommended`,
    };
  }

  const hasDirectoryChanges = detectDirectoryChanges(newFiles, deletedFiles, allKnownFiles);
  if (hasDirectoryChanges || structuralCount > 10) {
    return {
      action: "ARCHITECTURE_UPDATE",
      filesToReanalyze: [...structurallyChangedFiles, ...newFiles],
      rerunArchitecture: true,
      rerunTour: true,
      reason: hasDirectoryChanges
        ? `Directory structure changed (${newFiles.length} new, ${deletedFiles.length} deleted files)`
        : `${structuralCount} files have structural changes — architecture re-analysis needed`,
    };
  }

  return {
    action: "PARTIAL_UPDATE",
    filesToReanalyze: [...structurallyChangedFiles, ...newFiles],
    rerunArchitecture: false,
    rerunTour: false,
    reason: `${structuralCount} file(s) have structural changes: ${summarizeChanges(analysis)}`,
  };
}

/** Build ChangeAnalysis from compare rows for commit classification. */
export function buildChangeAnalysisFromRows(rows: FileChange[]): ChangeAnalysis {
  const newFiles: string[] = [];
  const deletedFiles: string[] = [];
  const structurallyChangedFiles: string[] = [];
  for (const row of rows) {
    if (row.kind === "added") {
      newFiles.push(row.path);
    } else if (row.kind === "removed") {
      deletedFiles.push(row.path);
    } else {
      structurallyChangedFiles.push(row.path);
    }
  }
  return {
    fileChanges: [],
    newFiles,
    deletedFiles,
    structurallyChangedFiles,
    cosmeticOnlyFiles: [],
    unchangedFiles: [],
  };
}

export function classifyCompareRows(
  rows: FileChange[],
  totalKnownFiles = 0,
): UpdateDecision {
  const analysis = buildChangeAnalysisFromRows(rows);
  const total = totalKnownFiles > 0 ? totalKnownFiles : Math.max(rows.length, 1);
  const allKnown = rows.map((r) => r.path);
  return classifyUpdate(analysis, total, allKnown);
}

export function districtBreakdown(rows: FileChange[]): { district: string; count: number; kinds: string }[] {
  const byDir = new Map<string, { added: number; removed: number; modified: number }>();
  for (const row of rows) {
    const district = topDirectory(row.path) ?? "(root)";
    const entry = byDir.get(district) ?? { added: 0, removed: 0, modified: 0 };
    if (row.kind === "added") {
      entry.added++;
    } else if (row.kind === "removed") {
      entry.removed++;
    } else {
      entry.modified++;
    }
    byDir.set(district, entry);
  }
  return [...byDir.entries()]
    .map(([district, counts]) => ({
      district,
      count: counts.added + counts.removed + counts.modified,
      kinds: `+${counts.added} -${counts.removed} ~${counts.modified}`,
    }))
    .sort((a, b) => b.count - a.count);
}

export function graphSymbolsContext(
  graph: { nodes: { id: string; name: string; type: string; filePath?: string }[] } | null,
  changedPaths: Set<string>,
  limit = 12,
): string {
  if (!graph) {
    return "";
  }
  const symbols = graph.nodes
    .filter(
      (n) =>
        (n.type === "function" || n.type === "class") &&
        n.filePath &&
        changedPaths.has(n.filePath),
    )
    .slice(0, limit)
    .map((n) => `- ${n.type} ${n.name} (${n.filePath})`);
  if (symbols.length === 0) {
    return "";
  }
  return ["Affected symbols (knowledge graph):", ...symbols].join("\n");
}
