### Overview  
`electron/repo-discovery.cjs` is a new module that discovers local Git repositories, extracts remote slugs, and exposes a discovery API for the Electron front‑end.

### Key changes  
- **Imports** (lines 1‑6):  
  ```js
  const fssync = require("node:fs");
  const path   = require("node:path");
  const os     = require("node:os");
  const { parseGithubSlugFromUrl, tryRunGit } = require("./git-service.cjs");
  ```
- **Constants** (lines 8‑27):  
  `SKIP_DIR_NAMES` set, `MAX_REPOS = 120`, `MAX_DEPTH = 4`.  
- **`homeSearchRoots()`** (lines 29‑68): builds a platform‑aware list of candidate home directories, deduplicates, and validates existence.  
- **`readGitRemoteSlug(repoRoot)`** (lines 70‑86): runs `git remote -v`, parses the first fetch URL, and returns `{owner, repo, remote, url}` or `null`.  
- **`scanForGitRepos(roots, opts)`** (lines 88‑141): recursively walks each root up to `MAX_DEPTH`, skips `SKIP_DIR_NAMES` and dot‑folders, collects up to `MAX_REPOS` repos, optionally filtering by `targetSlug`.  
- **`discoverRepos(payload)`** (lines 143‑155): merges home roots with any `extraRoots`, invokes `scanForGitRepos`, and returns `{searchRoots, matches, scannedAt}`.  
- **`matchRepoForGithubRepo(owner, repo, extraRoots)`** (lines 157‑158): convenience wrapper that returns only the matched repos.  
- **Exports** (lines 161‑166): exposes `homeSearchRoots`, `discoverRepos`, `matchRepoForGithubRepo`, and `readGitRemoteSlug`.

### Impact  
- Centralizes discovery logic; future changes can be made in one place.  
- Scans up to 120 repos with a depth limit of 4, returning a `scannedAt` timestamp for observability.  
- Uses Node 18+ `node:` imports, which may not be available in older Electron builds.

### Risks & follow‑ups  
- **Scan performance**: scanning large directories may block the UI; consider async or worker‑thread implementation if needed.  
- **Missing `git`**: `tryRunGit` should handle environments without Git; add unit tests for this scenario.  
- **Duplicate roots**: `homeSearchRoots` deduplicates via a `seen` set, but `extraRoots` may still introduce duplicates; confirm no double‑counting in `discoverRepos`.  
- **Cross‑platform path handling**: test on Windows, macOS, and Linux to ensure `path.join` and `path.resolve` produce correct results, especially for Windows drive letters.
