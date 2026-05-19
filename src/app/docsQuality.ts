import type {
  EvidenceBadge,
  FileChange,
  RiskSignal,
  SelectionIndexEntry,
  SummaryIndexEntry,
} from "./types";

function uniqStrings(values: string[], limit = 12): string[] {
  const out: string[] = [];
  for (const value of values) {
    const trimmed = String(value ?? "").trim();
    if (!trimmed || out.includes(trimmed)) {
      continue;
    }
    out.push(trimmed);
    if (out.length >= limit) {
      break;
    }
  }
  return out;
}

function compactText(input: string, maxLen = 260): string {
  const normalized = String(input ?? "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLen) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
}

export function relPathAnchorId(relPath: string): string {
  const slug = String(relPath ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "summary";
}

export function buildSummaryPromptContext(entries: SummaryIndexEntry[], limit = 10): string {
  const rows = entries
    .slice(0, limit)
    .map((entry) => {
      const badges = Array.isArray(entry.badges)
        ? entry.badges.map((badge) => badge.label).join(", ")
        : "";
      const summary = compactText(entry.markdown, 220).replace(/^#{1,6}\s+/g, "");
      return `- \`${entry.relPath}\` (${entry.kind}${
        badges ? `; badges: ${badges}` : ""
      }): ${summary}`;
    })
    .join("\n\n");
  return rows
    ? `Saved summary hints for synthesis only (do not quote verbatim or enumerate one by one):\n${rows}`
    : "";
}

export function buildRiskPromptContext(signals: RiskSignal[], limit = 14): string {
  const rows = signals
    .slice(0, limit)
    .map((signal) => {
      const evidence = uniqStrings(signal.evidence ?? [], 3).join("; ");
      const pathLine = signal.rel_path ? ` · path ${signal.rel_path}` : "";
      return `- [${signal.severity}/${signal.confidence}] ${signal.category}${pathLine}: ${signal.title}${
        evidence ? ` — ${evidence}` : ""
      }`;
    })
    .join("\n");
  return rows
    ? `Deterministic risk hints for synthesis only (do not copy as a raw section dump):\n${rows}`
    : "";
}

export function deriveConfidenceBadges(args: {
  rows: FileChange[];
  summaries: SummaryIndexEntry[];
  selections: SelectionIndexEntry[];
  riskSignals: RiskSignal[];
}): EvidenceBadge[] {
  const { rows, summaries, selections, riskSignals } = args;
  const badges: EvidenceBadge[] = [];
  const push = (key: string, label: string, tone: EvidenceBadge["tone"], description?: string) => {
    if (!badges.some((badge) => badge.key === key)) {
      badges.push({ key, label, tone, description });
    }
  };
  const summaryCoverage = rows.length > 0 ? summaries.length / rows.length : 0;
  if (summaryCoverage >= 0.8) {
    push(
      "summary-coverage-strong",
      "Strong summary coverage",
      "good",
      "Most changed files have saved summaries available for grounding the narrative.",
    );
  } else if (summaryCoverage > 0) {
    push(
      "summary-coverage-partial",
      "Partial summary coverage",
      "neutral",
      "Some file-level summaries are available, but the narrative still covers unsummarized paths.",
    );
  } else {
    push(
      "summary-coverage-missing",
      "No saved file summaries",
      "warn",
      "The narrative relies on metrics and risk signals without per-file summary support.",
    );
  }
  if (riskSignals.some((signal) => signal.severity === "high")) {
    push(
      "high-risk-signals",
      "High-risk signals present",
      "warn",
      "At least one deterministic high-severity signal was detected in the compare.",
    );
  } else if (riskSignals.length > 0) {
    push(
      "risk-signals",
      "Deterministic risk signals available",
      "neutral",
      "Risk sections can reference offline heuristic signals instead of only free-form LLM claims.",
    );
  }
  if (selections.length > 0) {
    push(
      "selection-docs",
      "Focused selection docs available",
      "good",
      "Reviewers saved line- or symbol-scoped documentation that can ground the broader report.",
    );
  }
  push(
    "heuristic-scan",
    "Heuristic scan data",
    "neutral",
    "Imports, calls, and symbol spans come from bounded heuristics rather than a full AST index.",
  );
  return badges;
}

export function buildReleaseOverviewMarkdown(args: {
  leftTitle: string;
  rightTitle: string;
  rows: FileChange[];
  summaries: SummaryIndexEntry[];
  selections: SelectionIndexEntry[];
  riskSignals: RiskSignal[];
  confidenceBadges: EvidenceBadge[];
}): string {
  const { leftTitle, rightTitle, rows, summaries, selections, riskSignals, confidenceBadges } = args;
  const bySeverity = {
    high: riskSignals.filter((signal) => signal.severity === "high"),
    medium: riskSignals.filter((signal) => signal.severity === "medium"),
    low: riskSignals.filter((signal) => signal.severity === "low"),
  };
  const topFiles = rows.slice(0, 20).map((row) => `- **${row.kind}** \`${row.path}\``).join("\n");
  const topSummaries = summaries
    .slice(0, 12)
    .map(
      (entry) =>
        `### \`${entry.relPath}\`\n\n${
          Array.isArray(entry.badges) && entry.badges.length > 0
            ? `_${entry.badges.map((badge) => badge.label).join(" · ")}_\n\n`
            : ""
        }${compactText(entry.markdown, 520)}`,
    )
    .join("\n\n");
  const riskList = (items: RiskSignal[]) =>
    items.length === 0
      ? "_None detected._"
      : items
          .slice(0, 12)
          .map((signal) => {
            const evidence = uniqStrings(signal.evidence ?? [], 3);
            return [
              `- **${signal.title}**${signal.rel_path ? ` (\`${signal.rel_path}\`)` : ""}`,
              ...evidence.map((item) => `  - ${item}`),
            ].join("\n");
          })
          .join("\n");
  const confidence = confidenceBadges
    .map((badge) => `- **${badge.label}**: ${badge.description ?? "Evidence-backed confidence signal."}`)
    .join("\n");
  const selectionList = selections
    .slice(0, 10)
    .map(
      (entry) =>
        `- \`${entry.relPath}\` — ${entry.label}${
          entry.symbol ? ` (${entry.symbol.kind} ${entry.symbol.name})` : ""
        }`,
    )
    .join("\n");
  return [
    "# Release overview",
    "",
    `**Baseline:** ${leftTitle}`,
    "",
    `**Target:** ${rightTitle}`,
    "",
    "## Readiness signals",
    "",
    "| Signal | Count |",
    "| --- | --- |",
    `| Changed files | ${rows.length} |`,
    `| Saved file summaries | ${summaries.length} |`,
    `| Saved selection docs | ${selections.length} |`,
    `| High-risk signals | ${bySeverity.high.length} |`,
    `| Medium-risk signals | ${bySeverity.medium.length} |`,
    `| Low-risk signals | ${bySeverity.low.length} |`,
    "",
    "## Confidence badges",
    "",
    confidence || "_No confidence badges available._",
    "",
    "## Top changed files",
    "",
    topFiles || "_No changed files._",
    "",
    "## Deterministic risk review",
    "",
    "### High severity",
    "",
    riskList(bySeverity.high),
    "",
    "### Medium severity",
    "",
    riskList(bySeverity.medium),
    "",
    "### Low severity",
    "",
    riskList(bySeverity.low),
    "",
    "## Summary rollup",
    "",
    topSummaries || "_No saved file summaries available yet._",
    "",
    "## Focused reviewer notes",
    "",
    selectionList || "_No saved selection docs yet._",
    "",
    "## Advisory enrichment status",
    "",
    "NovaDiff is currently using deterministic offline risk signals only. The risk schema already separates heuristic and advisory sources so future OSV or ecosystem audit enrichment can be added without mixing those results into the base confidence model.",
  ].join("\n");
}
