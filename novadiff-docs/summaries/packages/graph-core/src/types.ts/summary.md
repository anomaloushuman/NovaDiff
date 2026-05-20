### Overview  
A new file `packages/graph-core/src/types.ts` (204 added lines) introduces a comprehensive type system for the NovaDiff knowledge graph, defining nodes, edges, layers, projects, and plugin interfaces.

### Key changes  
- **Node taxonomy** – `export type NodeType` (lines 2‑7) lists 21 node kinds (code, non‑code, domain, knowledge).  
- **Edge taxonomy** – `export type EdgeType` (lines 10‑19) lists 35 edge kinds across 8 categories.  
- **Metadata interfaces** – `KnowledgeMeta` (lines 22‑27) and `DomainMeta` (lines 30‑35) add optional fields for knowledge and domain nodes.  
- **Core graph shapes** – `GraphNode` (lines 39‑53) now includes `layerId`, `domainMeta`, `knowledgeMeta`; `GraphEdge` (lines 56‑63) adds `direction` and `weight`.  
- **Project & analysis** – `ProjectMeta` (lines 83‑90), `KnowledgeGraph` (lines 93‑101), `AnalysisMeta` (lines 110‑116), `ProjectConfig` (lines 118‑122) formalize persistence and configuration.  
- **Plugin contracts** – `StructuralAnalysis` (lines 171‑183) now includes optional structural data (sections, definitions, services, etc.); `AnalyzerPlugin` (lines 197‑204) exposes `analyzeFile` and optional `resolveImports`, `extractCallGraph`, `extractReferences`.

### Impact  
- Modules must import types from the new file; missing imports will cause compile errors.  
- Plugins implementing `AnalyzerPlugin` must satisfy the expanded interface; optional methods may be omitted.  
- The file adds ~200 lines of type definitions; runtime impact is negligible, but TypeScript compilation time increases modestly.

### Risks & follow‑ups  
- Verify that no other module defines `NodeType` or `EdgeType` to avoid name collisions.  
- Update documentation (README, type docs) to reflect the new taxonomy.  
- Add unit tests covering all `NodeType` and `EdgeType` values to guard against regressions.
