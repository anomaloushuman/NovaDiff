### Overview
A new file **packages/graph-view/src/hooks/useKeyboardShortcuts.ts** introduces a keyboard‑shortcut system for the graph view.  
- **Interface** `KeyboardShortcut` (lines 3‑12) defines optional modifier flags (`ctrlKey`, `shiftKey`, `altKey`, `metaKey`) and required fields (`key`, `description`, `action`, `category`).  
- **Hook** `useKeyboardShortcuts` (lines 14‑51) registers a global `keydown` listener via `useEffect` (R1).  
- **Formatter** `formatShortcutKey` (lines 52‑71) builds a human‑readable shortcut string.

### Key changes
- **Interface**: added optional modifier flags and required fields (diff lines R3‑R11).  
- **Hook**:  
  - Uses `useEffect` to attach a listener (R1).  
  - Skips shortcuts when the event target is an `<input>`, `<textarea>`, or content‑editable element unless the key is `Escape` (lines 21‑27).  
  - Matches shortcuts by key and modifier state, with a “not pressed” fallback (lines 29‑34).  
  - Prevents default for shortcuts involving `Ctrl`, `Meta`, or `Alt` (lines 37‑40).  
  - Executes `shortcut.action()` and breaks the loop (lines 41‑42).  
  - Cleans up by removing the listener (lines 47‑48).  
- **Formatter**:  
  - Detects macOS via `navigator.userAgentData` or `navigator.platform` (lines 55‑58).  
  - Omits the Shift symbol for punctuation that inherently requires it (lines 63‑65).  
  - Returns the joined string (lines 70‑71).

### Impact
- **Correctness**: listener now ignores typing contexts and respects modifier combinations, reducing accidental activation (inferred from logic).  
- **Maintainability**: centralizes shortcut logic in a single file, simplifying future extensions.  
- **Performance**: a single global listener per component mount; cleanup handled in the effect’s return.  
- **Observability**: `formatShortcutKey` provides consistent UI labels for shortcut lists.

### Risks & follow‑ups
- Verify that the `keydown` listener does not interfere with existing global shortcuts elsewhere in the app (unknown from diff).  
- Ensure `navigator.userAgentData` fallback correctly detects macOS on all target browsers (unknown from diff).  
- Test that the `Escape` key still functions in input fields when shortcuts are disabled (unknown from diff).  
- Confirm that the new interface does not break existing consumers that may have relied on implicit modifier defaults (unknown from diff).
