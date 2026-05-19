### Overview  
A new file `packages/graph-core/src/types.ts` (lines 1‑204) introduces a comprehensive type system for graph modeling, analysis metadata, and plugin contracts.

### Key changes  
- **Node & Edge types** – `NodeType` (lines 1‑7) lists 21 node categories; `EdgeType` (lines 9‑19) lists 35 edge categories across structural, behavioral, data‑flow, and knowledge relations.  
- **Metadata interfaces** – `KnowledgeMeta` (lines 21‑27) and `DomainMeta` (lines 29‑35) add optional fields for knowledge‑ and domain‑specific nodes.  
- **Graph core interfaces** – `GraphNode` (lines 39‑53) and `GraphEdge` (lines 55‑63) model nodes and edges with attributes such as `layerId`, `complexity`, `direction`, and `weight`.  
- **Project & analysis metadata** – `ProjectMeta`, `KnowledgeGraph`, `ThemeConfig`, `AnalysisMeta`, and `ProjectConfig` (lines 82‑118) expose configuration and persistence structures.  
- **Structural analysis & plugin contracts** – `StructuralAnalysis` (lines 171‑183) defines analysis results; `AnalyzerPlugin` (lines 197‑204) specifies plugin APIs (`analyzeFile`, optional `resolveImports`, `extractCallGraph`, `extractReferences`).  
- **Supporting interfaces** – `SectionInfo`, `DefinitionInfo`, `ServiceInfo`, `EndpointInfo`, `StepInfo`, `ResourceInfo`, `ReferenceResolution`, `ImportResolution`, and `CallGraphEntry` (lines 124‑196) provide detailed sub‑structures for non‑code entities.

### Impact  
- **Compile‑time**: New exports expand the public surface; modules importing from `graph-core` must reference this file or adjust imports.  
- **Runtime**: No executable code is added; the change is purely type‑level, so no performance or memory impact.  
- **Compatibility**: As a new file, it does not break existing code, but consumers must ensure the file is included in the build (tsconfig, package exports).

### Risks & follow‑ups  
- Verify `tsconfig.json` includes `packages/graph-core/src/types.ts` and that module resolution paths are correct.  
- Run the full test suite to confirm that no imports inadvertently shadow the new interfaces.  
- Ensure that the `AnalyzerPlugin` interface aligns with current plugin implementations; update any mismatched method signatures if necessary.  
- Update documentation and code comments to reflect the expanded type definitions, especially for plugin developers.
