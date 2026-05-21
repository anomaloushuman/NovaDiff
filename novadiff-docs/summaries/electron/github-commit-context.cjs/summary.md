### Overview
Adds `electron/github-commit-context.cjs` exposing `getGithubCommitContext(fullName, sha)` to gather pull requests, issues, and comment threads for a commit using the GitHub CLI.

### Key changes
- Added `parseJsonSafe(raw, fallback)` (lines 5‑12) to safely parse JSON, returning `fallback` on error.  
- Added `shortGhError(message)` (lines 13‑22) to normalize CLI error messages.  
- Added `normalizeThread(entry)` (lines 25‑33) to standardize thread objects with defaults.  
- Implemented `getGithubCommitContext(fullName, sha)` (lines 40‑242) that:
  - Validates `fullName` and `sha`.  
  - Checks auth via `getAuthStatus()` (line 52).  
  - Executes `gh` commands through `tryRunGh` (line 3) to fetch pulls, issues, PR views, review comments, and issue comments.  
  - Aggregates results into `pullRequests`, `issues`, `threads`, and an `error` string.  
- Exported via `module.exports = { getGithubCommitContext }` (line 245).

### Impact
- Requires the GitHub CLI; errors from `gh` are captured and formatted by `shortGhError`.  
- Up to six `gh` calls per commit (pulls, issues, PR view, review comments, issue comments, fallback search).  
- Normalized thread objects simplify downstream rendering.  
- Errors are concatenated into a single string, allowing callers to display multiple failures.

### Risks & follow‑ups
- **CLI availability**: If `gh` is not installed or not in PATH, calls will fail.  
- **Auth state**: `getAuthStatus` must correctly report login status; otherwise the function returns empty arrays with an error message.  
- **Rate limits**: Multiple paginated requests may hit GitHub API limits; monitor for throttling.  
- **Parsing edge cases**: `parseJsonSafe` defaults to `fallback` on malformed JSON; callers should handle empty arrays.
