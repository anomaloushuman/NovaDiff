### Overview  
A new module `electron/repo-discovery.cjs` is added to provide repository‑discovery utilities for the Electron app, replacing previous ad‑hoc logic.

### Key changes  
- **Imports** (diff lines 3‑6): `node:fs`, `node:path`, `node:os`, and local helpers `parseGithubSlugFromUrl`, `tryRunGit`.  
- **Constants** (lines 8‑27): `SKIP_DIR_NAMES` set, `MAX_REPOS = 120`, `MAX_DEPTH = 4`.  
- **`homeSearchRoots()`** (lines 29‑68): builds candidate paths from the user’s home directory, adds platform‑specific ones, deduplicates, and returns only existing directories.  
- **`readGitRemoteSlug(repoRoot)`** (lines 70‑86): runs `git remote -v`, parses each line, and returns a slug object (`owner`, `repo`, `remote`, `url`) or `null`.  
- **`scanForGitRepos(roots, opts)`** (lines 88‑141): recursively walks each root up to `MAX_DEPTH`, stops after `MAX_REPOS` matches, skips ignored or hidden directories, and collects repo metadata (`path`, `name`, `slug`, `remoteUrl`).  
- **`discoverRepos(payload)`** (lines 143‑155): merges home roots with optional `extraRoots`, filters by target owner/repo, and returns `{ searchRoots, matches, scannedAt }`.  
- **`matchRepoForGithubRepo(owner, repo, extraRoots)`** (lines 157‑159): thin wrapper around `discoverRepos`.  
- **Exports** (lines 161‑166): `homeSearchRoots`, `discoverRepos`, `matchRepoForGithubRepo`, `readGitRemoteSlug`.

### Impact  
- Deterministic deduplication via a `seen` set; hidden/ignored directories are skipped; a target slug filter is applied (lines 92‑120).  
- All discovery logic is centralized; constants centralize limits (lines 26‑27).  
- Synchronous `fs` calls are bounded by `MAX_DEPTH`/`MAX_REPOS` (lines 95‑97, 96‑97).  
- Uses Node 18+ `node:` import specifiers; may not work on older Electron/Node builds (diff lines 3‑6).

### Risks & follow‑ups  
- **Regression**: verify handling of permission errors and non‑existent directories on Windows, Linux, macOS (lines 100‑104, 106‑110).  
- **Compatibility**: test `node:` imports against the target Electron runtime; provide a fallback if necessary (diff lines 3‑6).  
- **Performance**: benchmark startup time on machines with many nested repos; consider async alternatives if blocking becomes an issue (unknown from the available diff/scan evidence).  
- **Security**: synchronous file system access blocks the renderer thread; confirm acceptability for the app’s UX (unknown from the available diff/scan evidence).
