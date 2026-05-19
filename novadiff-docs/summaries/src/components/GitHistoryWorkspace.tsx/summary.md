### Overview  
A new `GitHistoryWorkspace` component is added at `src/components/GitHistoryWorkspace.tsx` (lines 1‑256). It provides a UI for browsing commit history, selecting base/head revisions, comparing commits, and viewing blame information.

### Key changes  
- **Imports** – Lines 1‑9 add React hooks (`useCallback`, `useEffect`, `useMemo`, `useState`), Lucide icons (`BookOpen`, `Loader2`, `Search`), and types from `../app/workspaceTypes`.  
- **Props interface** – Lines 11‑22 define `GitHistoryWorkspaceProps` with `workspace`, `busy`, `error`, and callbacks for compare, document commit, and live‑repo persistence.  
- **State & effects** – Lines 34‑41 initialize `baseHash`, `headHash`, `useLiveHead`, `liveRepoRoot`, `blameCommit`, and `commitQuery`. A `useEffect` (lines 43‑45) syncs `liveRepoRoot` with workspace changes.  
- **Commit handling** – Lines 47‑57 sort commits by `authoredAt`, set default base/head to the last two commits, and derive a filtered list from `commitQuery` (lines 59‑71).  
- **UI rendering** – Lines 125‑256 use `HistoryCompareStrip` and `GitBlamePanel`, display loading/error states, and render a searchable commit list with actions (Set base/head, Blame, Docs).  
- **Event handlers** – Lines 80‑123 implement `browseLiveRepo`, `persistLiveRepo`, `swapRevisions`, and `runCompare`, coordinating with `window.electronAPI` and parent callbacks.

### Impact  
- **API dependency** – The component relies on `window.electronAPI.pickDirectory`; missing API will break live‑repo browsing (unknown from the available diff/scan evidence).  
- **Type safety** – Uses `WorkspaceCommitSnapshot` and `GitHistoryCompareOptions`; ensure these types are exported correctly.  
- **Consumer changes** – Existing consumers must provide the new callbacks or update type definitions.

### Risks & follow‑ups  
- Verify that `window.electronAPI.pickDirectory` and `onLiveRepoPersist` are defined in all target environments.  
- Confirm that `HistoryCompareStrip` correctly reflects `useLiveHead` and `liveRepoRoot` changes.  
- Test the component with large commit sets to ensure memoization of sorting and filtering is sufficient.
