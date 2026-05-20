### Overview
A new module `electron/github-service.cjs` is added. It wraps the GitHub CLI (`gh`) and exposes functions for authentication status, repository and pull‑request listing, PR creation, and account detection.

### Key changes
- **Imports added** (diff lines R3‑R9):  
  `spawnSync` from `node:child_process`, `parseGithubSlugFromUrl` from `./git-service.cjs`, and `augmentPathForCli`, `resolveGhExecutable`, `ghNotFoundError` from `./gh-path.cjs`.  
- **CLI helpers** (lines 11‑29): `runGh` executes a command via `spawnSync`; `tryRunGh` wraps it in a try/catch.  
- **Auth & user** (lines 43‑76, 163‑177): `getAuthStatus`, `getUserProfile`.  
- **Repository & PR utilities** (lines 77‑128, 129‑161): `listRepos`, `listPullRequests`, `viewPullRequest`, `createPullRequest`.  
- **Account detection** (lines 179‑200): `listDetectedAccounts`.  
- **Slug extraction** (lines 203‑210): `slugFromRepoRoot`.  
- **Exports** (lines 213‑224): all functions are exported via `module.exports`.

### Impact
- Provides runtime checks for CLI availability and authentication state, reducing silent failures.  
- Centralizes all `gh` interactions, simplifying future flag or command changes.  
- Each call spawns a new process (`spawnSync`), which may add overhead for bulk operations but is acceptable for UI‑driven actions.  
- Requires the `gh` executable; when missing, functions return informative messages (e.g., `getAuthStatus`).

### Risks & follow‑ups
- **Missing tests**: No unit tests cover the new module; add tests for `getAuthStatus` and `listRepos`.  
- **Error handling**: `runGh` throws generic errors; ensure callers handle them gracefully.  
- **Platform differences**: `spawnSync` and CLI path resolution may behave differently on Windows; verify across all target OSes.  
- **Security**: `createPullRequest` builds CLI arguments from user input; review for potential injection vulnerabilities.
