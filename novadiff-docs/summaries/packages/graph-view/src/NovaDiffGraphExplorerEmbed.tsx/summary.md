### Overview  
A new file `packages/graph-view/src/NovaDiffGraphExplorerEmbed.tsx` introduces an **embed‑only graph explorer** component that loads a `KnowledgeGraph` into the dashboard store, validates it, and renders an `EmbedDashboardPanel` without the full dashboard chrome.

### Key changes  
- **Imports**: Adds React hooks, `validateGraph` from `@novadiff/graph-core/schema`, `KnowledgeGraph` type, `useDashboardStore`, context utilities, and `I18nProvider`.  
- **API surface**: Exports `NovaDiffGraphExplorerEmbedProps` and the `NovaDiffGraphExplorerEmbed` function.  
- **Graph fingerprinting**: Implements `graphFingerprint` (lines 23‑32) to avoid re‑loading identical graphs.  
- **Store interaction**: On mount, validates the graph, sets it in the store, configures view mode (`knowledge` vs `structural`), and enters embed depth. On unmount, cleans up tour, overlays, layout issues, and resets embed depth.  
- **Rendering logic**: Shows a validation error, a skeleton while the store loads the graph, or the `EmbedDashboardPanel` wrapped in `NovaDiffEmbedContext.Provider` and `I18nProvider`.  

### Impact  
- **Correctness**: Validates incoming graphs before use, preventing malformed data from propagating.  
- **Maintainability**: Centralizes embed‑specific store actions; future changes to embed behavior can be made in this file.  
- **Performance**: Fingerprinting reduces unnecessary store updates when the same graph is re‑passed.  
- **Observability**: Provides clear error messages (`novadiff-graph-load-error`) and a skeleton UI during loading.  

### Risks & follow‑ups  
- **Store API compatibility**: Ensure `useDashboardStore` exposes `stopTour`, `resetEmbedOverlays`, `clearLayoutIssues`, `setGraph`, `setViewMode`, `setIsKnowledgeGraph`, and `enterNovaDiffEmbedDepth`.  
- **Validation side‑effects**: Verify that `validateGraph` does not mutate the graph and that its `issues` are correctly passed to `EmbedDashboardPanel`.  
- **Cleanup correctness**: Confirm that the unmount effect restores the store to a clean state, especially `enterNovaDiffEmbedDepth` which may alter navigation depth.  
- **Internationalization**: Test that `I18nProvider` correctly applies `outputLanguage` and that the component renders in non‑English locales.
