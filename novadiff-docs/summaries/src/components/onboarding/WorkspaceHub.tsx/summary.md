### Overview  
A new `WorkspaceHub` component is added at `src/components/onboarding/WorkspaceHub.tsx` (lines 17‑307). It renders a UI for listing, creating, and opening workspaces and uses the Electron API (`window.electronAPI`) for workspace and GitHub operations.

### Key changes  
- **Imports** – added React hooks (`useCallback`, `useEffect`, `useState`) and icons (`FolderGit2`, `Loader2`, `Plus`)【R1‑R3】.  
- **Types** – declared `WorkspaceHubProps` (lines 6‑13) and `RepoMode` enum (line 15).  
- **Component** – `WorkspaceHub` (lines 17‑307) now manages local state for workspace creation, error handling, and mode selection.  
- **API interactions** – uses `window.electronAPI` for `workspaceList`, `workspaceCreate`, `workspaceSetActive`, `githubListRepos`, `workspaceMatchLocal`, and `onWorkspaceHistoryProgress`.  
- **UI** – renders a workspace list, mode tabs, input fields, and a create button with a loading indicator.  
- **Logic** – `createWorkspace` handles three modes (`local`, `clone`, `github`) with validation and payload construction; `openExisting` activates a workspace via `workspaceSetActive`.  
- **Side‑effects** – `useEffect` hooks refresh the workspace list on history progress and fetch GitHub repos when mode is `github`.

### Impact  
- **Runtime dependency** – the component requires the Electron API; absence of any method will cause runtime errors.  
- **Centralization** – workspace UI logic is now in a single component, simplifying future maintenance.  
- **Performance** – asynchronous calls to `githubListRepos` and `workspaceList` may introduce UI lag if the API is slow.  
- **User feedback** – `historyMsg` and `error` states provide visible messages; no additional logging is added.

### Risks & follow‑ups  
- **API availability** – confirm that all referenced Electron API methods exist in the current desktop build; the diff does not show their implementation.  
- **Type alignment** – ensure `NovaWorkspace` and `WorkspaceSessionState` match the API responses; mismatches could break `onOpenWorkspace`.  
- **Error messages** – verify that the error strings shown to users are clear and do not expose internal details.  
- **Large GitHub lists** – monitor the size of `ghRepos`; consider pagination or debouncing if the list grows large.
