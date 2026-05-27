import { describe, expect, it } from "vitest";
import {
  commitFromBranchTip,
  pickDefaultBaseBranch,
  pickDefaultHeadBranch,
  enrichBranchCommits,
} from "../src/app/gitHistoryBranches";
import type { GitBranchSummary } from "../src/app/gitTypes";

const branches: GitBranchSummary[] = [
  {
    name: "main",
    hash: "a".repeat(40),
    shortHash: "aaaa",
    upstream: "origin/main",
    isCurrent: false,
    isRemote: false,
  },
  {
    name: "feature/x",
    hash: "b".repeat(40),
    shortHash: "bbbb",
    upstream: null,
    isCurrent: true,
    isRemote: false,
  },
  {
    name: "origin/main",
    hash: "c".repeat(40),
    shortHash: "cccc",
    upstream: null,
    isCurrent: false,
    isRemote: true,
  },
];

describe("gitHistoryBranches", () => {
  it("prefers main as default base branch", () => {
    expect(pickDefaultBaseBranch(branches)).toBe("main");
  });

  it("prefers current branch as default head", () => {
    expect(pickDefaultHeadBranch(branches, "feature/x")).toBe("feature/x");
  });

  it("builds compare commit from branch tip", () => {
    const c = commitFromBranchTip(branches[0]);
    expect(c.hash).toBe(branches[0].hash);
    expect(c.subject).toContain("main");
  });

  it("enriches branch commits with indexed snapshots", () => {
    const enriched = enrichBranchCommits(
      [{ hash: "abc", shortHash: "abc", subject: "x", authoredAt: "2020-01-01" }],
      [
        {
          hash: "abc",
          shortHash: "abc",
          subject: "x",
          authoredAt: "2020-01-01",
          snapshotPath: "/snap",
          docsPath: null,
          indexedAt: null,
        },
      ],
    );
    expect(enriched[0].snapshotPath).toBe("/snap");
  });
});
