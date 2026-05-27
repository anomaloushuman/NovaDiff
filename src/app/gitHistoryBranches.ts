import type { GitBranchSummary, GitLogCommitSummary } from "./gitTypes";
import type { WorkspaceCommitSnapshot } from "./workspaceTypes";

export function enrichBranchCommits(
  branchCommits: GitLogCommitSummary[],
  indexed: WorkspaceCommitSnapshot[],
): WorkspaceCommitSnapshot[] {
  const byHash = new Map(indexed.map((c) => [c.hash, c]));
  return branchCommits.map((c) => {
    const hit = byHash.get(c.hash);
    if (hit) {
      return hit;
    }
    return {
      ...c,
      snapshotPath: "",
      docsPath: null,
      indexedAt: null,
    };
  });
}

const PREFERRED_BASE = ["main", "master", "develop"];

export function pickDefaultBaseBranch(branches: GitBranchSummary[]): string {
  for (const name of PREFERRED_BASE) {
    const exact = branches.find((b) => b.name === name);
    if (exact) {
      return exact.name;
    }
    const remote = branches.find((b) => b.name === `origin/${name}`);
    if (remote) {
      return remote.name;
    }
  }
  const local = branches.find((b) => !b.isRemote);
  return local?.name ?? branches[0]?.name ?? "";
}

export function pickDefaultHeadBranch(
  branches: GitBranchSummary[],
  currentBranch: string,
): string {
  if (currentBranch && branches.some((b) => b.name === currentBranch)) {
    return currentBranch;
  }
  const current = branches.find((b) => b.isCurrent);
  if (current) {
    return current.name;
  }
  const local = branches.find((b) => !b.isRemote);
  return local?.name ?? branches[0]?.name ?? "";
}

/** Synthetic commit at a branch tip for folder compare. */
export function commitFromBranchTip(branch: GitBranchSummary): WorkspaceCommitSnapshot {
  return {
    hash: branch.hash,
    shortHash: branch.shortHash,
    subject: `Branch tip · ${branch.name}`,
    authoredAt: new Date().toISOString(),
    snapshotPath: "",
    docsPath: null,
    indexedAt: null,
  };
}

export function resolveGitRepoRoot(
  workspace: { repoRoot: string; liveDevRepoRoot?: string | null },
  liveRepoRootOverride?: string,
): string {
  return (
    String(liveRepoRootOverride ?? "").trim() ||
    String(workspace.liveDevRepoRoot ?? "").trim() ||
    String(workspace.repoRoot ?? "").trim()
  );
}

export function branchOptionLabel(branch: GitBranchSummary): string {
  const tags: string[] = [];
  if (branch.isCurrent) {
    tags.push("current");
  }
  if (branch.isRemote) {
    tags.push("remote");
  }
  const suffix = tags.length > 0 ? ` · ${tags.join(", ")}` : "";
  return `${branch.name} · ${branch.shortHash}${suffix}`;
}
