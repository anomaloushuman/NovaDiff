### Overview  
A new `src/components/GitBlamePanel.tsx` component is added. It renders a file list from a workspace snapshot, loads Git blame for a selected file, and displays line‑by‑line author attribution.

### Key changes  
- **Imports**: added React hooks, `lucide-react` icons, and type imports from `../app/gitTypes` and `../app/workspaceTypes` (R1‑R4).  
- **Props interface**: `GitBlamePanelProps` declares `repoRoot: string`, `commit: WorkspaceCommitSnapshot`, and `onClose: () => void` (R6‑R9).  
- **Component logic**: uses `window.electronAPI` to call `workspaceSnapshotListFiles`, `gitBlameAtRef`, and `workspaceSnapshotReadFile` (lines 13‑70).  
- **State & effects**: manages file list, search query, selected path, blame data, file content, loading flags, and error state (lines 14‑21, 23‑34, 44‑70).  
- **UI**: renders a searchable file list, loading indicators, blame owners, error messages, and a preformatted blame view with author badges (lines 74‑158).

### Impact  
- Requires the Electron main process to expose `workspaceSnapshotListFiles`, `gitBlameAtRef`, and `workspaceSnapshotReadFile`; otherwise the component fails silently.  
- Loads all snapshot files on mount; filtering is capped at 200 results, so large snapshots may affect initial load time.  
- No new logs are added; the UI provides visual feedback for loading and errors.

### Risks & follow‑ups  
- **API availability**: verify that the main process implements the required methods (unknown from the available diff/scan evidence).  
- **Large repos**: test snapshots > 10 k files to ensure the UI remains responsive (unknown from the available diff/scan evidence).  
- **Type safety**: ensure `commit.snapshotPath`, `commit.hash`, and `commit.shortHash` are defined; otherwise the component may crash (unknown from the available diff/scan evidence).  
- **Image filtering**: the `.png/.jpg` exclusion logic may miss other binary assets; confirm coverage (unknown from the available diff/scan evidence).
