### Overview  
A new test file `packages/graph-core/src/__tests__/domain-types.test.ts` (lines 1‑141) was added to exercise the `validateGraph` schema validator against a concrete domain graph. The file imports `vitest` helpers, the `validateGraph` function from `../schema.js`, and the `KnowledgeGraph` type from `../types.js`.

### Key changes  
- **Imports added** (lines 1‑3):  
  ```ts
  import { describe, it, expect } from "vitest";
  import { validateGraph } from "../schema.js";
  import type { KnowledgeGraph } from "../types.js";
  ```
- **Sample graph** (lines 5‑65): a `KnowledgeGraph` constant named `domainGraph` containing three nodes (`domain`, `flow`, `step`) and two edges (`contains_flow`, `flow_step`).  
- **Test cases** (lines 67‑141):  
  - Validate overall graph structure and node/edge counts.  
  - Verify specific edge types (`contains_flow`, `flow_step`).  
  - Add a `cross_domain` edge and confirm validation still succeeds.  
  - Test normalization of aliased node types (`business_domain`, `business_flow`, `business_step`).  
  - Test normalization of aliased edge types (`has_flow`, `next_step`).  
  - Ensure `domainMeta` on flow nodes is preserved after validation.

### Impact  
- Provides a concrete, runnable example of a valid `KnowledgeGraph`.  
- Increases test coverage for node and edge type normalization logic.  
- Serves as a regression guard for future changes to the schema or validator.

### Risks & follow‑ups  
- **Schema drift**: if the `KnowledgeGraph` schema changes, the test may need updating; run `vitest` after any schema refactor.  
- **Edge‑case regressions**: adding new edge types or node aliases may break the current expectations; consider extending the test suite.  
- **Performance**: the test uses `structuredClone`; monitor CI timing to ensure it remains lightweight.  
- **Output format changes**: the test asserts specific properties of the validation result; any change to `validateGraph` output could cause failures.
