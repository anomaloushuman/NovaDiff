### Overview  
A new test file **`packages/graph-view/src/utils/__tests__/edgeAggregation.test.ts`** has been added. It imports `vitest` helpers, the `aggregateContainerEdges` function, and type definitions from `@novadiff/graph-core/types`. A helper `ce` creates `GraphEdge` objects with default `type="calls"` and `direction="forward"`.

### Key changes  
- **Imports (lines 1‑3)**  
  ```ts
  import { describe, it, expect } from "vitest";
  import { aggregateContainerEdges } from "../edgeAggregation";
  import type { GraphEdge, EdgeType } from "@novadiff/graph-core/types";
  ```
- **Helper `ce` (lines 5‑11)** – constructs a `GraphEdge` with the specified source, target, and optional type.
- **Test suite (lines 13‑79)**  
  - Empty input returns empty arrays (lines 14‑18).  
  - Intra‑container edges are preserved (lines 20‑28).  
  - Same‑direction inter‑container edges are merged into a single aggregated edge with correct `count` and `edgeTypes` (lines 30‑45).  
  - Opposite directions produce separate aggregated edges (lines 47‑58).  
  - Edges whose endpoints lack a container mapping are ignored (lines 60‑65).  
  - Container IDs containing the separator character are handled correctly via length‑prefixing (lines 67‑78).

### Impact  
The tests exercise the aggregation logic for a range of scenarios without altering any public API. No snapshots are used, so no fixture refresh is required.

### Risks & follow‑ups  
- If `aggregateContainerEdges` is modified, these tests may fail; run the suite after changes.  
- Verify that the new file passes the repository’s TypeScript and linting checks.  
- No snapshot drift concerns exist.
