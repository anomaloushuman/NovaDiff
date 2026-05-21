import type { DocWorkspaceMetrics } from "./docWorkspaceMetrics";
import type { FileChange } from "./types";
import {
  classifyCompareRows,
  districtBreakdown,
  graphSymbolsContext,
  type UpdateDecision,
} from "./commitChangeAnalysis";

const MAX_PATHS = 90;

export interface CommitMessageContextOptions {
  classification?: UpdateDecision;
  graphContext?: string;
  githubContext?: string;
}

/** Compact change list for the commit-message LLM prompt. */
export function buildCommitMessageContext(
  metrics: DocWorkspaceMetrics,
  docRows: FileChange[],
  leftTitle: string,
  rightTitle: string,
  leftRoot: string,
  rightRoot: string,
  options: CommitMessageContextOptions = {},
): string {
  const classification = options.classification ?? classifyCompareRows(docRows);
  const districts = districtBreakdown(docRows);
  const lines = [
    `Baseline: ${leftTitle} (${leftRoot.trim()})`,
    `Target: ${rightTitle} (${rightRoot.trim()})`,
    `Changed path count: ${docRows.length}`,
    `By kind — added: ${metrics.byKind.added}, removed: ${metrics.byKind.removed}, modified: ${metrics.byKind.modified}`,
    "",
    "Structural classification:",
    `- Action: ${classification.action}`,
    `- Reason: ${classification.reason}`,
    "",
    "By district (top-level folder):",
  ];
  for (const d of districts.slice(0, 24)) {
    lines.push(`- ${d.district}: ${d.count} path(s) (${d.kinds})`);
  }
  if (options.graphContext?.trim()) {
    lines.push("", options.graphContext.trim());
  }
  if (options.githubContext?.trim()) {
    lines.push("", "Linked GitHub context:", options.githubContext.trim().slice(0, 2000));
  }
  lines.push("", "Changed paths (relative):");
  for (const r of docRows.slice(0, MAX_PATHS)) {
    lines.push(`- ${r.kind}: ${r.path}`);
  }
  if (docRows.length > MAX_PATHS) {
    lines.push(`… and ${docRows.length - MAX_PATHS} more paths not listed.`);
  }
  if (classification.action === "ARCHITECTURE_UPDATE" || classification.action === "FULL_UPDATE") {
    lines.push(
      "",
      "Commit style hint: use Conventional Commits with type(scope): subject — e.g. refactor(core): … or feat(api): …",
    );
  }
  return lines.join("\n").slice(0, 12_000);
}

export { graphSymbolsContext, classifyCompareRows };

/** Parse LLM reply using SUBJECT: / BODY: contract. */
export function parseCommitMessageOutput(raw: string): {
  subject: string;
  body: string;
} {
  const t = raw.replace(/\r\n/g, "\n").trim();
  const subjLine = t.match(/^SUBJECT:\s*(.+)$/im);
  let subject = subjLine ? subjLine[1].trim() : "";
  let body = "";
  const parts = t.split(/^BODY:\s*$/im);
  if (parts.length >= 2) {
    body = parts.slice(1).join("\n").trim();
  }
  if (!subject) {
    const first = t.split("\n").find((l) => l.trim().length > 0) ?? "";
    subject = first.replace(/^SUBJECT:\s*/i, "").trim();
  }
  if (!body) {
    body = t
      .replace(/^SUBJECT:.*$/im, "")
      .replace(/^BODY:\s*/im, "")
      .trim();
  }
  return {
    subject: subject.slice(0, 100).replace(/\s+/g, " "),
    body: body || "(no body generated)",
  };
}
