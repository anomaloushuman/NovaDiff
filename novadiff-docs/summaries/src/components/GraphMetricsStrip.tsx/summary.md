### Overview  
A new component `GraphMetricsStrip` is added at `src/components/GraphMetricsStrip.tsx`.  
It renders a toggleable strip that visualizes workspace metrics (change mix, depth, imports, calls) and tables for the top extensions and roots.

### Key changes  
- **File added**: `src/components/GraphMetricsStrip.tsx` (lines 1‑134).  
- **Imports** (lines 1‑3): `useState` from React, `DocWorkspaceMetrics` type, and `DocMermaidMount`.  
- **Props interface** (lines 5‑15): `metrics`, `pieDef`, `depthDef`, `importDef`, `callDef`, `metricsChartsLoading`, `outlineLoading`, `topExtensions`, `topRoots`.  
- **Component implementation** (lines 17‑134):  
  - Uses `useState` to track `open`.  
  - Renders a button that toggles the strip (`aria-expanded={open}`).  
  - When open, shows four `DocMermaidMount` charts with `definition`, `loading`, and `loadingLabel` props.  
  - Displays two tables for `topExtensions` and `topRoots`.  
  - Footer shows a count derived from `metrics.byKind`.  
- **Styling**: relies on CSS classes such as `kg-metrics-strip`, `kg-metrics-strip-toggle`, `kg-metrics-strip-body`, `kg-metrics-charts`, and `kg-metrics-tables`.

### Impact  
- **No existing component is modified**; the addition is non‑breaking.  
- **Data contract**: callers must provide a `DocWorkspaceMetrics` object matching the expected shape; mismatches will surface at runtime.  
- **Dependencies**: requires `DocMermaidMount` and the referenced CSS classes; missing assets will affect layout or chart rendering.  
- **Render cost**: the strip is hidden by default, so the four Mermaid charts are only rendered after the user toggles it open.

### Risks & follow‑ups  
- Verify that `DocMermaidMount` correctly handles the `loading` and `loadingLabel` props; otherwise charts may not appear.  
- Ensure the footer’s `metrics.byKind` aggregation matches the actual `metrics` structure; a mismatch will break the path count.  
- Test the toggle logic for accessibility (e.g., `aria-expanded` state).  
- Confirm that the CSS classes (`kg-metrics-strip`, `kg-metrics-charts`, etc.) exist in the global stylesheet; missing classes will break layout.
