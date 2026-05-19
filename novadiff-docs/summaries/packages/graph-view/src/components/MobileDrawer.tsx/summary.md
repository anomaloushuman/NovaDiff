### Overview  
A new `MobileDrawer` component is added at `packages/graph-view/src/components/MobileDrawer.tsx`. It renders a slide‑out panel for mobile views, exposing persona selection, view toggles, diff overlay, node‑type filters, layer legend, and tool actions.

### Key changes  
- **Imports** (lines 1‑6): `useEffect`, `useDashboardStore`, `useI18n`, `PersonaSelector`, `DiffToggle`, `LayerLegend`.  
- **Interfaces** (lines 11‑17, 18‑22): `Props` (`open`, `onClose`, `onTogglePathFinder`, `onShowKeyboardHelp`) and `NodeTypeFilterDef` (`key`, `label`, `color`).  
- **SectionLabel** (lines 26‑32): helper rendering a styled `<h3>`.  
- **MobileDrawer** (lines 34‑266): default export.  
  - Pulls graph state via `useDashboardStore`.  
  - Builds `structuralFilters` and `knowledgeFilters` from i18n labels.  
  - Two `useEffect` hooks: one for Escape key handling (lines 63‑70) and one to lock body scroll while open (lines 72‑80).  
  - Conditional view toggle when `graph` exists, not a knowledge graph, and `domainGraph` is present (lines 82‑84).  
  - Renders sections for persona, view, diff overlay, node types, layers, and tools, wiring actions to callbacks and store mutations.

### Impact  
- **Correctness**: relies on existing store hooks and i18n; integration tests should verify state changes.  
- **Maintainability**: component is self‑contained; helper `SectionLabel` keeps the file readable.  
- **Performance**: only two lightweight `useEffect` hooks and conditional rendering.  
- **Compatibility**: no breaking changes to existing APIs; the component is exported as default, so imports elsewhere must be updated.

### Risks & follow‑ups  
- Verify that `useDashboardStore` selectors (`graph`, `isKnowledgeGraph`, etc.) return expected values on first render; stale data could hide the drawer.  
- Ensure the Escape key listener is removed correctly when the drawer closes to avoid memory leaks.  
- Confirm that all i18n keys (`t.drawer.*`) exist; missing keys will render `undefined`.  
- Run visual regression tests to catch CSS class mismatches (`pointer-events-auto`, `translate-x-0`, etc.) that could affect the slide animation.
