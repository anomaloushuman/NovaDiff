### Overview  
`packages/graph-view/src/hooks/useKeyboardShortcuts.ts` adds a reusable hook for global keyboard shortcuts and a helper to format shortcut keys for display.

### Key changes  
- **Import**: `useEffect` from React (line 1).  
- **Interface**: `KeyboardShortcut` (lines 3‑12) defines `key`, optional modifier flags (`ctrlKey`, `shiftKey`, `altKey`, `metaKey`), `description`, `action`, and `category`.  
- **Hook**: `useKeyboardShortcuts(shortcuts, enabled = true)` (lines 14‑51) registers a `keydown` listener via `useEffect`.  
  - Skips shortcuts when the event target is an `<input>`, `<textarea>`, or content‑editable element, unless the key is `Escape`.  
  - Matches the pressed key and modifiers against each shortcut, using `!event.modifier` when the shortcut flag is undefined.  
  - Calls `event.preventDefault()` when `ctrlKey`, `metaKey`, or `altKey` are active to avoid browser conflicts, then executes the shortcut’s `action`.  
- **Formatter**: `formatShortcutKey(shortcut)` (lines 52‑71) builds a human‑readable string.  
  - Detects macOS via `navigator.userAgentData?.platform` or `navigator.platform`.  
  - Adds symbols `⌘`, `⇧`, `⌥` for `metaKey`, `shiftKey`, and `altKey` respectively, omitting `⇧` for punctuation that requires shift.  
  - Appends the key in uppercase or the original character if it is shifted punctuation.

### Impact  
- Centralizes shortcut logic, simplifying addition or modification of shortcuts across the app.  
- Provides a single global `keydown` listener per component mount, with an early return when `enabled` is `false`.  
- Offers platform‑aware key labels for tooltips or help dialogs.

### Risks & follow‑ups  
- **Browser shortcut conflicts**: Verify that common shortcuts (e.g., `Ctrl+S`, `⌘+Z`) still function after `preventDefault()` is applied.  
- **Meta key detection**: The matching logic defaults to `!event.metaKey` when `shortcut.metaKey` is omitted; tests should cover this case.  
- **Shift‑punctuation handling**: `formatShortcutKey` omits `⇧` for punctuation; confirm this matches user expectations.  
- **Testing coverage**: Add unit tests for `useKeyboardShortcuts` covering input bypass, modifier matching, and default prevention.
