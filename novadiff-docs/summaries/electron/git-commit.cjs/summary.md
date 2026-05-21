### Overview  
A new module `electron/git-commit.cjs` is added. It exports a `getCommitDetail` helper that retrieves commit metadata and statistics by invoking Git commands.

### Key changes  
- Import added at line 3: `const { runGit, tryRunGit } = require("./git-service.cjs");`  
- Function `getCommitDetail(repoRoot, hash)` added (lines 1‑69):  
  - Validates `repoRoot` and `hash` (lines 12‑14).  
  - Runs `git log -1 <hash>` with a custom format to capture hash, short hash, subject, author, email, date, and parents (lines 16‑21).  
  - Retrieves the commit body via `git log -1 <hash> --format=%B` (line 23).  
  - Calls `git show --stat` (line 28) and parses the summary for `filesChanged`, `insertions`, and `deletions` (lines 30‑43). Falls back to line count if the summary is missing (lines 44‑46).  
- Export added at line 69: `module.exports = { getCommitDetail };`

### Impact  
- Provides a single public API for commit detail retrieval.  
- Throws an error if `repoRoot` or `hash` is missing (lines 12‑14).  
- Requires three Git commands per call; performance impact is unknown from the diff.

### Risks & follow‑ups  
- Verify that `runGit`/`tryRunGit` in `git-service.cjs` return the expected `stdout`/`ok` flags.  
- The regexes used to parse the stat summary may fail on edge cases (e.g., commits with no file changes).  
- Test with repositories containing non‑ASCII commit messages to confirm UTF‑8 handling (unknown from diff).  
- Monitor latency in CI pipelines; consider caching or batching if call frequency is high (unknown from diff).
