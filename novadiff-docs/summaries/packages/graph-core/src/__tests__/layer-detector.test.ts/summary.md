### Overview  
A new test file `packages/graph-core/src/__tests__/layer-detector.test.ts` (added lines R1‑188) validates the layer‑detection logic in the graph core module.

### Key changes  
- Added imports from `vitest` and the layer‑detector API (`detectLayers`, `buildLayerDetectionPrompt`, `parseLayerDetectionResponse`, `applyLLMLayers`) plus type imports from `../types.js` (lines R1‑R8).  
- Introduced helper constructors `makeNode` and `makeGraph` to build minimal `KnowledgeGraph` objects for tests.  
- Test cases cover:  
  - `detectLayers` identifies **API**, **Data**, and **Core** layers based on file paths (e.g., `src/routes/`, `src/models/`).  
  - Layer IDs start with `layer:` and are unique (lines 86‑92).  
  - Only nodes of type `file` are included; function and class nodes are ignored (lines 95‑106).  
  - `buildLayerDetectionPrompt` includes file paths and references JSON (lines 110‑118).  
  - `parseLayerDetectionResponse` handles plain JSON, markdown‑wrapped JSON, and returns `null` for invalid input (lines 122‑160).  
  - `applyLLMLayers` assigns nodes to LLM‑provided layers and places unmatched nodes in an **Other** layer (lines 163‑187).

### Impact  
- Adds ~188 lines of test code, providing concrete coverage for typical project structures.  
- Centralizes test helpers for reuse in future tests.  
- No snapshots are used; all assertions are direct.

### Risks & follow‑ups  
- If layer‑detection logic or regex patterns change, tests may fail; review failures and adjust expectations.  
- The ID uniqueness test depends on the `layer:` prefix; any change to ID generation must be reflected.  
- Tests are lightweight but should be monitored if graph size grows; consider parameterizing with larger graphs if needed.
