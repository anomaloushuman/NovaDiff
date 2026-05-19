### Overview  
A new test file `packages/graph-core/src/types.test.ts` (lines R1‑203) has been added. It imports `vitest` helpers and the public types from `./types.js`, then defines a suite of unit tests that exercise the shape of the graph data structures.

### Key changes  
- **Imports** – `import { describe, it, expect } from "vitest";` and `import type { KnowledgeGraph, GraphNode, GraphEdge, EdgeType, NodeType, StructuralAnalysis, AnalyzerPlugin, ReferenceResolution } from "./types.js";` (R1‑R2).  
- **KnowledgeGraph** – creates an empty graph and asserts all required fields (`version`, `project`, `nodes`, `edges`, `layers`, `tour`) and their default values (R4‑R28).  
- **GraphNode / GraphEdge** – constructs nodes of each supported `NodeType` and edges with weight bounds, checking required and optional properties (R30‑R116).  
- **Type alias coverage** – lists all 13 `NodeType` values and 26 `EdgeType` values, confirming they match the aliases and are interchangeable with `GraphNode["type"]` (R119‑R143).  
- **StructuralAnalysis** – supplies optional non‑code fields (`sections`, `definitions`, `services`, etc.) and verifies backward‑compatibility when omitted (R145‑R178).  
- **AnalyzerPlugin** – tests optional `resolveImports`, required `analyzeFile`, and `extractReferences` functionality (R180‑R202).

### Impact  
- **Type contract validation** – ensures that the public type definitions remain accurate; any future change that breaks the contract will surface as a test failure.  
- **Documentation** – the test suite serves as executable documentation for the expected shape of graph objects and plugin interfaces.  
- **Backward‑compatibility** – explicit checks for optional fields confirm that older consumers are not broken by new type definitions.

### Risks & follow‑ups  
- **Non‑determinism** – the graph test uses `new Date().toISOString()`, which could cause flakiness if the clock changes; consider mocking `Date`.  
- **Coverage gaps** – optional properties such as `languageNotes` on nodes are not exercised; review whether additional edge cases are needed.  
- **Linting** – run `npm run lint` to confirm the new test file complies with the repository’s TypeScript linting rules.
