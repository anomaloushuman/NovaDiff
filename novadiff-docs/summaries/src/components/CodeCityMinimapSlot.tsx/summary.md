### Overview  
`src/components/CodeCityMinimapSlot.tsx` now registers a listener for the global event **`novadiff-code-viewer-open-change`**. The handler (`update`) recalculates the minimap insets whenever the code‑viewer’s open state changes.

### Key changes  
- **Added listener** (line 72):  
  ```ts
  window.addEventListener("novadiff-code-viewer-open-change", update);
  ```  
- **Removed listener** (line 78):  
  ```ts
  window.removeEventListener("novadiff-code-viewer-open-change", update);
  ```  
- No other imports or logic were modified; the component still relies on `measureCodeCityChromeInsets`, `ResizeObserver`, and `MutationObserver` for layout changes.

### Impact  
- The component now reacts to the code‑viewer’s open/close state, which may prevent stale inset values when the viewer toggles.  
- The added listener is lightweight, merely scheduling a single `requestAnimationFrame` update.  
- Cleanup occurs in the same effect cleanup block, ensuring no lingering listeners after unmount.

### Risks & follow‑ups  
- **Event name mismatch**: Verify that the code‑viewer dispatches `novadiff-code-viewer-open-change`.  
- **Duplicate listeners**: Ensure that multiple mounts of `CodeCityMinimapSlot` do not accumulate listeners; the cleanup logic should prevent this.  
- **Update idempotency**: Confirm that rapid open/close toggles do not cause race conditions or unnecessary re‑renders.  
- **Testing coverage**: Add unit tests that simulate the event dispatch and assert that `measureCodeCityChromeInsets` is invoked with the correct host element.
