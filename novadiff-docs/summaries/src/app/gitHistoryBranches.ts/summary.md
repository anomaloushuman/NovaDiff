### Overview  
A new module `src/app/gitHistoryBranches.ts` is added, providing utilities for enriching branch commits, selecting default branches, creating synthetic tip commits, resolving repository roots, and formatting branch option labels.

### Key changes  
- **Imports**: `GitBranchSummary`, `GitLogCommitSummary` from `./gitTypes` (R1) and `WorkspaceCommitSnapshot` from `./workspaceTypes` (R2).  
- **`enrichBranchCommits`** (R4‑R20): maps `GitLogCommitSummary[]` to `WorkspaceCommitSnapshot[]`, using a `Map` for O(1) lookup; missing commits receive placeholder fields.  
- **`pickDefaultBaseBranch`** (R25‑R38): selects a preferred base branch (`main`, `master`, `develop`) or falls back to the first local or any branch.  
- **`pickDefaultHeadBranch`** (R40‑R53): prefers the current branch, then the active branch, then any local branch.  
- **`commitFromBranchTip`** (R56‑R66): creates a synthetic `WorkspaceCommitSnapshot` for a branch tip.  
- **`resolveGitRepoRoot`** (R68‑R77): resolves the repo root from an override, live‑dev root, or workspace root.  
- **`branchOptionLabel`** (R79‑R89): formats a branch name with short hash and tags (`current`, `remote`).

### Impact  
- Centralizes branch‑related logic, reducing duplication across the codebase.  
- Exposes utilities for UI components and tests, simplifying future refactors.  
- `enrichBranchCommits` builds a `Map` for efficient lookup, keeping enrichment linear in commit count.

### Risks & follow‑ups  
- **Type safety**: confirm that `GitBranchSummary` and `WorkspaceCommitSnapshot` definitions match usage in all consumers (unknown from the available diff).  
- **Branch selection logic**: verify behavior when no local branches exist (unknown from the available diff).  
- **Synthetic commit timestamps**: `new Date().toISOString()` may affect downstream code (unknown from the available diff).  
- **Build & lint**: run the repo’s lint, test, and production build scripts to catch integration issues introduced by the new file (unknown from the available diff).
