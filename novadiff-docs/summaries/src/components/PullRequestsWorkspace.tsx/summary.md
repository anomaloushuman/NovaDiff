### Overview  
A new component `PullRequestsWorkspace` is added at **src/components/PullRequestsWorkspace.tsx** (lines 1‑324). It renders a UI for browsing GitHub repositories, matching local clones, and launching pull‑request comparisons in the NovaDiff desktop app.

### Key changes  
- **Imports**  
  - React hooks added at **R1**: `useCallback`, `useEffect`, `useState`.  
  - Lucide icons added at **R2‑9**: `ExternalLink`, `FolderGit2`, `GitPullRequest`, `Loader2`, `RefreshCw`, `Search`.  
  - Type imports from `../app/gitTypes` added at **R10‑15**: `GithubPullRequestSummary`, `GithubRepoSummary`, `GitToolingStatus`, `LocalRepoMatch`.  
- **Props interface** (`PullRequestsWorkspaceProps`) defined at **R17‑26** with `suggestedRepoPath`, `onOpenCompare`, `onUseRepoAsTarget`.  
- **Component state** (R33‑42): tooling status, repo list, selected repo, local matches, PRs, loading flags, error, repo filter, busy PR.  
- **Callbacks**  
  - `refreshTooling` (R46‑68) queries `window.electronAPI.gitDetectTooling` and, if logged in, `githubListRepos`.  
  - `resolveLocal` (R74‑87) calls `gitMatchLocalRepo`.  
  - `selectRepo` (R89‑112) loads PRs via `githubListPrs` and local matches.  
  - `openPrCompare` (R115‑142) invokes `githubPrCompareRoots` and triggers `onOpenCompare`.  
- **UI**  
  - Header with refresh button (R165‑178).  
  - Status cards (R185‑197).  
  - Error display (R200).  
  - Repository list with search (R215‑242).  
  - PR panel showing local matches and compare button (R245‑319).

### Impact  
- The component depends on `window.electronAPI`; missing methods will surface as runtime errors.  
- Centralizes PR‑workspace logic, making future refactors easier.  
- Rendering large repo or PR lists may cause many re‑renders; pagination or memoization could improve performance.

### Risks & follow‑ups  
- **Electron API availability**: confirm that `gitDetectTooling`, `githubListRepos`, `githubListPrs`, `gitMatchLocalRepo`, and `githubPrCompareRoots` exist and return the expected shapes.  
- **Type safety**: ensure imported types match actual API responses to avoid runtime failures.  
- **UI responsiveness**: test with large data sets to verify no layout thrashing.  
- **Accessibility**: icons use `aria-hidden`; verify that interactive elements remain accessible to screen readers.
