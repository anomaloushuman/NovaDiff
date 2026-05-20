### Overview  
`electron/git-service.cjs` is a new CommonJS module that bundles synchronous Git helpers for the Electron renderer. It centralises Git interactions that were previously scattered across the codebase.

### Key changes  
- **Imports** (`R3‑R6`): `node:fs`, `node:path`, `node:os`, `node:child_process`.  
- **Command wrappers** (`R12‑R36`): `runGit` and `tryRunGit` use `spawnSync` to execute Git, surface errors, and trim stdout.  
- **Repository introspection** (`R38‑R120`): `isGitRepo`, `getRepoStatus`, and `parsePorcelainStatus` collect branch, upstream, file status, and remote data.  
- **Common Git ops** (`R137‑R154`): `stageAll`, `commit`, and `push` expose `git add -A`, `git commit`, and `git push`.  
- **Worktree utilities** (`R156‑R182`): `ensureWorktreeBase`, `removeDirSafe`, `checkoutRefWorktree`, and `cleanupNovadiffWorktrees` manage temporary detached worktrees for PR comparisons.  
- **PR comparison setup** (`R191‑R205`): `preparePrCompareRoots` creates left/right roots for a PR diff.  
- **Tooling detection** (`R207‑R214`): `detectGitTooling` reports Git availability and version.  
- **Exports** (`R216‑R229`): All helpers are exported for external use.

### Impact  
- **Error handling**: `runGit` throws on non‑zero exit or spawn errors; callers must catch these.  
- **Synchronous execution**: `spawnSync` blocks the event loop; acceptable for small scripts but may stall the UI during heavy Git operations.  
- **Node compatibility**: Relies only on Node 14+ core modules; no external dependencies.  
- **Observability**: Errors surface with messages like `git exited X` or `Failed to run git`.

### Risks & follow‑ups  
1. **Git absence** – `detectGitTooling` must be checked before using any helper; otherwise, an exception will crash the renderer.  
2. **Worktree cleanup** – `cleanupNovadiffWorktrees` should run on app exit to avoid accumulating temp directories.  
3. **Path sanitization** – `checkoutRefWorktree` sanitises labels but still uses `path.basename`; verify no edge‑case injection.  
4. **Build inclusion** – Ensure the new `.cjs` file is referenced in the Electron build config; otherwise, runtime imports will fail.
