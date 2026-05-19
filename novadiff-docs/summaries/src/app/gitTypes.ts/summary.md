### Overview  
A new file `src/app/gitTypes.ts` has been added. It declares a set of TypeScript interfaces that describe Git tooling status, GitHub authentication, repository and pull‑request summaries, blame information, status files, and publish workflow data.

### Key changes  
- **`GitToolingStatus`** (lines 1‑6) – captures Git availability, version, error, and GitHub auth status.  
- **`GithubAuthStatus`** (lines 10‑17) – describes authentication state, user, host, scopes, and a message.  
- **`GithubRepoSummary`** (lines 19‑28) – provides metadata for a GitHub repo (owner, name, URLs, default branch, fork flag, update time).  
- **`GithubPullRequestSummary`** (lines 30‑41) – details a PR (number, title, state, refs, author, draft flag, repo).  
- **`PublishPreview`**, **`PublishExecuteResult`**, **`PublishExecutePayload`** (lines 91‑125) – model the publish preview, execution result, and payload for the publish command.  
- Additional supporting interfaces (`LocalRepoMatch`, `GitBlameOwner`, `GitBlameAtRefResult`, `GitStatusFile`, `GitRepoStatus`, `PrCompareRoots`) are also introduced.

### Impact  
- **Compile‑time safety**: Existing code that imports these interfaces will benefit from stricter type checking.  
- **API surface expansion**: New interfaces may be referenced by other modules; missing imports will surface as TypeScript errors.  
- **Documentation**: The added types serve as a single source of truth for Git‑related data structures, improving maintainability.  
- **No runtime changes**: The file contains only type definitions, so the built JavaScript output is unaffected.

### Risks & follow‑ups  
- **Missing imports**: Verify that modules consuming these types import from `src/app/gitTypes.ts`.  
- **Property mismatches**: Ensure that any existing objects conform to the new interface shapes (e.g., `GitToolingStatus.git.gitVersion` can be `null`).  
- **Build & lint**: Run `npm run lint`, `npm test`, and `npm run build` to confirm no type errors.  
- **Documentation**: Update any README or API docs that reference GitHub or Git status structures to reflect the new interfaces.
