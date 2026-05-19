### Overview  
A new component `NodeInfo` is added to `packages/graph-view/src/components/NodeInfo.tsx` (lines 259‑538). It displays detailed information for a selected node, including domain‑specific, knowledge‑specific, and child relationships, and renders navigation history and badges.

### Key changes  
- **Imports** (lines 1‑4): `useState`, `useDashboardStore`, `useI18n`, and type imports from `@novadiff/graph-core/types`.  
- **Badge mappings** (lines 6‑29, 31‑35): `typeBadgeColors` and `complexityBadgeColors` map `NodeType` and complexity values to Tailwind classes, with fallbacks to the “file” badge.  
- **Helper functions** (lines 37‑45, 46‑137, 138‑257):  
  - `getDirectionalLabel` (lines 37‑45) localizes edge labels, falling back to a formatted string if `t.edgeLabels[edgeType]` is missing.  
  - `KnowledgeNodeDetails` (lines 46‑137) renders wikilinks, backlinks, and content previews for article/entity/topic/claim/source nodes.  
  - `DomainNodeDetails` (lines 138‑257) handles domain, flow, and step nodes, showing entities, rules, interactions, and flow steps.  
- **Main component** (lines 259‑538): uses `useState` for language expansion, pulls graph data via `useDashboardStore`, and renders navigation history, node badges, file info, tags, child nodes, and other connections.  
- **Export** (line 259): `export default function NodeInfo()`.

### Impact  
- Provides a comprehensive node‑detail panel, improving navigation and insight into graph structure.  
- Centralizes node‑specific rendering logic, reducing duplication.  
- Multiple `useDashboardStore` hooks may trigger re‑renders; selectors should be memoized.  
- Requires the store to expose actions such as `navigateToDomain`, `selectNode`, `navigateToNode`, `goBackNode`, `setFocusNode`, and `openCodeViewer`.

### Risks & follow‑ups  
- **Unknown node types**: line 315‑317 warns if a node type is not in `typeBadgeColors`; ensure all `NodeType` values are covered.  
- **Edge labeling**: line 40‑42 falls back to a formatted string if `t.edgeLabels[edgeType]` is missing; verify translation files contain all edge types.  
- **Store API changes**: the component relies on several store actions; any refactor of `useDashboardStore` could break navigation or focus logic.
