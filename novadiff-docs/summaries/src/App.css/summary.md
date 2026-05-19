### Overview
The `src/App.css` file now includes three new CSS rules (lines R2638‑R2644) that target the NovaDiff graph‑embed component inside the dashboard pane.

### Key changes
- `R2638‑R2640`:  
  ```css
  .novadiff-graph-embed .embed-graph-dashboard-pane {
      overflow: hidden;
  }
  ```
- `R2642‑R2644`:  
  ```css
  .novadiff-graph-embed .embed-graph-dashboard-pane > .novadiff-graph-embed {
      flex: 1 1 auto;
      min-height: 0;
  }
  ```
These additions are confined to the last ~9 lines of `src/App.css`.

### Impact
- The `overflow: hidden` rule clips any content that would otherwise overflow the dashboard pane, which should prevent unintended scrollbars.  
- The `flex: 1 1 auto; min-height: 0;` rules allow the embedded graph to grow and shrink within the pane, improving responsiveness.

### Risks & follow‑ups
- Verify that `overflow: hidden` does not unintentionally hide required content in other contexts.  
- Run the nearest targeted tests and perform a quick manual smoke test on the graph‑embed area.  
- Monitor for unintended interactions with other flex containers that might share the same class names.
