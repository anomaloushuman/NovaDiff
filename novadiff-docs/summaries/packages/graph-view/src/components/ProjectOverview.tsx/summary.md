### Overview  
A new `ProjectOverview` component is added at `packages/graph-view/src/components/ProjectOverview.tsx`.  
It pulls the current graph from the global store, uses the i18n context for all labels, and renders a dashboard of project statistics.

### Key changes  
- **Imports** – `useDashboardStore` (line 1) and `useI18n` (line 2) are added.  
- **Export** – `export default function ProjectOverview()` (line 4) introduces the component.  
- **State hooks** – `const graph = useDashboardStore((s) => s.graph)` and `const startTour = useDashboardStore((s) => s.startTour)` (lines 5‑6) fetch the graph data and tour handler.  
- **i18n hook** – `const { t } = useI18n()` (line 7) supplies translated strings.  
- **Loading state** – If `!graph`, a placeholder is shown (lines 9‑15).  
- **Calculations** – The component iterates over `nodes` and `edges` once to compute counts, type and complexity breakdowns, top connected nodes, and average connections (lines 17‑220).  
- **UI** – Tailwind‑styled divs, grids, and progress bars display the data; optional sections (languages, frameworks, tour button) are rendered only when data is present.

### Impact  
- **Correctness** – The component renders only when `graph` is defined; otherwise a loading state is shown.  
- **Maintainability** – All dashboard logic resides in a single file, simplifying future updates.  
- **Performance** – The component performs a linear pass over nodes and edges; no memoization is used, which may affect rendering for very large graphs.

### Risks & follow‑ups  
- **Missing store data** – Verify that `graph` is populated before rendering; otherwise the component falls back to the loading placeholder.  
- **Translation coverage** – Ensure all `t.projectOverview.*` keys exist in the i18n bundles; missing keys will result in undefined labels.  
- **Large graph rendering** – Test with graphs > 10k nodes to confirm UI responsiveness; consider memoization if needed.  
- **Tour integration** – Confirm that `startTour` correctly initiates the guided tour; otherwise the button will be non‑functional.
