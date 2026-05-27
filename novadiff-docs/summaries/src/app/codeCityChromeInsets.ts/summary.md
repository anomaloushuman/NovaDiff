### Overview  
`src/app/codeCityChromeInsets.ts` was modified.  
- Added `isCodeViewerOpen()` (lines 24‑31) that checks for `[data-novadiff-code-viewer-sheet]` or `[data-novadiff-code-viewer-modal]`.  
- Refactored `isBlockingModalOpen()` (lines 32‑48) to combine the new helper with the previous backdrop selectors and removed the obsolete `.novadiff-graph-shell.is-fullscreen .ui-overlay.is-open` selector.  
- Updated `measureCodeCityChromeInsets()` (lines 59‑104) to skip adding the sheet obstruction when the viewer is open and removed the earlier `layoutRow`‑based obstruction logic.

### Key changes  
- **`isCodeViewerOpen()`**: new helper returning a boolean based on two selectors.  
- **`isBlockingModalOpen()`**: now returns true if `isCodeViewerOpen()` is true or any of the backdrop selectors match; the selector list no longer contains `.novadiff-graph-shell.is-fullscreen .ui-overlay.is-open`.  
- **`measureCodeCityChromeInsets()`**:  
  - Skips adding the sheet obstruction when `isCodeViewerOpen()` is true (lines 75‑83).  
  - Removed the `layoutRow` traversal that previously added the sheet obstruction (lines 65‑71).  
  - Keeps activity‑bar obstruction logic unchanged (lines 87‑90).  
  - Bottom inset calculation remains the same.

### Impact  
- The obstruction list is shorter when the code‑viewer sheet is already open, reducing potential double‑lifting of the chrome.  
- Modal detection logic is clearer, separating viewer state from other backdrops.  
- No exported API changes; callers of `measureCodeCityChromeInsets` receive the same `CodeCityChromeInsets` shape.

### Risks & follow‑ups  
- Verify that all modal backdrops still trigger `isBlockingModalOpen()` by running UI tests.  
- Ensure `isCodeViewerOpen()` covers all identifiers used for the code‑viewer sheet/modal.  
- Confirm that removing the `layoutRow` check does not affect scenarios where the sheet is positioned outside the current row.  
- Run `npm run lint`, `npm test`, and the production build to catch any TypeScript or runtime errors introduced by the refactor.
