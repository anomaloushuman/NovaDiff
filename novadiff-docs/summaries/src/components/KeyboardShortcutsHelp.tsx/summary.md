### Overview  
A new React component `KeyboardShortcutsHelp` is added in `src/components/KeyboardShortcutsHelp.tsx`. It renders a modal overlay that lists common shortcuts and closes when the user presses **Escape** or clicks the close button.

### Key changes  
- **Import** `useEffect` from `react` (R1).  
- **Define** a `SHORTCUTS` constant array (R3‑R8) with key–description pairs.  
- **Export** `KeyboardShortcutsHelp` (R10) accepting `open: boolean` and `onClose: () => void`.  
- **Hook** `useEffect` (R17‑R28) attaches a `keydown` listener that calls `onClose` on **Escape** and removes the listener when the component unmounts or `open` changes.  
- **Conditional rendering**: returns `null` when `open` is false (R30‑R32).  
- **Markup** (R34‑R52): an overlay with `role="dialog"` containing a list of shortcuts rendered with `<kbd>` tags and a close button wired to `onClose`.

### Impact  
- **Correctness**: Provides a self‑contained shortcut help panel with no side effects beyond the key listener.  
- **Maintainability**: Shortcuts are stored in a constant array, making future extensions straightforward.  
- **Performance**: The event listener is added only while the panel is open, minimizing runtime overhead.  
- **Compatibility**: No existing APIs are modified; the component is purely additive.

### Risks & follow‑ups  
- Verify that the CSS classes (`shortcuts-help-overlay`, `shortcuts-help-panel`, etc.) are defined to avoid layout issues.  
- Ensure the component is rendered only when needed to prevent unnecessary listeners.  
- Confirm that the `onClose` callback correctly updates parent state; otherwise the panel may remain open.  
- Test that the **Escape** key does not interfere with other global shortcuts in the application.
