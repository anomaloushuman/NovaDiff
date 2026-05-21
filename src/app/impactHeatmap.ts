import type { RiskSignal } from "./types";

export interface DistrictImpactScore {
  district: string;
  score: number;
  changedPaths: number;
  riskCount: number;
  highSeverity: number;
}

function topDirectory(filePath: string): string {
  const parts = filePath.split("/").filter(Boolean);
  return parts.length > 1 ? (parts[0] ?? "(root)") : "(root)";
}

/** Aggregate per-district impact from changed paths, risk signals, and optional graph node ids. */
export function buildDistrictImpactHeatmap(
  changedPaths: string[],
  riskSignals: RiskSignal[],
  affectedNodeIds: string[] = [],
): DistrictImpactScore[] {
  const byDistrict = new Map<string, DistrictImpactScore>();

  const bump = (district: string, delta: { paths?: number; risk?: number; high?: number; score?: number }) => {
    const entry = byDistrict.get(district) ?? {
      district,
      score: 0,
      changedPaths: 0,
      riskCount: 0,
      highSeverity: 0,
    };
    entry.changedPaths += delta.paths ?? 0;
    entry.riskCount += delta.risk ?? 0;
    entry.highSeverity += delta.high ?? 0;
    entry.score += delta.score ?? 0;
    byDistrict.set(district, entry);
  };

  for (const path of changedPaths) {
    bump(topDirectory(path), { paths: 1, score: 2 });
  }

  for (const signal of riskSignals) {
    const rel = signal.rel_path ?? null;
    const district = rel ? topDirectory(rel) : "(root)";
    const weight = signal.severity === "high" ? 8 : signal.severity === "medium" ? 4 : 2;
    bump(district, {
      risk: 1,
      high: signal.severity === "high" ? 1 : 0,
      score: weight,
    });
  }

  for (const nodeId of affectedNodeIds) {
    const filePath = nodeId.startsWith("file:")
      ? nodeId.slice(5)
      : nodeId.includes(":")
        ? nodeId.split(":").slice(1, -1).join(":")
        : "";
    if (filePath) {
      bump(topDirectory(filePath), { score: 1 });
    }
  }

  return [...byDistrict.values()].sort((a, b) => b.score - a.score);
}

export function heatmapMermaid(scores: DistrictImpactScore[], maxRows = 12): string {
  if (scores.length === 0) {
    return "flowchart LR\n  empty[No district impact data]";
  }
  const lines = ["flowchart TB"];
  for (const row of scores.slice(0, maxRows)) {
    const id = row.district.replace(/[^a-zA-Z0-9_]/g, "_");
    lines.push(`  ${id}["${row.district}: score ${row.score} (${row.changedPaths} paths, ${row.riskCount} risks)"]`);
  }
  return lines.join("\n");
}

export function heatmapHtmlTable(scores: DistrictImpactScore[]): string {
  if (scores.length === 0) {
    return "<p>No impact heatmap data.</p>";
  }
  const max = Math.max(...scores.map((s) => s.score), 1);
  const rows = scores
    .map((s) => {
      const pct = Math.round((s.score / max) * 100);
      return `<tr><td>${escapeHtml(s.district)}</td><td><div class="impact-bar" style="width:${pct}%"></div></td><td>${s.score}</td><td>${s.changedPaths}</td><td>${s.riskCount}</td></tr>`;
    })
    .join("");
  return `<table class="impact-heatmap"><thead><tr><th>District</th><th>Impact</th><th>Score</th><th>Paths</th><th>Risks</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
