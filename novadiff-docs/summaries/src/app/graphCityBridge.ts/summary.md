### Overview
`graphCityBridge.ts` was refactored to centralize node‑id parsing and simplify several helper signatures. The new `parseSymbolNodeRest` (added at R16) extracts `filePath` and `symbolName` from a node‑id suffix, handling numeric suffixes and colon‑separated paths. `parseGraphNodeId` now delegates function and class parsing to this helper (R45‑50).  

### Key changes
- **`parseSymbolNodeRest`** – new helper (R16‑34).  
- **`parseGraphNodeId`** – updated to use `parseSymbolNodeRest` (R45‑50).  
- **`graphNodeToCityBuildingIds`** – signature changed to `(_rootSide?: CodeCityRootSide)` (R78‑82). Added logic (R95‑102) to infer missing `symbolName`/`kind` from the graph node.  
- **`filePathForLinkedSelection`** – removed `rootSide` parameter (R229‑233) and simplified to use the parsed node ID or graph node file path.  
- **`cityBuildingIdsForHighlight`** – added optional `cityBuildingId` (R287‑358). Logic now prefers this ID when supplied and updates the highlight set accordingly.  
- **`cityBuildingToGraphNodeId`** – uses a candidate list of possible IDs (R139‑148) to improve robustness.  
- **`buildBuildingIdByGraphNode`** – `rootSide` made optional (R165).  
- **`graphNodeIdsForCityLayout`** – new export (R264‑285) that collects all graph node IDs corresponding to visible Code City buildings, including parent file nodes for non‑file buildings.

### Impact
- **Correctness** – Centralized parsing reduces duplicate logic; missing symbol names are now inferred from the graph node.  
- **Maintainability** – Optional parameters reduce coupling to `rootSide`.  
- **Compatibility** – Call sites must be updated to match the new optional arguments.  
- **Performance** – Minor overhead from the candidate list lookup in `cityBuildingToGraphNodeId`; overall impact negligible.

### Risks & follow‑ups
- **API breakage** – Verify all imports of the affected functions; update call sites to use the new optional parameters.  
- **Parsing edge cases** – Ensure `parseSymbolNodeRest` correctly handles paths containing colons or numeric suffixes; run unit tests covering such cases.  
- **Highlight logic** – Confirm that the new `cityBuildingIdsForHighlight` still produces the expected primary/secondary highlights in focus mode.  
- **Graph node ID collection** – Validate that `graphNodeIdsForCityLayout` does not miss or duplicate IDs, especially for non‑file buildings.
