### Overview  
A new test suite `tests/graphCityBridge.test.ts` has been added to validate the mapping utilities in `graphCityBridge`. The file imports Vitest, `KnowledgeGraph`, and several helper functions (`cityBuildingIdsForHighlight`, `cityBuildingToGraphNodeId`, `graphEdgesToCityPairs`, `graphNodeToCityBuildingIds`) along with CodeCity layout types.

### Key changes  
- **Test file added**: `tests/graphCityBridge.test.ts` (≈121 lines).  
- **Imports**: `vitest` helpers, `KnowledgeGraph` type, and the four mapping functions from `../src/app/graphCityBridge`.  
- **Helper `building()`**: constructs `CodeCityRenderableBuilding` objects with default geometry and overrides.  
- **Sample layout & graph**: a minimal `CodeCityLayoutResult` with two buildings (function `foo` and class `Bar`) and a corresponding `KnowledgeGraph` containing nodes and a single `calls` edge.  
- **Four test cases**:  
  1. `graphNodeToCityBuildingIds` maps a function node to its city building ID.  
  2. `cityBuildingToGraphNodeId` reverses the mapping.  
  3. `cityBuildingIdsForHighlight` returns all building IDs for a file node.  
  4. `graphEdgesToCityPairs` produces overlay pairs for a selected node.

### Impact  
- **Correctness**: Provides concrete assertions for the mapping logic, reducing silent regressions.  
- **Maintainability**: Centralizes test data; future changes to node/building IDs must update this file.  
- **Observability**: Test failures will surface mapping mismatches immediately during CI.  
- **Compatibility**: No changes to production code; only test additions.

### Risks & follow-ups  
- **Regression risk**: If `graphCityBridge` functions change signatures or ID conventions, tests will fail; verify that the mapping logic remains stable.  
- **Snapshot drift**: No snapshots used, but any change to default geometry in `building()` may require test updates.  
- **Linting**: Ensure the new file passes the repo’s TS lint rules (`tsc`, `eslint`).  
- **Build impact**: Run `npm run build` to confirm the added test does not introduce build-time errors.
