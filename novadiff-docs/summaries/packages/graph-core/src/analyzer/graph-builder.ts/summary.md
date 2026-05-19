### Overview
`packages/graph-core/src/analyzer/graph-builder.ts` adds a `GraphBuilder` class that builds a `KnowledgeGraph` from source and non‑code artifacts.  
The file introduces several interfaces (`FileMeta`, `FileAnalysisMeta`, `NonCodeFileMeta`, `NonCodeFileAnalysisMeta`) and a mapping from definition kinds to node types (`KIND_TO_NODE_TYPE`).

### Key changes
- **Imports** (lines 1‑13):  
  ```ts
  import type { KnowledgeGraph, GraphNode, GraphEdge, StructuralAnalysis, DefinitionInfo, ServiceInfo, EndpointInfo, StepInfo, ResourceInfo, SectionInfo } from "../types.js";
  import { LanguageRegistry } from "../languages/language-registry.js";
  ```
- **Interfaces** (lines 15‑36) define metadata for files and non‑code artifacts.
- **Kind mapping** (lines 39‑58) maps definition kinds to node types.
- **GraphBuilder** (lines 60‑337)  
  * Holds `nodes`, `edges`, `languages`, `nodeIds`, `edgeKeys`.  
  * Constructor accepts `projectName`, `gitHash`, optional `LanguageRegistry`.  
  * `addFile` and `addFileWithAnalysis` create file, function, and class nodes with “contains” edges.  
  * `addImportEdge` and `addCallEdge` add dependency edges, deduplicated via `edgeKeys`.  
  * `addNonCodeFile` and `addNonCodeFileWithAnalysis` create child nodes for definitions, services, endpoints, steps, and resources, using `addChildNode`.  
  * `addChildNode` warns on duplicate node IDs (lines 302‑310).  
  * `mapKindToNodeType` warns on unknown kinds (lines 312‑318).  
  * `build` returns a `KnowledgeGraph` object (lines 320‑336).

### Impact
The class centralises graph construction, decoupling analysis from persistence.  
Runtime checks for duplicate node IDs and unknown definition kinds improve robustness.  
All nodes and edges are stored in arrays, which is suitable for current graph sizes but may need review for very large projects.

### Risks & follow‑ups
- No unit tests cover `GraphBuilder`; run existing graph tests to confirm no regressions.  
- Edge deduplication relies on `edgeKeys`; verify that duplicate edges are ignored.  
- `KIND_TO_NODE_TYPE` may miss new definition kinds; monitor for warnings during analysis.  
- The file is added but not referenced by build scripts—unknown from the available diff/scan evidence.
