### Overview  
A new file `packages/graph-core/src/analyzer/graph-builder.ts` (lines 1‑337) introduces a `GraphBuilder` class that assembles a knowledge graph from source files, structural analysis, and non‑code artifacts. The file also defines metadata interfaces and a kind‑to‑node‑type map.

### Key changes  
- **Imports** (lines 1‑13):  
  ```ts
  import type { KnowledgeGraph, GraphNode, GraphEdge, StructuralAnalysis,
    DefinitionInfo, ServiceInfo, EndpointInfo, StepInfo, ResourceInfo, SectionInfo } from "../types.js";
  import { LanguageRegistry } from "../languages/language-registry.js";
  ```
- **Metadata interfaces** (lines 15‑37): `FileMeta`, `FileAnalysisMeta`, `NonCodeFileMeta`, `NonCodeFileAnalysisMeta`.  
- **Kind mapping** (lines 39‑58): `KIND_TO_NODE_TYPE` maps definition kinds (e.g., `"table"`, `"service"`) to graph node types.  
- **GraphBuilder class** (lines 60‑337):  
  - Holds `nodes`, `edges`, `languages`, `nodeIds`, `edgeKeys`.  
  - Constructor accepts `projectName`, `gitHash`, optional `LanguageRegistry`.  
  - `detectLanguage` uses the registry.  
  - File addition: `addFile`, `addFileWithAnalysis` create file nodes and, for the latter, function and class nodes with `"contains"` edges.  
  - Edge addition: `addImportEdge` (weight 0.7) and `addCallEdge` (weight 0.8).  
  - Non‑code handling: `addNonCodeFile`, `addNonCodeFileWithAnalysis` create nodes for definitions, services, endpoints, steps, resources, and link them via `addChildNode`.  
  - `addChildNode` warns on duplicate IDs.  
  - `mapKindToNodeType` warns on unknown kinds and falls back to `"concept"`.  
  - `build` returns a `KnowledgeGraph` with sorted languages and current timestamps.

### Impact  
- Centralizes graph construction logic, reducing duplication across analyzers.  
- Provides explicit metadata contracts via interfaces.  
- Uses `Set` structures for duplicate detection, improving correctness.  
- No existing public APIs are altered; the new file is isolated.

### Risks & follow‑ups  
- **Language detection**: `detectLanguage` depends on `LanguageRegistry`; verify that all project extensions are registered.  
- **Duplicate node handling**: `addChildNode` silently skips duplicates after a warning; confirm downstream consumers tolerate missing nodes.  
- **Kind mapping coverage**: `KIND_TO_NODE_TYPE` may miss future kinds; add tests for unknown kinds to ensure fallback to `"concept"`.  
- **Edge weight semantics**: Current weights (0.7 for imports, 0.8 for calls) are arbitrary; confirm they align with downstream traversal logic.
