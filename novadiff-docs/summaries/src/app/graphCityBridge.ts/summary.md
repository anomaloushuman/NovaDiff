### Overview  
`src/app/graphCityBridge.ts` adds utilities that translate between the knowledge‑graph model and the CodeCity layout. It parses graph node IDs, maps them to city building IDs, and generates edge overlays and highlight sets for linked selections.

### Key changes  
- **Imports** – pulls `GraphEdge`, `KnowledgeGraph` from `@novadiff/graph-core/types` and local layout types (`CodeCityLayoutResult`, `CodeCityRenderableBuilding`, `CodeCityRootSide`) (lines 1‑6).  
- **`CityEdgeOverlay` interface** – defines overlay payload (lines 10‑14).  
- **Node‑to‑building mapping** – `graphNodeToCityBuildingIds` parses node IDs, matches buildings by kind and symbol, and falls back to file‑level matches (lines 74‑114).  
- **Reverse mapping** – `cityBuildingToGraphNodeId` resolves a building back to the best graph node ID, handling file, function, and class kinds (lines 117‑146).  
- **Batch mapping** – `buildBuildingIdByGraphNode` pre‑computes a map of node IDs to building ID arrays (lines 148‑164).  
- **Edge overlay generation** – `graphEdgesToCityPairs` filters link‑relevant edges, caps results, and deduplicates by source/target pair (lines 167‑205).  
- **Neighbor discovery** – `graphNeighborNodeIds` returns one‑hop neighbors via link edges (lines 208‑226).  
- **Highlight logic** – `cityBuildingIdsForHighlight` combines node mapping, file‑path resolution, and focus‑mode neighbor expansion to produce a primary building and a set of highlight IDs (lines 250‑307).

### Impact  
- **Correctness** – new mapping logic aligns graph nodes with city buildings, reducing visual mismatches.  
- **Maintainability** – centralizes graph‑city translation; future changes to node ID formats or building kinds can be localized.  
- **Performance** – pre‑computing `buildBuildingIdByGraphNode` and caching neighbor sets keeps per‑render overhead low.  
- **Compatibility** – no API changes to existing modules; the new file is purely additive.

### Risks & follow‑ups  
- **Edge‑case mapping** – verify that `parseGraphNodeId` handles malformed IDs; unit tests should cover all prefixes.  
- **Duplicate overlays** – ensure `graphEdgesToCityPairs`’ deduplication logic (`seen` set) behaves as intended when multiple edges share the same source/target pair.  
- **Focus mode expansion** – confirm that neighbor traversal does not introduce cycles or excessive highlight sets in dense graphs.  
- **Type safety** – the new imports rely on `@novadiff/graph-core/types`; ensure those types are exported correctly and that future version changes do not break the bridge.
