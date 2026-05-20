### Overview  
`packages/graph-view/src/App.tsx` replaces the previous bootstrap.  
The file now imports React hooks (`useEffect`, `useState`, `useMemo`, `useCallback`, `lazy`, `Suspense`) and validation utilities (`validateGraph`, `GraphIssue`) – see lines 1‑6.  
A demo flag (`DEMO_MODE`) and session‑storage token logic are added in `dataUrl` (lines 41‑55) and `resolveInitialToken` (lines 61‑75).  
`App` (lines 78‑97) renders a `TokenGate` when no token is present, otherwise passes the token to `Dashboard`.  
`Dashboard` (lines 99‑210) fetches meta, config, knowledge, diff‑overlay, and domain graphs, validates them, and updates the global store via `useDashboardStore`.  
`DashboardContent` (lines 211‑735) orchestrates the UI: header, sidebar, graph view, code viewer, inspector, and modals, with mobile‑aware layout and keyboard shortcuts.  
Heavy components (`CodeViewer`, `LearnPanel`, `PathFinderModal`, `KeyboardShortcutsHelp`) are lazy‑loaded (lines 28‑34).  
The file ends with `export default App;` (line 735).

### Key changes  
- **Imports**: added React hooks and validation utilities (lines 1‑6).  
- **Token logic**: `dataUrl` and `resolveInitialToken` build URLs based on `DEMO_MODE` and session storage (lines 41‑75).  
- **App**: renders `TokenGate` or `Dashboard` depending on token presence (lines 78‑97).  
- **Dashboard**: fetches and validates data, updates store (lines 99‑210).  
- **DashboardContent**: full UI composition, keyboard shortcuts, mobile layout (lines 211‑735).  
- **Lazy loading**: heavy modules imported with `lazy` (lines 28‑34).  
- **Export**: `export default App;` (line 735).

### Impact  
- **Token handling**: centralizes token acquisition and persistence.  
- **Validation**: errors surface via `WarningBanner` (lines 626‑628).  
- **Performance**: lazy loading reduces initial bundle size.  
- **Demo mode**: bypasses token gate when `VITE_DEMO_MODE=true`.  
- **UI**: single file contains all layout logic, easing navigation.

### Risks & follow‑ups  
- **Token persistence**: verify `resolveInitialToken` clears the URL and stores the token (lines 61‑75).  
- **Lazy‑load failures**: ensure missing chunks (e.g., `CodeViewer`) are handled gracefully.  
- **Demo mode flag**: confirm `VITE_DEMO_MODE` is set correctly; otherwise the token gate may be skipped.  
- **Store updates**: check that `setGraph`, `setDomainGraph`, etc., are called only after successful validation (lines 123‑149, 180‑196).
