### Overview  
`src/components/LlmSettingsModal.tsx` now renders its modal through the `AnimatedOverlay` component instead of a custom backdrop `<div>`. The early‑return guard (`if (!open) { return null; }`) has been removed, so the component mounts regardless of the `open` prop and relies on `AnimatedOverlay` to show/hide the panel. Event handling for closing the modal has been shifted to the overlay’s `onClose` prop, and the backdrop and panel classes are now supplied via `backdropClassName` and `panelClassName`.

### Key changes  
- **Import added** (line 4): `import { AnimatedOverlay } from "./ui/AnimatedOverlay"`.  
- **Early‑return removed** (lines 33‑35).  
- **Backdrop `<div>` removed** (lines 49‑56).  
- **Panel `<div>` removed** (line 58).  
- **`AnimatedOverlay` usage** (lines 46‑51):  
  ```tsx
  <AnimatedOverlay
    open={open}
    onClose={onClose}
    backdropClassName="llm-modal-backdrop"
    panelClassName="llm-modal"
    labelledBy="llm-modal-title"
  >
  ```  
- **Button class names simplified**: removed `className="llm-btn ghost"` and `className="llm-btn primary"`; dynamic `className={provider === "ollama" ? "active" : ""}` now controls the provider buttons.  
- **Event handlers**: `onMouseDown` click‑outside logic removed; closing is handled by `AnimatedOverlay`.  

### Impact  
- The modal is always mounted, which may increase memory usage but keeps state intact when toggled.  
- Styling is largely preserved via the same `backdropClassName`/`panelClassName`, but the removal of explicit `<div>` wrappers could affect layout if CSS targets those elements.  
- Click‑outside closing behavior now depends on `AnimatedOverlay`; if that component does not propagate the event, the modal may not close as before.  
- Button styling changes may alter the visual appearance of the provider selector, cancel, test, and save actions.

### Risks & follow‑ups  
- **Close‑on‑outside**: Verify that `AnimatedOverlay` correctly closes the modal when clicking the backdrop.  
- **Styling regressions**: Inspect the modal layout and button appearance to ensure the removed `<div>` wrappers and class names do not break the design.  
- **Mounting overhead**: Monitor performance when the modal is frequently toggled; consider re‑introducing an early‑return if unnecessary renders become problematic.  
- **Accessibility**: Confirm that the `labelledBy` prop and ARIA attributes still provide the expected screen‑reader support.
