### Overview  
A new `GitHistoryContextPanel` component is added at `src/components/GitHistoryContextPanel.tsx` (≈587 lines). It renders a three‑tab panel for commit details, GitHub context, and actions, and includes helper utilities for date formatting, GitHub URL parsing, and error normalisation.

### Key changes  
- **Imports** (lines 1‑19): React hooks, `createPortal` from `react-dom`, icons from `lucide-react`, types from `../app/gitTypes` and `../app/workspaceTypes`, and `GitBlamePanel`.  
- **Exported interface** `GitHistoryContextPanelProps` (lines 23‑38) defines workspace data, commit references, flags, and callbacks.  
- **Utility functions** (lines 40‑88): `formatDate`, `slugFromRemoteUrl`, `friendlyGhError`, `threadKindLabel`.  
- **Component** `GitHistoryContextPanel` (lines 89‑587) manages state for commit detail, GitHub context, blame overlay, and tab selection.  
- **UI**: three tabs—Details, GitHub, Actions—rendered conditionally.  
- **GitHub integration**: fetches context via `window.electronAPI.githubCommitContext`, displays PRs, issues, and discussion threads.  
- **Blame overlay**: uses `createPortal` to render a `GitBlamePanel` over `document.body`.  
- **Action buttons**: set base/head, run semantic compare, review in City, generate docs, and line blame.

### Impact  
- **API surface**: relies on `window.electronAPI` functions (`gitCommitDetail`, `githubCommitContext`, `gitRepoStatus`). Missing or mis‑typed APIs will break the panel.  
- **UI**: new CSS classes (`git-history-context`, `git-blame-overlay`) must coexist with existing styles; potential layout interference.  
- **Testing**: no existing tests cover this component; unit and integration tests are required.

### Risks & follow‑ups  
- **API availability**: verify that `githubCommitContext` and `gitRepoStatus` exist in the Electron preload; otherwise the panel falls back to error messages.  
- **Null handling**: `slugFromRemoteUrl` may return `null`; ensure `repository` state is set before GitHub calls.  
- **Portal cleanup**: confirm that `createPortal` is unmounted properly when the component unmounts to avoid memory leaks.  
- **Accessibility**: check that tabs and buttons have appropriate ARIA roles; the overlay uses `role="presentation"` but tabs lack explicit roles.
