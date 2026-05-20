### Overview  
A new component `src/components/GraphMetricsStrip.tsx` (lines 1‑134) has been added.  
It exports an interface `GraphMetricsStripProps` (lines 5‑15) and a function component `GraphMetricsStrip` (lines 17‑134) that renders a toggleable metrics strip.

### Key changes  
- **Imports** – `useState` from React, `DocWorkspaceMetrics` type, and `DocMermaidMount` component are added (lines 1‑3).  
- **Props** – `GraphMetricsStripProps` requires `metrics`, `pieDef`, `depthDef`, `importDef`, `callDef`, `metricsChartsLoading`, `outlineLoading`, `topExtensions`, and `topRoots`.  
- **State** – local `open` state controls the strip’s visibility.  
- **Rendering** –  
  - Two chart sections use `DocMermaidMount` with `pieDef` and `depthDef`.  
  - Two additional charts use `importDef` and `callDef` with loading flags.  
  - Two tables display the top 10 extensions and path roots.  
- **Footer** – shows the total paths from `metrics.byKind` (line 127).

### Impact  
- **UI** – introduces an interactive metrics panel that can be toggled by users.  
- **Dependencies** – requires the `DocMermaidMount` component and CSS classes such as `kg-metrics-strip`, `doc-workspace-chart`, etc.  
- **Performance** – rendering multiple `DocMermaidMount` instances may increase load time; loading flags are provided.  
- **Type safety** – the new interface ensures callers supply a `DocWorkspaceMetrics` object and string definitions.

### Risks & follow‑ups  
- Unknown from the available diff whether `DocMermaidMount` exists and accepts the used props.  
- Unknown if `metrics.byKind` contains numeric values; otherwise the footer may display `NaN`.  
- Unknown if the referenced CSS classes are defined, which could affect layout.  
- Unknown if the toggle behavior updates state correctly and unmounts cleanly.
