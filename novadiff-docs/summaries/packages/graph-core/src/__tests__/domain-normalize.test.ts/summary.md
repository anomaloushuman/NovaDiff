### Overview  
A new test file `packages/graph-core/src/__tests__/domain-normalize.test.ts` has been added to verify the `normalizeNodeId` helper for domain, flow, and step node types.

### Key changes  
- **Imports added**  
  - `R1 added: import { describe, it, expect } from "vitest";`  
  - `R2 added: import { normalizeNodeId } from "../analyzer/normalize-graph.js";`  
- **Test cases added** (`R4–R46`)  
  - Domain node: `normalizeNodeId("domain:order-management", { type: "domain", name: "Order Management" })` → `"domain:order-management"`  
  - Flow node: `normalizeNodeId("flow:create-order", { type: "flow", name: "Create Order" })` → `"flow:create-order"`  
  - Step node with `filePath`: `normalizeNodeId("step:create-order:validate", { type: "step", name: "Validate", filePath: "src/validators/order.ts" })` → `"step:create-order:src/validators/order.ts:validate"`  
  - Step node without `filePath`: `normalizeNodeId("step:validate", { type: "step", name: "Validate" })` → `"step:validate"`  
  - Bare step name with `filePath`: `normalizeNodeId("validate", { type: "step", name: "Validate", filePath: "src/validators/order.ts" })` → `"step:src/validators/order.ts:validate"`

### Impact  
The added tests confirm that `normalizeNodeId` preserves existing IDs for domain and flow nodes and formats step node IDs correctly, including optional `filePath` handling. This provides a concrete regression guard for future changes to the normalization logic.

### Risks & follow‑ups  
- **Implementation mismatch**: If `normalizeNodeId` does not handle the step‑with‑filePath case, the corresponding test will fail; run the test suite to verify.  
- **Edge cases**: Current tests cover typical patterns; consider adding cases for empty or malformed inputs if the function is expected to handle them.  
- **CI integration**: Ensure the new test file is picked up by the `vitest` configuration and appears in coverage reports.
