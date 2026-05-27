import type { RiskSignal } from "./types";

const severityRank: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function sortRiskSignals(items: RiskSignal[]): RiskSignal[] {
  return [...items].sort((a, b) => {
    const sev = (value: string) => severityRank[value] ?? 3;
    return sev(a.severity) - sev(b.severity) ||
      a.category.localeCompare(b.category) ||
      a.title.localeCompare(b.title);
  });
}

export function mergeRiskSignals(
  heuristic: RiskSignal[],
  advisory: RiskSignal[],
): RiskSignal[] {
  const byId = new Map<string, RiskSignal>();
  for (const item of [...heuristic, ...advisory]) {
    if (!item?.id) {
      continue;
    }
    byId.set(item.id, item);
  }
  return sortRiskSignals([...byId.values()]);
}

export interface SecurityInsightGroups {
  vulnerabilities: RiskSignal[];
  dependenciesConfig: RiskSignal[];
  memoryLeaks: RiskSignal[];
  functionCompleteness: RiskSignal[];
  others: RiskSignal[];
}

export function groupSecuritySignals(items: RiskSignal[]): SecurityInsightGroups {
  const groups: SecurityInsightGroups = {
    vulnerabilities: [],
    dependenciesConfig: [],
    memoryLeaks: [],
    functionCompleteness: [],
    others: [],
  };

  for (const item of sortRiskSignals(items)) {
    const category = String(item.category ?? "").toLowerCase();
    if (
      item.source === "advisory" ||
      category.includes("cve") ||
      category.includes("vulner")
    ) {
      groups.vulnerabilities.push(item);
      continue;
    }
    if (category.includes("memory")) {
      groups.memoryLeaks.push(item);
      continue;
    }
    if (category.includes("completeness") || category.includes("coverage-gap")) {
      groups.functionCompleteness.push(item);
      continue;
    }
    if (
      category.includes("dependency") ||
      category.includes("config") ||
      category.includes("auth") ||
      category.includes("build")
    ) {
      groups.dependenciesConfig.push(item);
      continue;
    }
    groups.others.push(item);
  }
  return groups;
}
