### Overview  
The `depthBarMermaid` helper was refactored to replace the old flowchart bar graph with an XY chart. The change trims the displayed depth slice from 14 to 12 entries and updates the empty‑state message.

### Key changes  
- **Slice size** – `metrics.depthHistogram.slice(0, 12)` (line 189) replaces the previous `slice(0, 14)`.  
- **Empty‑state text** – `"No path depth data"` (line 191) replaces `"No data"`.  
- **Graph type** – the function now returns an `xychart-beta` block (lines 197‑203) instead of a `flowchart TB` with bar nodes (lines 193‑197).  
- **Label construction** – depth labels are generated via `labels = rows.map(d => \`d${d.depth}\`)` and `values = rows.map(d => d.count)` (lines 193‑196).  
- **Y‑axis scaling** – `yMax` is computed as `Math.max(maxVal, Math.ceil(maxVal * 1.15))` (line 201) to give a 15 % headroom.

### Impact  
- **Visual output**: Consumers of the Mermaid string will now see an XY chart instead of a bar graph, changing the appearance of depth histograms.  
- **Performance**: Limiting to 12 rows reduces the amount of data rendered, slightly improving rendering speed.  
- **Maintainability**: The new implementation is more declarative and removes manual node‑generation logic, easing future tweaks.

### Risks & follow‑ups  
- **Rendering failures**: Verify that the target environment’s Mermaid version supports `xychart-beta`; older renderers may not support it, potentially breaking dashboards.  
- **Test regressions**: Existing unit tests that assert the exact Mermaid string will fail; update expectations or add conditional checks.  
- **Documentation**: UI or docs may need to explain the new chart type and its interpretation.  
- **Edge cases**: Ensure that when `metrics.depthHistogram` has fewer than 12 entries, the chart still renders correctly and the Y‑axis scaling behaves as intended.
