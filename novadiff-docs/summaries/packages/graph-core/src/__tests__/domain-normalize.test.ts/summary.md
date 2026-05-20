### Overview
A new test file `packages/graph-core/src/__tests__/domain-normalize.test.ts` (lines R1‑R46) was added. It imports `vitest` helpers and `normalizeNodeId` from `../analyzer/normalize-graph.js`.

### Key changes
- **Imports**:  
  - `import { describe, it, expect } from "vitest";` (R1)  
  - `import { normalizeNodeId } from "../analyzer/normalize-graph.js";` (R2)
- **Domain node test**:  
  `normalizeNodeId("domain:order-management", { type: "domain", name: "Order Management" })` → `"domain:order-management"` (R6‑R10)
- **Flow node test**:  
  `normalizeNodeId("flow:create-order", { type: "flow", name: "Create Order" })` → `"flow:create-order"` (R14‑R18)
- **Step node tests**:  
  - With `filePath`: `"step:create-order:src/validators/order.ts:validate"` (R22‑R27)  
  - Without `filePath`: `"step:validate"` (R30‑R35)  
  - Bare step name with `filePath`: `"step:src/validators/order.ts:validate"` (R38‑R44)

### Impact
Adds explicit coverage for `normalizeNodeId`, making changes to the helper immediately visible through test failures.

### Risks & follow‑ups
- **Regression risk**: Refactoring `normalizeNodeId` may cause these tests to fail; run the full suite after changes.  
- **Test fragility**: Tests depend on exact string outputs; any change in ID formatting conventions will require updates.  
- **Coverage gap**: Only current ID patterns are exercised; consider adding edge cases (e.g., empty names or unsupported types) if the function evolves.
