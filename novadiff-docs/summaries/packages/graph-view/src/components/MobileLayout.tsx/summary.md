### Overview  
A new `MobileLayout` component is added at `packages/graph-view/src/components/MobileLayout.tsx`. It replaces the desktop layout on mobile, providing a full‑screen UI with graph, info, and file tabs, plus code viewer, keyboard help, and path‑finder modals.

### Key changes  
- **Imports** (lines 1‑6): React hooks, `GraphIssue` type, `useDashboardStore`, `useI18n`, and static imports for `GraphView`, `DomainGraphView`, `KnowledgeGraphView`, `SearchBar`, `NodeInfo`, `ProjectOverview`, `FileExplorer`, `WarningBanner`, `MobileBottomNav`, `MobileDrawer`. Lazy imports for `CodeViewer`, `LearnPanel`, `PathFinderModal`, `KeyboardShortcutsHelp`.  
- **Props interface** (`interface Props`, lines 22‑28): `accessToken`, `showKeyboardHelp`, `setShowKeyboardHelp`, `loadError`, `allIssues`, `shortcuts`.  
- **State & effects** (lines 51‑64): `activeTab`, `drawerOpen`, `searchOpen`; `useEffect` hooks auto‑pivot to the info tab on node selection and close the search bar when the code viewer opens.  
- **Conditional rendering** (lines 150‑170): Tab panes are `absolute inset-0` containers toggled with `invisible pointer-events-none`; `aria-hidden` is set on inactive panes (lines 153, 168, 177). View mode selects `KnowledgeGraphView`, `DomainGraphView`, or `GraphView` (lines 155‑161).  
- **Modals & drawers** (lines 195‑213, 216‑223, 226‑230): `MobileDrawer`, `MobileBottomNav`, `CodeViewer`, `KeyboardShortcutsHelp`, and `PathFinderModal` are wrapped in `Suspense` with a `null` fallback.

### Impact  
- **Store usage**: Relies on `useDashboardStore` selectors (`graph`, `selectedNodeId`, `tourActive`, `persona`, `viewMode`, `domainGraph`, `codeViewerOpen`, `closeCodeViewer`, `pathFinderOpen`, `togglePathFinder`). Missing selectors will crash the component.  
- **Prop contract**: Callers must provide the new props; omission causes TypeScript errors or runtime failures.  
- **Testing**: Existing desktop‑layout tests need adaptation; new tests should cover tab switching, modal visibility, and state persistence.

### Risks & follow‑ups  
- **Missing props**: Verify all callers pass `accessToken`, `showKeyboardHelp`, etc.  
- **Store selector changes**: Ensure `useDashboardStore` still exposes the required fields.  
- **Lazy load failures**: Consider adding error boundaries or fallback UI for the lazy components.  
- **Accessibility**: Confirm that `aria-hidden` logic correctly hides inactive panes for screen readers.
