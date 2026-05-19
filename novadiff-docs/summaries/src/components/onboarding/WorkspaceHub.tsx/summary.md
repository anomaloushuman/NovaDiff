### Overview  
A new onboarding component, `WorkspaceHub`, is added at `src/components/onboarding/WorkspaceHub.tsx`. It renders a UI for listing existing workspaces, creating new ones (local folder, clone URL, or GitHub repo), and opening an existing workspace.

### Key changes  
- **Exports** – `WorkspaceHubProps` (lines 6‑14) and `WorkspaceHub` component (lines 15‑285).  
- **Imports** – React hooks, Lucide icons, and types from `workspaceTypes` and `gitTypes` (lines 1‑4).  
- **State & callbacks** – `useState` for UI state, `useCallback` for `refreshList`, and `useEffect` hooks that subscribe to `window.electronAPI` events (lines 21‑53).  
- **Workspace creation** – `createWorkspace` handles three modes (`local`, `clone`, `github`) and calls `window.electronAPI.workspaceCreate` (lines 81‑140).  
- **Opening existing** – `openExisting` optionally calls `workspaceSetActive` (lines 144‑150).  
- **UI** – Tabs for mode selection, inputs for name, path, URL, or GitHub repo, and a list of workspaces (lines 152‑285).

### Impact  
- **Correctness** – relies on `window.electronAPI` methods (`workspaceList`, `workspaceCreate`, `workspaceSetActive`, `githubListRepos`, `onWorkspaceHistoryProgress`). Missing APIs will surface as user‑visible errors.  
- **Maintainability** – centralizes onboarding logic; future changes to workspace creation can be made in one place.  
- **Observability** – `historyMsg` and `error` UI elements expose progress and error states.  
- **Compatibility** – no changes to existing components; the new file is isolated.

### Risks & follow‑ups  
- **Electron API availability** – verify that all referenced API methods exist in every target environment.  
- **GitHub repo resolution** – `resolveGithubClone` may return a remote URL; downstream logic must handle both local paths and HTTP URLs.  
- **UI regressions** – test tab rendering, input behavior, and `Loader2` spinner across screen sizes.  
- **Type safety** – ensure that `GitUserProfile`, `NovaWorkspace`, `WorkspaceSessionState`, and `GithubRepoSummary` are exported from their modules; otherwise TypeScript errors will appear.
