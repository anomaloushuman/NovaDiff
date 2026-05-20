### Overview  
A new test file `packages/graph-core/src/__tests__/normalize-graph.test.ts` (lines R1‑R498) has been added to exercise the graph‑normalization utilities and their integration with the schema validator.

### Key changes  
- **Imports added** (R1‑R7):  
  ```ts
  import { describe, it, expect } from "vitest";
  import {
    normalizeNodeId,
    normalizeComplexity,
    normalizeBatchOutput,
  } from "../analyzer/normalize-graph.js";
  import { validateGraph } from "../schema.js";
  ```
- **`normalizeNodeId` tests** (R9‑R107): cover handling of file, function, and class IDs; stripping of project prefixes; normalization of bare paths; whitespace trimming; support for non‑code prefixes; fallback for unknown types.
- **`normalizeComplexity` tests** (R124‑R184): verify mapping of string aliases, numeric ranges, case insensitivity, and defaulting to `"moderate"` for undefined, null, zero, or negative values.
- **`normalizeBatchOutput` tests** (R187‑R440): assert node ID rewriting, numeric‑to‑string complexity conversion, edge rewriting, dangling‑edge removal, node/edge deduplication, and accurate statistics reporting.
- **Integration test** (R443‑R497): builds a graph from the normalized output, validates it with `validateGraph`, and checks that the resulting graph contains the expected nodes and edges.

### Impact  
- **Correctness**: The tests confirm that normalization logic behaves as specified and that the output satisfies the graph schema.  
- **Maintainability**: Centralized edge‑case coverage makes future refactors easier to validate.  
- **Observability**: Statistics from `normalizeBatchOutput` are exercised, aiding debugging of normalization issues.  
- **Compatibility**: The public API of the analyzer remains stable; any breaking change will surface in these tests.

### Risks & follow‑ups  
- **Regression in normalization**: Changes to normalization rules will cause test failures; run `vitest` to verify.  
- **Schema drift**: If the schema changes, `validateGraph` may fail; keep the schema and validator in sync.  
- **Performance**: Large graphs could expose inefficiencies in ID rewriting or deduplication; monitor test runtimes.  
- **Missing edge cases**: Current tests cover typical scenarios; consider adding tests for uncommon prefixes or malformed IDs if new features are introduced.
