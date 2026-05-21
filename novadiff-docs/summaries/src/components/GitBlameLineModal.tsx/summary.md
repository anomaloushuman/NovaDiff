### Overview
A new modal component `GitBlameLineModal` is added at `src/components/GitBlameLineModal.tsx` (lines 1‑115). It displays line‑by‑line Git blame for a file and can be toggled via an `open` prop.

### Key changes
- **Imports** (lines 1‑3): `useEffect` from React, `Loader2` & `X` from `lucide-react`, and `GitBlameAtRefResult` type from `../app/gitTypes`.
- **Props interface** (lines 5‑13): `GitBlameLineModalProps` defines `open`, `relPath`, `blame`, `fileContent`, `loading`, `error`, `onClose`.
- **Component** (lines 15‑115): registers a `keydown` listener that calls `onClose` when `Escape` is pressed (lines 24‑35). Returns `null` when `open` is `false` (lines 37‑39). Splits `fileContent` into lines (line 41) and renders a modal with a backdrop, header, close button, error message, loading spinner, owners list, blame error, and a `<pre>` block mapping each line to its author badge and text (lines 43‑114).

### Impact
- Adds a UI element that can be shown or hidden via the `open` prop; no existing components are modified.
- Requires `lucide-react` icons; ensure the package is listed in `package.json`.
- Uses `role="dialog"` and `aria-modal="true"` for accessibility, but no focus trap is implemented.

### Risks & follow‑ups
- Verify that the `keydown` listener is removed when the modal closes or the component unmounts (lines 33‑34).
- Confirm callers pass a valid `GitBlameAtRefResult` or `null`; otherwise `blame?.owners` may be `undefined`.
- If `fileContent` contains more lines than `blame.lineAuthors`, the author will default to an empty string (line 94).
- Ensure CSS classes such as `git-blame-modal-backdrop` and `git-blame-owners` exist; otherwise the modal will appear unstyled.
