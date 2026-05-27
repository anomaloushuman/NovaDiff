### Overview
`DashboardContent` in `packages/graph-view/src/App.tsx` now includes a `useEffect` (added at R264‑R269) that synchronizes the global DOM state with the code‑viewer’s open/close status.

### Key changes
- **DOM attribute sync** – the effect toggles `data-code-viewer-open` on `<html>` whenever `codeViewerOpen` changes (R264‑R268).  
- **Global event dispatch** – it emits a `novadiff-code-viewer-open-change` event with `{ open: codeViewerOpen }` (R266‑R267).  
- **Cleanup** – on unmount or state change, the attribute is removed and a “closed” event (`open: false`) is fired (R269).  
- **Dependency** – the effect depends only on `codeViewerOpen`.

### Impact
- Enables CSS hooks (`[data-code-viewer-open]`) for styling based on the viewer’s state.  
- Provides a cross‑component notification mechanism via the custom event, allowing external modules to react to viewer transitions without tight coupling.  
- Keeps the component’s lifecycle clean by removing the attribute and firing a closed event on cleanup.

### Risks & follow‑ups
- Verify that the custom event name (`novadiff-code-viewer-open-change`) is unique and not colliding with other global events.  
- Ensure listeners for this event are properly cleaned up to avoid memory leaks.  
- Run lint, tests, and production build to confirm no unintended side‑effects.
