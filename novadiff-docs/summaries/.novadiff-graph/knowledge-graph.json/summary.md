### Overview  
The file `.novadiff-graph/knowledge-graph.json` was deleted entirely (lines L1‑8000). All graph data—including metadata, node entries for files, functions, classes, and symbol spans—was removed. Consequently, any references to Electron modules, language‑lesson logic, extractor implementations, and persistence utilities that were stored in this file are no longer present.

### Key changes  
- The entire knowledge‑graph file was removed.  
- All nodes stored in the graph (functions, files, classes, symbol spans) were deleted.  
- Electron‑specific data, language configuration, extractor logic, and persistence references that resided in the graph were eliminated.

### Impact  
- Functionality that depends on the knowledge graph (e.g., visualizations, symbol lookup, diff overlays) will be affected.  
- Analysis tools that query the graph for summaries, complexity metrics, or change tracking will lose their data source.  
- Tests that rely on the graph may fail or be skipped.  
- Scripts that generate or consume the graph may error.

### Risks & follow‑ups  
- Users cannot view or interact with the knowledge graph until it is regenerated.  
- All historical graph snapshots and metadata are permanently removed.  
- Re‑generation of the graph is required (e.g., `nova diff --generate-graph`).  
- Code that imports or references the removed graph file should be cleaned or guarded.  
- After regeneration, re‑run relevant tests (e.g., `npm test --packages/graph-core`) to confirm functionality.
