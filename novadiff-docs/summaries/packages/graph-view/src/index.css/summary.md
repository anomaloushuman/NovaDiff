### Overview  
The `packages/graph-view/src/index.css` file was updated to modify the layout of React‑Flow controls when the CodeCity minimap is present. The changes add a grid‑based layout for the control panel, reposition the minimap and its button, and introduce light‑theme overrides. No JavaScript was touched.

### Key changes  
- **Grid layout for controls** – Lines 301‑340 add  
  ```css
  .novadiff-graph-embed .react-flow__controls.code-city-graph-dock-host { … }
  ```  
  turning the panel into a grid, removing borders, and making the background transparent.  
- **Minimap & button positioning** – Lines 315‑329 set  
  ```css
  .react-flow__panel.bottom.left.react-flow__controls:has([data-code-city-minimap]) { … }
  ```  
  with `grid-column: 1 / -1` for the minimap and `grid-row: 2` for the button.  
- **Control button styling** – Lines 341‑349 update  
  ```css
  .novadiff-graph-embed .react-flow__controls-button { … }
  ```  
  to match the new layout.  
- **Minimap appearance** – Lines 351‑355 keep the border radius and subtle border.  
- **Light‑theme overrides** – Lines 357‑364 adjust `.diff-faded`, scrollbar track, and `.warning-banner` for better contrast on light backgrounds.

### Impact  
- **UI** – The minimap docks beside the zoom controls instead of overlaying them, improving usability in the NovaDiff embed.  
- **Scope** – All new selectors are prefixed with `.novadiff-graph-embed`, limiting side effects.  
- **Performance** – Pure CSS changes; no runtime cost.  
- **Compatibility** – Existing React‑Flow components render normally; only the control layout changes.

### Risks & follow‑ups  
- **Layout regression** – Verify the grid layout on very small viewports or when the minimap is hidden.  
- **Specificity conflicts** – Ensure the new rules override any global React‑Flow styles; a visual check is recommended.  
- **Light‑theme consistency** – Test the overrides on both dark and light themes to confirm contrast and readability.  
- **Documentation** – Update any style guides that reference the old control layout.
