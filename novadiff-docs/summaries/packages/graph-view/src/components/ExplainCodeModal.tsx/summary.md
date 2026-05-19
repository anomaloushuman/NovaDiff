### Overview  
A new `ExplainCodeModal` component is added at  
`packages/graph-view/src/components/ExplainCodeModal.tsx` (lines R1‑116).  
It renders a modal dialog that shows explanatory Markdown text, a loading indicator, error messages, and an optional saved hint.

### Key changes  
- **Imports** – `useEffect`, `useRef` from React and `ReactMarkdown` from `react‑markdown` are added (R1‑R2).  
- **Props interface** – `ExplainCodeModalProps` (R4‑R13) defines `open`, `title`, `subtitle?`, `text`, `loading`, `error`, `savedHint?`, and `onClose`.  
- **Component logic** –  
  - `bodyRef` (R25) auto‑scrolls to the bottom when `open` and `loading` are true (R27‑R36).  
  - A global `keydown` listener closes the modal on `Escape` when not loading (R38‑R49).  
  - Conditional rendering: returns `null` when `!open`; otherwise renders backdrop, header, body, and footer (R51‑R114).  
  - Body displays an error paragraph, Markdown via `<ReactMarkdown>{text}</ReactMarkdown>`, a streaming caret when `loading`, or a placeholder (R88‑R100).  
  - Footer shows `savedHint` and a “Done” button disabled while loading (R103‑R111).  
- **Accessibility** – backdrop has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="explain-code-title"` (R57‑R60).

### Impact  
- **Self‑contained** – no existing components are modified.  
- **Typed API** – all props are explicitly typed.  
- **Performance** – two lightweight `useEffect` hooks; scroll logic runs only when needed.  
- **Bundle size** – introduces `react-markdown`; ensure it is listed in `package.json`.  
- **User feedback** – loading indicator and error messages are visible.

### Risks & follow‑ups  
- **Dependency** – verify `react-markdown` and its types are installed.  
- **CSS classes** – confirm that classes such as `novadiff-explain-modal-backdrop` exist; otherwise styling will fail.  
- **Event cleanup** – the `keydown` listener is removed on unmount (R48); confirm no leaks.  
- **Accessibility** – test focus trapping and that `aria-labelledby` correctly references the title.
