### Overview
`packages/graph-view/src/App.tsx` is a new root component that orchestrates token handling, demo mode, data fetching, and the dashboard UI. It imports React hooks, validation utilities, and the dashboard store, and lazy‑loads heavy components.

### Key changes
- **Imports** (R1‑R6): added React hooks, `validateGraph` and `GraphIssue` from `@novadiff/graph-core/schema`, `useDashboardStore`, and core view components (`GraphView`, `DomainGraphView`, etc.).  
- **Lazy loading** (R28‑R34): `CodeViewer`, `LearnPanel`, `PathFinderModal`, and `KeyboardShortcutsHelp` are loaded with `React.lazy`.  
- **Demo mode** (R36): `DEMO_MODE` flag controls URL resolution.  
- **URL resolution** (R41‑R55): `dataUrl` returns env‑var URLs in demo mode or token‑appended paths otherwise.  
- **Token logic** (R61‑R76): `resolveInitialToken` reads `token` from the query string or `sessionStorage`, clears the param, and persists the token.  
- **App component** (R78‑R97): shows `TokenGate` until a token is available; in demo mode it bypasses the gate.  
- **Dashboard** (R99‑R210): fetches `meta.json`, `config.json`, `knowledge-graph.json`, `diff-overlay.json`, and `domain-graph.json`; validates graphs with `validateGraph`; updates store view mode and error state.  
- **DashboardContent** (R211‑R709): consumes store state, registers keyboard shortcuts via `useKeyboardShortcuts` (disabled in embed mode), renders header, sidebar, and graph views, and conditionally shows overlays.  
- **Export** (R709): `export default App;`.

### Impact
- Centralized data fetching simplifies future updates but ties the component to `@novadiff/graph-core`.  
- Multiple fetches on mount may increase network traffic; lazy loading reduces initial bundle size.  
- Error handling surfaces load and validation issues through banners.

### Risks & follow‑ups
- `DEMO_MODE` must be correctly set in CI; otherwise URLs resolve incorrectly.  
- `resolveInitialToken` clears the URL query param; verify it does not leave stale tokens.  
- Lazy‑loaded chunks (`CodeViewer`, `LearnPanel`, etc.) must be present in production builds; missing files could break the UI.
