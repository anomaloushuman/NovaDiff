### Overview  
A new `FileExplorer` component was added to `packages/graph-view/src/components/FileExplorer.tsx`. It builds a collapsible file tree from the current graph’s nodes and lets users double‑click a file row to navigate to its source.

### Key changes  
- **Imports** (lines 1‑4): added `useMemo`, `useState` from React, `GraphNode` type, `useDashboardStore`, and `useI18n`.  
- **`FileEntry` interface** (lines 6‑12) defines the tree node shape.  
- **Path utilities** (lines 14‑19, 21‑25) sanitize node paths and resolve duplicates.  
- **Tree builder** (lines 27‑82) converts `GraphNode[]` into a sorted `FileEntry[]`.  
- **UI components** (lines 84‑140, 142‑214) render each folder/file row, manage expand/collapse state, and wire navigation via `useDashboardStore`.  
- **Internationalisation** (line 146) supplies translated labels for empty states and file counts.

### Impact  
- **Correctness**: `buildFileTree` skips nodes without a `filePath` or with invalid paths, preventing crashes.  
- **Maintainability**: All logic resides in a single file; the tree‑building functions are pure and testable.  
- **Performance**: `useMemo` recomputes the tree only when the graph changes.  
- **Compatibility**: No API changes; the component is UI‑only and does not modify existing stores or types.

### Risks & follow‑ups  
- Verify that every `GraphNode` contains a valid `filePath`; otherwise the tree will be empty.  
- Test rendering with an empty graph to confirm the “no graph loaded” message appears.  
- Benchmark `buildFileTree` on the largest expected graph to ensure UI responsiveness.  
- Confirm that translation keys (`t.common.noGraphLoaded`, `t.fileExplorer.*`) exist and render correctly.
