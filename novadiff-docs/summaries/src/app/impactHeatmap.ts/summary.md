### Overview  
`src/app/impactHeatmap.ts` adds a heat‑map generator for district impact data.  
* Imports `RiskSignal` from `./types` (line 1).  
* Declares `DistrictImpactScore` (lines 3‑10) with `district`, `score`, `changedPaths`, `riskCount`, and `highSeverity`.  
* Provides `buildDistrictImpactHeatmap` (lines 17‑67) to aggregate scores from changed paths, risk signals, and affected node IDs.  
* Exposes `heatmapMermaid` (lines 68‑79) and `heatmapHtmlTable` (lines 80‑93) for visual output.  
* Includes `escapeHtml` (lines 94‑100) for safe HTML rendering.

### Key changes  
* **Interface** – `DistrictImpactScore` now tracks `highSeverity` and `riskCount` (lines 3‑10).  
* **Scoring logic** –  
  * Each changed path adds 2 points and increments `changedPaths` (line 40).  
  * Risk signals are weighted: high = 8, medium = 4, low = 2; they increment `riskCount` and `highSeverity` (lines 46‑50).  
  * Affected node IDs add 1 point per node (lines 55‑61).  
  * Results are sorted by descending `score` (line 65).  
* **Visualization** –  
  * `heatmapMermaid` builds a Mermaid flowchart, limiting to `maxRows` districts (lines 68‑79).  
  * `heatmapHtmlTable` renders an HTML table with a proportional impact bar (lines 80‑93).  
* **Safety** – `escapeHtml` sanitizes district names for HTML output (lines 94‑100).

### Impact  
* **Granularity** – Explicit risk‑severity weighting (lines 46‑50) provides finer impact distinctions.  
* **Centralization** – Aggregation logic resides in a single function (`buildDistrictImpactHeatmap`), reducing duplication.  
* **Observability** – Mermaid and HTML outputs enable quick visual checks in dashboards or docs.  
* **Performance** – Operations are linear or n log n over the number of districts, suitable for typical data sizes.

### Risks & follow‑ups  
* `highSeverity` is recorded but not displayed; confirm if downstream consumers need this field.  
* Node‑ID parsing assumes `file:` prefixes or colon‑separated paths (lines 55‑58); test against all node‑ID formats.  
* Existing components that consume district impact data must import the new interface and functions.  
* Add unit tests for edge cases (e.g., no changed paths, all high‑severity risks) to guard against regressions.
