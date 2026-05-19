### Overview  
`electron/workspace-history.cjs` adds snapshotting and indexing for workspace commit history. The file now imports Node’s `fs/promises`, `fs`, `path`, and a local `runGit` helper (R3–R6). It also pulls `upsertWorkspace` and `getWorkspace` from `workspace-store.cjs` (R33). New helper functions are defined: `removeDirSafe` (R8–R16), `isUsableSnapshotDir` (R18–R32), `listCommitsOldestFirst` (R35–R58), `snapshotCommit` (R61–R78), and `ensureCommitSnapshot` (R80–R98). The main workflow, `indexWorkspaceHistory`, iterates over all commits, creates snapshots, writes metadata, and updates the workspace’s history status (R100–R183). All public functions are exported (R185–R191).

### Key changes  
- **Imports**: `fsp`, `fssync`, `path`, `runGit` (R3–R6).  
- **Workspace store hooks**: `upsertWorkspace`, `getWorkspace` (R33).  
- **Utility functions**: `removeDirSafe` (R8–R16), `isUsableSnapshotDir` (R18–R32).  
- **Git helpers**: `listCommitsOldestFirst` (R35–R58), `snapshotCommit` (R61–R78), `ensureCommitSnapshot` (R80–R98).  
- **Indexing workflow**: `indexWorkspaceHistory` (R100–R183).  
- **Exports**: all functions (R185–R191).

### Impact  
- **Correctness**: `snapshotCommit` creates a detached worktree per commit, isolating each snapshot.  
- **Maintainability**: Snapshot logic is centralized, easing future extensions.  
- **Performance**: Worktree creation per commit can be costly; progress is reported via `sendProgress`.  
- **Compatibility**: Uses Node’s `fs/promises` and `fs` APIs, suitable for all Electron targets.  
- **Observability**: Workspace status fields and progress callbacks provide UI hooks.

### Risks & follow‑ups  
- **Git command failures**: `runGit` errors are not caught in `snapshotCommit`; ensure failures surface to the UI.  
- **Race conditions**: Concurrent `indexWorkspaceHistory` calls could corrupt `workspace.historyStatus`; consider idempotency or locking.  
- **Path resolution on Windows**: `path.resolve` may produce backslashes; verify downstream consumers handle them.  
- **Test coverage**: No unit tests exist for this module; add mocks for `runGit` and the file system to validate edge cases (e.g., missing repo, empty snapshot dir).
