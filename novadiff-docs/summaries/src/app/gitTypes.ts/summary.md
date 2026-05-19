### Overview
A new file `src/app/gitTypes.ts` (added lines 1‑125) defines a set of TypeScript interfaces that model Git tooling status, GitHub authentication, repository and pull‑request summaries, local repo matching, blame analysis, file status, publishing previews, and execution payloads.

### Key changes
- `GitToolingStatus` (lines 1‑6) – exposes Git availability, version, error, and a nested `GithubAuthStatus`.  
- `GithubAuthStatus` (lines 10‑16) – flags for availability, login, user, hostname, scopes, and a message.  
- `GithubRepoSummary` (lines 19‑27) – lightweight repo metadata.  
- `GithubPullRequestSummary` (lines 30‑41) – PR metadata including number, title, state, refs, author, and draft flag.  
- `LocalRepoMatch` (lines 43‑47) – path, name, slug, and remote URL.  
- `GitBlameOwner` (lines 50‑54) – author, line count, ratio.  
- `GitBlameAtRefResult` (lines 56‑62) – blame result structure.  
- `GitStatusFile` (lines 64‑69) – file path, status, staged/unstaged flags.  
- `GitRepoStatus` (lines 71‑82) – repo root, branch, head, upstream, sync counters, dirty flag, files, remotes, subdir.  
- `PrCompareRoots` (lines 84‑88) – roots and refs for comparison.  
- `PublishPreview` (lines 91‑102) – preview of a publish operation.  
- `PublishExecuteResult` (lines 104‑111) – result of executing a publish.  
- `PublishExecutePayload` (lines 113‑125) – payload for a publish request.

### Impact
- Provides a unified type surface for all git‑related data, improving compile‑time type safety.  
- No runtime code is added; the change is purely declarative.  
- Existing modules can import these interfaces from `src/app/gitTypes.ts` for clearer contracts.

### Risks & follow‑ups
- Verify that imports reference the correct path (`src/app/gitTypes.ts`).  
- Ensure no name clashes with existing symbols in other modules.  
- Run the TypeScript compiler and the test suite to confirm no type errors arise from the new definitions.
