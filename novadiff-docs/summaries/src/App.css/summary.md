### Overview  
`src/App.css` now contains a liquid‑glass theme. The diff adds 104 lines (R130‑195) that set the app background to transparent and introduce a macOS‑style drag region. A light‑mode media query (R2929‑2966) is also added.

### Key changes  
- **Liquid‑glass theme** (R130‑195)  
  - `html.app-liquid-glass` and `html.app-liquid-glass body` set `background: transparent;`.  
  - `.app-root--liquid-glass` defines `--mac-liquid-drag-height: 34px;`.  
- **Light‑mode media query** (R2929‑2966)  
  - Adds a `prefers-color-scheme: light` query that introduces new CSS variables for the graph shell.  
- No other sections of the file were modified.

### Impact  
Adding the `app-liquid-glass` class enables a glass‑like UI overlay with a transparent background and a draggable area. The light‑mode media query provides a consistent appearance when the system prefers a light color scheme. Existing functionality should remain unchanged.

### Risks & follow‑ups  
- Verify that the transparent background does not reduce readability for all content.  
- Run targeted tests for the drag region and window‑chrome hiding to confirm macOS compatibility.  
- Ensure the new CSS variables do not conflict with other theme overrides.
