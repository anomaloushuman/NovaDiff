### Overview  
A new `refreshWorkspaceHistory` routine is added to `electron/workspace-history.cjs`. It re‑reads the git log, optionally fetches remote refs, and snapshots only commits that lack a usable snapshot, preserving existing ones. The module now imports `tryRunGit` alongside `runGit` and exposes the new function in its exports.

### Key changes  
- **Import update** – `const { runGit, tryRunGit } = require("./git-service.cjs");` (line 6).  
- **New function** – `async function refreshWorkspaceHistory(userData, workspaceId, sendProgress, opts = {})` (lines 188‑291).  
- **Optional fetch** – uses `tryRunGit(repoRoot, ["fetch", "--all", "--prune", "--tags"]);` unless `opts.fetchRemote === false`.  
- **Snapshot reuse** – checks `existing?.snapshotPath` and `isUsableSnapshotDir` to avoid re‑snapshotting.  
- **Progress reporting** – mirrors `indexWorkspaceHistory` but includes a “cached” message for already‑snapshot commits.  
- **Export list** – now includes `refreshWorkspaceHistory` (lines 295‑298).  

### Impact  
- **Correctness** – prevents duplicate snapshots and tolerates fetch failures without throwing.  
- **Performance** – skips snapshotting for commits that already have a usable snapshot, reducing disk I/O.  
- **Maintainability** – separates refresh logic from full indexing, making each path easier to test and evolve.  
- **Compatibility** – no breaking changes; the new export may require updating imports elsewhere.  
- **Observability** – progress callbacks provide the same granularity as `indexWorkspaceHistory`.

### Risks & follow‑ups  
- Verify that `tryRunGit` silently swallowing errors does not hide critical fetch failures.  
- Ensure `isUsableSnapshotDir` correctly identifies stale snapshots; stale snapshots could be mistakenly reused.  
- Test that `refreshWorkspaceHistory` correctly updates `workspace.historyError` on unexpected failures.  
- Confirm that the function handles an empty or missing `workspace.commits` array without crashing.
