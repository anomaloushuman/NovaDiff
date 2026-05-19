### Overview  
A new `PullRequestsWorkspace` component is added at `src/components/PullRequestsWorkspace.tsx` (lines 28‑324).  
It provides a UI for browsing GitHub repositories, discovering local clones, and launching pull‑request comparisons in the NovaDiff desktop app.

### Key changes  
- **Imports** (lines 1‑10): React hooks, Lucide icons, and types from `../app/gitTypes` (`GithubPullRequestSummary`, `GithubRepoSummary`, `GitToolingStatus`, `LocalRepoMatch`).  
- **Props interface** (lines 17‑26): `PullRequestsWorkspaceProps` defines `onOpenCompare` and `onUseRepoAsTarget` callbacks.  
- **State** (lines 33‑42): `tooling`, `repos`, `selectedRepo`, `localMatches`, `prs`, `loading`, `prsLoading`, `error`, `repoFilter`, `busyPr`.  
- **API calls** (lines 46‑68, 74‑87, 89‑113, 115‑142): use `window.electronAPI` methods `gitDetectTooling`, `githubListRepos`, `gitMatchLocalRepo`, `githubListPrs`, `githubPrCompareRoots`.  
- **UI** (lines 153‑324): header with refresh button, status cards, login prompt, repo list with search, PR list with compare buttons, and local‑clone actions.  
- **Error handling**: descriptive messages set when API calls fail or prerequisites are missing.

### Impact  
- **Runtime dependency**: the component requires all referenced `electronAPI` methods; missing ones will cause runtime errors.  
- **Large lists**: the component renders full repo and PR arrays (`filteredRepos.map`, `prs.map`) without virtualization, which could affect responsiveness for many items.  
- **State updates**: no cancellation logic for pending promises; long‑running API calls may update state after the component unmounts.

### Risks & follow‑ups  
- **API contract**: verify that `window.electronAPI` exposes `gitDetectTooling`, `githubListRepos`, `gitMatchLocalRepo`, `githubListPrs`, and `githubPrCompareRoots`.  
- **Promise cleanup**: consider adding abort logic to prevent state updates on unmounted components.  
- **Layout fit**: the component uses flexbox panels; test on various screen sizes to ensure content remains visible.  
- **Testing**: add unit tests for the callbacks and integration tests for the full workflow.
