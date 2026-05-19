### Overview  
`electron/git-service.cjs` (lines 1‑229) replaces scattered shell calls with a single module that centralises all Git interactions for the Electron renderer.

### Key changes  
- **Imports added** (lines 3‑6):  
  ```js
  const fssync = require("node:fs");
  const path   = require("node:path");
  const os     = require("node:os");
  const { spawnSync } = require("node:child_process");
  ```
- **`gitExecutable()`** (lines 8‑10) returns `"git.exe"` on Windows, otherwise `"git"`.  
- **`runGit()` / `tryRunGit()`** (lines 12‑27, 30‑36) wrap `spawnSync` with a 120 s timeout, error handling, and normalise output.  
- **Repository checks**: `isGitRepo()` (lines 38‑45) verifies a Git repo.  
- **Status parsing**: `parsePorcelainStatus()` (lines 47‑74) and `getRepoStatus()` (lines 75‑123) expose branch, upstream, dirty files, remotes, etc.  
- **URL parsing**: `parseGithubSlugFromUrl()` (lines 124‑136) extracts owner/repo from GitHub URLs.  
- **Git actions**: `stageAll()` (137‑140), `commit()` (142‑146), `push()` (148‑154).  
- **Worktree helpers**: `ensureWorktreeBase()` (156‑160), `removeDirSafe()` (162‑168), `checkoutRefWorktree()` (174‑182), `cleanupNovadiffWorktrees()` (184‑186).  
- **PR comparison**: `preparePrCompareRoots()` (191‑205) creates detached worktrees for base/head comparison.  
- **Tooling detection**: `detectGitTooling()` (207‑214) reports Git availability and version.  
- All functions are exported via `module.exports` (lines 216‑229).

### Impact  
- **Maintainability**: Single source of truth for Git logic reduces duplication.  
- **Cross‑platform**: `gitExecutable()` and `spawnSync` provide consistent behavior on Windows, macOS, and Linux.  
- **Observability**: Errors from `runGit()` include the underlying message, aiding debugging.  
- **Feature completeness**: Worktree support enables accurate PR diffing without altering the main repo.

### Risks & follow‑ups  
- **UI blocking**: `spawnSync` is synchronous; impact on large repos is unknown from the diff.  
- **Worktree cleanup**: `removeDirSafe()` may race if multiple instances run concurrently; behavior not covered by the diff.  
- **CI environments**: `detectGitTooling()` should be verified in containers lacking Git; failure handling is present but not tested in the diff.  
- **Git version compatibility**: `parsePorcelainStatus()` assumes the current porcelain format; compatibility with older Git releases is unknown from the available evidence.
