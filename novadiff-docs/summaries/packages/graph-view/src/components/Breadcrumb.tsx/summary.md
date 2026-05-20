### Overview  
A new `Breadcrumb` component was added to **packages/graph-view/src/components/Breadcrumb.tsx** (lines R1‑R44). It renders a breadcrumb bar in the top‑left corner of the graph view, showing the current navigation level and allowing quick navigation back to the overview or to a deeper embed depth.

### Key changes  
- **Imports** (R1‑R3)  
  ```ts
  import { useDashboardStore } from "../store";
  import { useI18n } from "../contexts/I18nContext";
  import { PROJECT_WIDE_LAYER_ID, resolveActiveLayer } from "../utils/activeLayer";
  ```
- **State hooks** (R6‑R11)  
  ```ts
  const navigationLevel = useDashboardStore((s) => s.navigationLevel);
  const activeLayerId = useDashboardStore((s) => s.activeLayerId);
  const graph = useDashboardStore((s) => s.graph);
  const navigateToOverview = useDashboardStore((s) => s.navigateToOverview);
  const enterNovaDiffEmbedDepth = useDashboardStore((s) => s.enterNovaDiffEmbedDepth);
  const { t } = useI18n();
  ```
- **Active‑layer logic** (R13‑R15)  
  ```ts
  const activeLayer = graph && activeLayerId ? resolveActiveLayer(graph, activeLayerId) : null;
  const isProjectWide = activeLayerId === PROJECT_WIDE_LAYER_ID;
  ```
- **Conditional rendering** (R17‑R41)  
  - `navigationLevel === "overview"` shows a badge with `t.breadcrumb.projectOverview`.  
  - `navigationLevel === "layer-detail"` shows a button that toggles between overview and embed depth, displays the active layer name (or `t.layer.defaultName`), and a back‑arrow hint (`t.breadcrumb.escBack`).  
- **Export** (R5) – `export default function Breadcrumb() { … }`.

### Impact  
- **UI**: Adds a breadcrumb bar that appears in the top‑left corner, improving navigation visibility.  
- **Store subscriptions**: The component subscribes to several slices of `useDashboardStore`; frequent changes may trigger re‑renders.  
- **Internationalization**: Requires the `t.breadcrumb.*` keys and `t.layer.defaultName` to exist; missing keys will render `undefined`.  
- **Styling**: Uses Tailwind classes; global style changes may affect appearance.  
- **Testing**: No tests are present in the diff; integration tests should cover visibility and click behavior.

### Risks & follow‑ups  
- **Missing i18n keys** – verify that all `t.breadcrumb.*` and `t.layer.defaultName` keys exist in locale files.  
- **Store shape** – ensure `useDashboardStore` exposes `navigationLevel`, `activeLayerId`, `graph`, `navigateToOverview`, and `enterNovaDiffEmbedDepth`; otherwise the component will crash.  
- **Active‑layer resolution** – confirm that `resolveActiveLayer` correctly handles `null` or `undefined` `graph`/`activeLayerId` cases.  
- **Performance** – monitor re‑render frequency when the dashboard state changes; consider memoizing derived values if needed.
