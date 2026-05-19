### Overview  
A new CommonJS module `electron/github-service.cjs` (lines 1‑224) wraps the GitHub CLI (`gh`). It exposes helper functions for authentication status, repository and PR listing, PR creation, and account detection.

### Key changes  
- **Imports** – added `spawnSync` from `node:child_process` (R3), `parseGithubSlugFromUrl` from `./git-service.cjs` (R4), and `augmentPathForCli`, `resolveGhExecutable`, `ghNotFoundError` from `./gh-path.cjs` (R9).  
- **Command execution** – `runGh` (lines 11‑27) runs `gh` synchronously with a timeout; `tryRunGh` (lines 30‑36) wraps it in a try/catch.  
- **Auth helpers** – `getAuthStatus` (lines 43‑74) checks `gh auth status`; `getUserProfile` (lines 163‑176) fetches the authenticated user via `gh api user`; `listDetectedAccounts` (lines 179‑200) returns the profile or a fallback.  
- **Repository/PR utilities** – `listRepos` (lines 77‑95), `listPullRequests` (lines 98‑126), `viewPullRequest` (lines 129‑139), and `createPullRequest` (lines 142‑160) invoke `gh` commands and parse JSON.  
- **Slug extraction** – `slugFromRepoRoot` (lines 203‑210) parses remote URLs to derive owner/repo and remote name.  
- **Exports** – all public functions are exported via `module.exports` (lines 213‑224).

### Impact  
- Requires the `gh` CLI; missing executables trigger `ghNotFoundError`.  
- Uses `spawnSync`, so long `gh` operations block the event loop.  
- Errors from `gh` are surfaced as JavaScript `Error` objects, enabling consistent handling in the Electron app.

### Risks & follow‑ups  
- **Missing `gh`** – confirm graceful handling of `ghNotFoundError` and user guidance.  
- **Performance** – monitor blocking behavior when listing many repos or PRs; consider async alternatives if needed.  
- **API changes** – `gh` output format may change; ensure JSON parsing remains robust.  
- **Security** – `createPullRequest` builds command arguments from user input; verify proper sanitization to avoid injection.
