### Overview
A new component, `CodeCityMinimapSlot`, is added in **src/components/CodeCityMinimapSlot.tsx** (lines R1‑R94). It renders a minimap slot that measures Chrome insets and updates its layout in response to DOM changes.

### Key changes
- **Imports** – React hooks (`useLayoutEffect`, `useRef`, `useState`) and types (`CSSProperties`, `ReactNode`) plus `measureCodeCityChromeInsets` and `CodeCityChromeInsets` from `../app/codeCityChromeInsets` (lines R1‑R5).  
- **DEFAULT_INSETS** – a default `CodeCityChromeInsets` object (lines R7‑R12).  
- **Component export** – `export function CodeCityMinimapSlot({ children, dockedControls = false }: { children: ReactNode; dockedControls?: boolean; })` (lines R14‑R20).  
- **Layout effect** – `useLayoutEffect` locates the host element, then sets up a `ResizeObserver`, a `MutationObserver`, and a window resize listener to call `measureCodeCityChromeInsets(host, { dockedControls })` (lines R24‑R78).  
- **Styling** – applies a CSS variable `--code-city-lift` from `insets.bottom` and conditionally adds classes for docked controls or hidden chrome (lines R80‑R88).  
- **Cleanup** – cancels animation frames, disconnects observers, and removes the resize listener on unmount (lines R72‑R77).

### Impact
The component now tracks layout changes and applies Chrome insets dynamically. It exposes `--code-city-lift` for styling and debugging. The implementation relies on `ResizeObserver` and `MutationObserver`; browsers without support may need polyfills.

### Risks & follow‑ups
- **Export visibility** – confirm `CodeCityMinimapSlot` is re‑exported from the component index if required.  
- **Observer cleanup** – ensure `cancelAnimationFrame`, `ro.disconnect()`, and `mo.disconnect()` run on unmount to avoid leaks.  
- **Host element resolution** – verify the logic for `host` (docked vs. non‑docked) correctly selects the intended element in both modes.  
- **CSS variable usage** – consuming styles must reference `--code-city-lift` to apply the visual lift effect.
