### Overview  
`GitBlamePanel` now uses a tree‑view for file navigation and a modal for line‑by‑line blame. The component was split into a new `TreeRows` helper (lines 14‑100) and a `GitBlameLineModal` (rendered after the panel). File‑tree logic is memoized and the UI layout has been reorganized into a card‑style panel.

### Key changes  
- **Imports** – `ChevronDown`, `ChevronRight`, `Folder` icons and file‑tree helpers (`buildFileTree`, `collectFolderPaths`, `filterFileTree`) were added; `GitBlameLineModal` was imported. The original `FileText`, `Loader2`, `Search` import was replaced.  
- **State** – `relPath` was removed; `expanded` (`Set<string>`) and `selectedPath` were added.  
- **TreeRows** – renders recursive file/folder rows, handles expand/collapse, and calls `onSelectFile`.  
- **File‑tree logic** (lines 137‑152) builds a tree from `files`, filters it by `fileQuery`, and auto‑expands folders that match the filter.  
- **Blame loading** (lines 166‑192) sets `selectedPath`, opens the modal, clears `fileContent`, then fetches blame and file content.  
- **UI** – the old list was replaced by a card layout (`git-blame-files-card`) and a scrollable tree (`git-blame-tree-scroll`). The modal is rendered after the panel.  
- **Error handling** – errors are shown only when the modal is closed (`error && !blameModalOpen`).

### Impact  
- **Maintainability** – `TreeRows` isolates tree logic; the modal decouples blame display.  
- **Performance** – memoized tree building and filtering reduce re‑renders.  
- **UX** – clearer navigation, modal for detailed blame, consistent loading indicators.  
- **Compatibility** – no API changes; only UI refactor.

### Risks & follow‑ups  
- Verify that `collectFolderPaths` expands all matching folders; otherwise files may be hidden.  
- Ensure `GitBlameLineModal` receives correct `relPath` and `blame` props; missing data could crash the modal.  
- Confirm that the `expanded` state syncs with user interactions; stale state could leave folders collapsed.  
- Run lint, unit, and integration tests to catch any missing imports or type errors introduced by the new helpers.
