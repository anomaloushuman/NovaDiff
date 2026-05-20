### Overview  
A new module `electron/workspace-history.cjs` is added to the Electron side of the repo. It implements snapshotting of Git commits, indexing of workspace history, and a refresh routine that re‑reads the log and re‑creates missing snapshots.

### Key changes  
- **Imports**: added `fsp`, `fssync`, `path`, `runGit/tryRunGit`, and `upsertWorkspace/getWorkspace` (lines 3‑6, 33).  
- **Utility helpers**: `removeDirSafe` (lines 8‑16) and `isUsableSnapshotDir` (lines 18‑32) guard filesystem operations.  
- **Commit enumeration**: `listCommitsOldestFirst` (lines 35‑58) runs `git log` and returns an array of commit objects.  
- **Snapshot creation**: `snapshotCommit` (lines 61‑78) materializes a detached worktree, validates it, and returns the path.  
- **Single‑commit snapshot**: `ensureCommitSnapshot` (lines 80‑98) ties a snapshot to a workspace record via `upsertWorkspace`.  
- **Full history indexing**: `indexWorkspaceHistory` (lines 100‑183) walks all commits, creates snapshots, writes metadata, and updates workspace state.  
- **Refresh logic**: `refreshWorkspaceHistory` (lines 188‑291) optionally fetches remote refs, re‑reads the log, re‑uses existing snapshots, and updates the workspace.  
- **Exports**: all public functions are exported (lines 293‑300).

### Impact  
- **New API surface**: callers can now trigger history indexing or refresh via the exported functions.  
- **Filesystem side‑effects**: the module creates/clears directories under `workspace.dataDir`, which may affect disk usage and performance.  
- **Git dependency**: relies on `git` being available; errors are surfaced through `runGit`/`tryRunGit`.  
- **State persistence**: uses `upsertWorkspace`/`getWorkspace`, so existing workspace records must be compatible with the new `commits` structure.  

### Risks & follow‑ups  
- Verify that `workspace.dataDir` paths are correctly resolved on all OSes; path handling is critical.  
- Ensure `runGit` and `tryRunGit` correctly propagate errors; missing Git binaries could crash the process.  
- Performance regression: snapshotting every commit can be expensive; benchmark on large repos.  
- Test that `refreshWorkspaceHistory` correctly re‑uses existing snapshots and does not overwrite them inadvertently.
