### Overview  
A new component, `ExplainCodeModal`, has been added to `packages/graph-view/src/components/ExplainCodeModal.tsx`. It renders a modal dialog that displays explanatory Markdown and handles loading, errors, and keyboard shortcuts.

### Key changes  
- **Imports** (lines 1‑2): `useEffect`, `useRef` from `react`; `ReactMarkdown` from `react-markdown`.  
- **Props interface** (lines 4‑13): `open`, `title`, optional `subtitle`, `text`, `loading`, `error`, optional `savedHint`, `onClose`.  
- **Component function** (lines 15‑116):  
  - Two `useEffect` hooks:  
    - Scrolls body to bottom when `open && loading` changes (lines 27‑36).  
    - Listens for `Escape` to trigger `onClose` when not loading (lines 38‑49).  
  - Conditional rendering: returns `null` if `open` is false (lines 51‑53).  
  - Renders backdrop, header, body (Markdown via `ReactMarkdown` at line 91), error message, loading placeholder, and a “Done” button that reflects streaming state (lines 110‑111).  
  - Accessibility attributes: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="explain-code-title"` on the backdrop (lines 57‑60).

### Impact  
- Fully typed; no runtime errors expected if props are supplied correctly.  
- Encapsulated logic; future changes to scrolling or keyboard handling can be isolated.  
- Minimal overhead: two `useEffect` hooks and a single `ref`.

### Risks & follow‑ups  
- **Missing CSS**: classes `novadiff-explain-modal-*` must exist to style the modal.  
- **Dependency**: `react-markdown` must be installed and compatible with the current React version.  
- **Event listener cleanup**: `keydown` listener is removed on unmount (line 48); verify no leaks.  
- **Accessibility audit**: run an a11y scan to confirm dialog behavior for screen readers.
