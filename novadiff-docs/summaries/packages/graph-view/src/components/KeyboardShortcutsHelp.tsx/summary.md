### Overview  
A new component `KeyboardShortcutsHelp` is added to `packages/graph-view/src/components/KeyboardShortcutsHelp.tsx`. It renders a modal dialog that lists keyboard shortcuts grouped by category, with i18n support and a close handler.

### Key changes  
- **Imports** (lines 1‑3): `KeyboardShortcut` type, `formatShortcutKey`, and `useI18n`.  
- **Props interface** (lines 5‑7): `shortcuts: KeyboardShortcut[]` and `onClose: () => void`.  
- **Export** (lines 10‑13): `export default function KeyboardShortcutsHelp`.  
- **i18n usage** (line 14): `const { t } = useI18n();`.  
- **Shortcut grouping** (lines 16‑23): `shortcuts.reduce` builds `groupedShortcuts`.  
- **Category translations** (lines 25‑31): `categoryTranslations` maps `"General"`, `"Navigation"`, `"Tour"`, `"View"` to `t.keyboardShortcuts.*`.  
- **Modal markup** (lines 33‑104): overlay, header, list, footer, close button, and click‑to‑close handling.  
- **Shortcut rendering** (lines 80‑88): each shortcut shows `shortcut.description` and a formatted key via `formatShortcutKey`.

### Impact  
- **Typed API**: Props are fully typed, reducing runtime type errors.  
- **Centralized UI**: Shortcut rendering logic is isolated; adding a new shortcut only requires updating the `shortcuts` prop passed to the component.  
- **No breaking changes**: Existing components are unaffected; the new file is independent.

### Risks & follow‑ups  
- **i18n keys**: Verify that `t.keyboardShortcuts.general`, `navigation`, `tour`, `view`, `title`, `toggleHint`, and `closeHint` exist in all locales; missing keys will render `undefined`.  
- **Overlay click**: Ensure parent components wire `onClose` correctly; otherwise the modal may not dismiss.  
- **Styling utilities**: The component uses Tailwind classes `glass` and `glass-heavy`; confirm these utilities are defined in the theme.  
- **Accessibility**: No ARIA roles are added; consider adding `role="dialog"` and `aria-modal="true"` for screen readers.
