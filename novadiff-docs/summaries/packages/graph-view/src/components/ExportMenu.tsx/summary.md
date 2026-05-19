### Overview
A new `ExportMenu` component is added at `packages/graph-view/src/components/ExportMenu.tsx`.  
It renders a button that toggles a dropdown with options to export the current graph as PNG, SVG, or JSON.

### Key changes
- **Imports** (lines 1‑5):  
  - `useEffect`, `useRef` from React.  
  - `useDashboardStore` from `../store`.  
  - `useI18n` from `../contexts/I18nContext`.  
  - `KnowledgeGraph` type from `@novadiff/graph-core/types`.  
  - `filterNodes`, `filterEdges` from `../utils/filters`.
- **Utility functions** (lines 7‑20):  
  - `escapeXml` sanitizes node labels.  
  - `downloadBlob` triggers a file download.
- **Component state** (lines 22‑30): pulls `graph`, `nodeIdToLayerIds`, `filters`, `exportMenuOpen`, `toggleExportMenu`, `reactFlowInstance`, and `persona` from the dashboard store.
- **Outside‑click handling** (lines 35‑45): a `mousedown` listener closes the menu when clicking outside the container.
- **SVG generation** (lines 47‑102): `buildCleanSvg` computes bounds, draws edges and nodes, and returns SVG markup with dimensions.
- **Export actions** (lines 104‑216):  
  - `exportPNG` renders the SVG to a canvas, converts it to a PNG blob, and downloads it.  
  - `exportSVG` downloads the raw SVG blob.  
  - `exportJSON` filters the graph by persona and filters, serializes it to JSON, and downloads it.
- **UI** (lines 218‑279): a button toggles the menu; each menu item calls the corresponding export function.

### Impact
The component adds a user‑visible export feature to the graph view, enabling users to save visual or data representations of the graph.

### Risks & follow‑ups
- No tests or lint failures are reported in the diff; potential runtime errors (e.g., missing `reactFlowInstance`) are handled with alerts, but edge‑case coverage is unknown from the available evidence.  
- Future work could add unit tests for the export logic and verify that the generated files match expected schemas.
