import { describe, expect, it } from "vitest";
import type { RiskSignal } from "../src/app/types";
import {
  groupSecuritySignals,
  mergeRiskSignals,
} from "../src/app/securityInsights";

const mk = (overrides: Partial<RiskSignal>): RiskSignal => ({
  id: "id",
  source: "heuristic",
  category: "config",
  severity: "medium",
  confidence: "medium",
  title: "title",
  rel_path: null,
  evidence: [],
  advisory: null,
  ...overrides,
});

describe("securityInsights", () => {
  it("groups advisory findings as vulnerabilities", () => {
    const grouped = groupSecuritySignals([
      mk({
        id: "adv-1",
        source: "advisory",
        category: "dependency-cve",
        severity: "high",
      }),
      mk({ id: "mem-1", category: "memory-leak", severity: "medium" }),
      mk({
        id: "fn-1",
        category: "function-completeness",
        severity: "medium",
      }),
    ]);
    expect(grouped.vulnerabilities).toHaveLength(1);
    expect(grouped.memoryLeaks).toHaveLength(1);
    expect(grouped.functionCompleteness).toHaveLength(1);
  });

  it("merges and deduplicates by id", () => {
    const merged = mergeRiskSignals(
      [mk({ id: "same", severity: "low", title: "old" })],
      [mk({ id: "same", severity: "high", title: "new", source: "advisory" })],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].title).toBe("new");
    expect(merged[0].source).toBe("advisory");
  });
});
