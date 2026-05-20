### Overview  
`src/components/GitHistoryWorkspace.tsx` is a new component that renders a commit‑history panel, supports live‑head comparison, and exposes callbacks for commit actions. It is added at lines 1‑269 of the file.

### Key changes  
- **Imports** – Lines 1‑9 add React hooks (`useCallback`, `useEffect`, `useMemo`, `useState`) and Lucide icons (`BookOpen`, `Loader2`, `RefreshCw`, `Search`).  
- **Props** – Lines 11‑23 declare `GitHistoryWorkspaceProps` with callbacks:  
  - `onCompareCommits(base, head?, options?)`  
  - `onDocumentCommit(base, head)`  
  - `onLiveRepoPersist(liveDevRepoRoot)`  
  - optional `onRefreshHistory`.  
- **State & effects** – `useState` tracks `baseHash`, `headHash`, `useLiveHead`, `liveRepoRoot`, `blameCommit`, `commitQuery`. `useEffect` (lines 45‑47) syncs `liveRepoRoot` when the workspace changes.  
- **Memoization** – `sorted` (lines 49‑52) and `filteredCommits` (lines 61‑73) are memoized to avoid recomputing on every render.  
- **Handlers** – `browseLiveRepo` (lines 82‑90), `persistLiveRepo` (lines 92‑97), `swapRevisions` (lines 104‑108), and `runCompare` (lines 110‑125) orchestrate user actions and invoke the supplied callbacks.  
- **Render** – Lines 127‑269 compose `HistoryCompareStrip`, `GitBlamePanel`, and a commit list with actions (Set base/head, Blame, Docs).  
- **Electron API** – `window.electronAPI.pickDirectory` is called in `browseLiveRepo` (line 84).

### Impact  
- **Runtime** – The component relies on `window.electronAPI`; if undefined, calls to `pickDirectory` will fail.  
- **Prop validation** – All callbacks except `onRefreshHistory` are required; missing them will break functionality.  
- **Performance** – Sorting and filtering run on every state change; memoization mitigates but large commit sets may still be costly.  
- **User feedback** – `Loader2` spinner and status messages (`workspace.historyProgress?.message`, `workspace.historyError`) provide visibility into indexing and errors.

### Risks & follow‑ups  
- **Electron API availability** – Verify `window.electronAPI` exists in all target environments.  
- **Live‑head logic** – Ensure `liveRepoRoot` is persisted correctly via `onLiveRepoPersist`.  
- **Large histories** – Benchmark sorting/filtering with many commits; consider pagination if performance degrades.  
- **Unknown from the available diff/scan evidence** – The diff does not show how `onCompareCommits` handles the `useLiveHead` option beyond the call; confirm implementation elsewhere.
