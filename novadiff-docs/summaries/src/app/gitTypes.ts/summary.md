### Overview  
`src/app/gitTypes.ts` now includes a set of commit‑detail and GitHub‑context interfaces and adds an optional `stagePaths` flag to `PublishExecutePayload`. The changes span lines 125‑172 of the file.

### Key changes  
- **`PublishExecutePayload`** (lines 125‑127) now accepts an optional `stagePaths?: string[]` to specify which paths to stage.  
- **`GitCommitDetail`** (lines 129‑142) exposes commit metadata: `hash`, `shortHash`, `subject`, `body`, `authorName`, `authorEmail`, `authoredAt`, `parentHashes`, `filesChanged`, `insertions`, `deletions`.  
- **`GithubCommitPullRequest`** (lines 143‑149) and **`GithubCommitIssue`** (lines 150‑158) provide minimal PR/issue info (`number`, `title`, `state`, `url`).  
- **`GithubCommitThreadKind`** (line 157) is a union of `"pr_review" | "pr_comment" | "issue_comment"`.  
- **`GithubCommitThread`** (lines 159‑166) records a thread’s `kind`, `number`, `author`, `body`, `createdAt`, and `url`.  
- **`GithubCommitContext`** (lines 168‑172) aggregates arrays of pull requests, issues, threads, and an optional `error` string.

### Impact  
- Modules importing `gitTypes` now have access to the new interfaces, enabling richer commit and GitHub context handling.  
- The `stagePaths` option gives callers finer control over staged files before publishing, potentially improving workflow flexibility.  
- No existing exports were removed, so backward compatibility is preserved.  
- TypeScript consumers may need to adjust type assertions if they previously relied on the exact shape of `PublishExecutePayload`.

### Risks & follow‑ups  
- Verify that code constructing `PublishExecutePayload` still functions; the new optional field should not break existing logic.  
- Ensure downstream modules that consume `GitCommitDetail` or `GithubCommitContext` are updated to use the new interfaces.  
- Run the full test suite to catch any lint or type‑checking regressions introduced by the added types.  
- Confirm that documentation and generated type definitions include the new interfaces for developer visibility.
