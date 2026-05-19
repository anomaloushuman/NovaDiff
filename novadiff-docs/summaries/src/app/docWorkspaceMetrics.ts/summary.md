### Overview  
`depthBarMermaid` in **src/app/docWorkspaceMetrics.ts** was refactored to replace the old bar‑graph logic with an XY‑style chart. The function now limits the depth slice to 12 levels and updates the empty‑data message.

### Key changes  
- **Slice size** – `metrics.depthHistogram.slice(0, 12)` (line 189) replaces the previous `slice(0, 14)`.  
- **Empty case** – returns `"flowchart LR\n  empty[No path depth data]"` (line 191).  
- **Chart type** – the former `parts` array and `flowchart TB` block (lines 193‑197) were removed.  
- **Label/value extraction** – `labels = rows.map(d => \`d\${d.depth}\`)` and `values = rows.map(d => d.count)` (lines 193‑196).  
- **Dynamic y‑axis** – `yMax` is computed as `Math.max(maxVal, Math.ceil(maxVal * 1.15))` (lines 196‑201).  
- **Return** – an array of strings joined with `\n` that defines an `xychart-beta` block (lines 197‑203).

### Impact  
- **Visual output** – consumers will see an XY chart instead of a bar graph; rendering must support `xychart-beta`.  
- **Data coverage** – only the first 12 depth levels are shown, which may hide deeper information but keeps the chart readable.  
- **Performance** – the new logic is linear in the sliced array, similar to the old implementation.  
- **Maintainability** – the code is now a single, explicit path with clear label/value extraction.

### Risks & follow‑ups  
- **Chart compatibility** – unknown from the diff; verify that the target Mermaid renderer supports `xychart-beta`.  
- **Regression tests** – snapshots or visual tests that asserted the old bar‑graph output will need updating.  
- **Documentation** – update README or docs to note the new chart type and the reduced depth slice.  
- **Edge cases** – confirm that fewer than 12 histogram entries still produce a valid chart and that the empty‑data message triggers correctly.
