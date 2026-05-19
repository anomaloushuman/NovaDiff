### Overview  
A new test file `packages/graph-core/src/analyzer/graph-builder.test.ts` (lines 1‑404) has been added. It imports `vitest`, `GraphBuilder`, and `StructuralAnalysis` (R1‑R3) and exercises the public API of `GraphBuilder`.

### Key changes  
- **File node creation** – `addFile` is tested to produce nodes with IDs like `file:src/index.ts` (R7‑R13).  
- **Function & class nodes** – `addFileWithAnalysis` creates nodes for functions (`function:src/service.ts:processData`) and classes (`class:src/service.ts:DataStore`) (R41‑R92).  
- **Edge generation** – tests confirm `contains`, `imports`, and `calls` edges are added with correct source/target IDs and weights (R95‑R178).  
- **Project metadata** – the builder sets `name`, `gitCommitHash`, `languages`, `analyzedAt`, `layers`, and `tour` (R180‑R203).  
- **Language detection** – file extensions (`go`, `rust`, `javascript`) and non‑code extensions (`yaml`, `graphql`, `terraform`, `protobuf`) are inferred (R205‑R339).  
- **Non‑code file support** – `addNonCodeFile` and `addNonCodeFileWithAnalysis` create nodes for documents, tables, services, endpoints, resources, and pipeline steps, and generate corresponding `contains` edges (R216‑R321).  
- **Warning logic** – unknown definition kinds trigger a console warning and default to `concept` (R341‑R360); duplicate node IDs are skipped with a warning (R363‑R383).  
- **Node type usage** – `nodeType` is incorporated into file IDs for contains edges (R386‑R402).

### Impact  
- **Correctness** – the tests validate that `GraphBuilder` handles a wide range of node types and relationships.  
- **Maintainability** – any change to the builder’s API or internal logic will surface as test failures.  
- **Observability** – warnings for unknown kinds and duplicate IDs are explicitly asserted, ensuring predictable console output.

### Risks & follow‑ups  
- **Regression risk** – modifications to `GraphBuilder` may break multiple tests; run the full suite after refactors.  
- **Console warnings** – ensure `console.warn` is not suppressed elsewhere, as tests spy on it.  
- **CI load** – the expanded test suite may increase execution time; monitor and consider parallelization if necessary.
