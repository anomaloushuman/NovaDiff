### Overview  
`src/components/ChangedFilesTree.tsx` is a new component that renders a virtualized tree of changed files. It uses `react-window` for efficient scrolling and manages directory expansion, selection, and dynamic sizing.

### Key changes  
- **Imports** (lines 1‑11):  
  - `FixedSizeList` and `ListChildComponentProps` from `react-window`.  
  - `FileChange` type and tree‑building helpers (`ancestorDirPaths`, `buildChangedFilesTreeRoot`, `flattenVisibleRows`, `FlatRow`) from `../app/changedFilesTree`.  
- **`ChangedFilesTreeProps` interface** (lines 20‑24) defines `rows`, `selectedPath`, and `onSelectFile`.  
- **`TreeRow` component** (lines 34‑88) renders each row, handling directory toggles and file selection with ARIA attributes.  
- **`ChangedFilesTree` component** (lines 90‑217) sets up refs, state for list dimensions, and memoized data for the list. It uses `useDeferredValue` to avoid blocking UI on rapid row changes.  
- **Layout effects**:  
  - Reset expanded dirs when `rows` change (lines 111‑117).  
  - Expand ancestor dirs when `selectedPath` changes (lines 131‑150).  
  - Observe host size with `ResizeObserver` to update `listWidth`/`listHeight` (lines 152‑167).  
  - Scroll to the selected file when it appears (lines 169‑179).  
- **Conditional rendering**: shows messages when no rows or no visible files (lines 192‑196, 200‑202).

### Impact  
- **Performance**: Virtualized list reduces DOM nodes for large diffs.  
- **UX**: Auto‑expansion of ancestor dirs and scrolling to the selected file improve navigation.  
- **Dependencies**: Requires `react-window`; ensure it is installed and bundled.  
- **Styling**: New CSS classes (`file-tree-virt-row`, `file-tree-dir`, `file-pill`) must exist or be added.  
- **Testing**: Existing tests for file selection and directory toggling need updates to cover the new component.

### Risks & follow‑ups  
- Verify `ResizeObserver` cleanup works across browsers (Safari/Edge).  
- Confirm `useDeferredValue` does not cause stale UI when `rows` update rapidly.  
- Ensure `TreeRow` handles missing `row` gracefully (currently returns `null`).  
- Run lint, unit, and integration tests to catch any missing imports or type errors introduced by the new file.
