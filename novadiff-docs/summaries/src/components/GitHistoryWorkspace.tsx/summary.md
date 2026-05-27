### Overview  
`GitHistoryWorkspace` was refactored to replace the old commit‑sorting logic with a branch‑centric view. The component now loads branch metadata, aggregates branch commits with indexed commits, and renders commits per selected branch. The legacy “indexing” section and related props were removed.

### Key changes  
- **Imports** – added `GitBranchSummary`, `commitFromBranchTip`, `enrichBranchCommits`, `pickDefaultBaseBranch`, `pickDefaultHeadBranch`, and `resolveGitRepoRoot` (R3‑R10).  
- **State** – new hooks for `branches`, `branchesLoading`, `branchLoadError`, `baseBranch`, `headBranch`, `branchCommits`, and `branchCommitsLoading` (lines 58‑65).  
- **Branch loading** – `loadBranches` (lines 75‑109) fetches branches, sets defaults via `pickDefault…`, and handles errors.  
- **Commit aggregation** – `reloadBranchCommits` (lines 115‑152) merges branch commits with indexed commits using `enrichBranchCommits`; `listCommits` (lines 158‑164) replaces the old `sorted` array.  
- **UI updates** –  
  - `HistoryCompareStrip` now receives `branches`, `branchesLoading`, `branchLoadError`, `baseBranch`, `headBranch`, `useLiveHead`, `liveRepoRoot`, `busy`, `error`, `loading`, `onBaseBranch`, `onHeadBranch`, `onUseLiveHead`, `onBrowseLiveRepo`, `onLiveRepoBlur`, and `onSwap` (lines 260‑271).  
  - Removed props `indexing`, `onBaseHash`, `onHeadHash`, `onLiveRepoRoot` (lines 149‑152).  
  - Commit list renders from `listCommits`; focus logic uses `focusHash` (lines 280‑292).  
  - The “Indexed commits” section and its loading/error UI were removed (lines 162‑167).  
- **Interaction changes** – `swapBranches` (lines 214‑218) swaps `baseBranch`/`headBranch`; `runCompare` (lines 222‑240) uses `listCommits` and branch metadata to determine commits to compare.  
- **Persisting live repo** – `persistLiveRepo` now triggers `loadBranches` after saving (lines 210‑212).

### Impact  
- **Correctness** – Branch‑based commits are now the source of truth; the old `sorted` logic is eliminated.  
- **Maintainability** – Centralized branch handling simplifies future extensions.  
- **Performance** – Consolidated state reduces re‑renders; branch loading is async and cached.  
- **Compatibility** – Consumers that passed the removed props (`indexing`, `onBaseHash`, etc.) must be updated.

### Risks & follow‑ups  
- **Comparison logic** – Verify that `runCompare` selects the intended commits when `useLiveHead` is true (logic changed in lines 222‑240).  
- **Commit count display** – Confirm that `listCommits.length` matches expectations after branch changes (lines 292‑295).  
- **Branch default selection** – Test that `pickDefaultBaseBranch`/`pickDefaultHeadBranch` correctly choose defaults when the repo has no current branch (lines 95‑102).  
- **Legacy consumers** – Search for components still passing the removed props and update them.
