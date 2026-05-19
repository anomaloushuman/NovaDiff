### Overview  
A new test file `packages/graph-core/src/__tests__/domain-types.test.ts` (lines 1‑141) was added. It imports `vitest`, `validateGraph` from `../schema.js`, and the `KnowledgeGraph` type from `../types.js`.

### Key changes  
- **Sample graph** (`domainGraph`, lines 5‑62) contains 3 nodes (`domain`, `flow`, `step`) and 2 edges (`contains_flow`, `flow_step`).  
- **Tests** (lines 67‑141) verify:  
  - node/edge counts (lines 68‑73)  
  - correct edge types (lines 76‑85)  
  - handling of a `cross_domain` edge added to a cloned graph (lines 88‑108)  
  - normalization of node type aliases (`business_*` → canonical) (lines 110‑120)  
  - normalization of edge type aliases (`has_flow`, `next_step` → canonical) (lines 122‑130)  
  - preservation of the `domainMeta` field on the flow node (lines 132‑140).

### Impact  
- Provides a concrete, validated graph example for the `validateGraph` schema.  
- No production code changes; only tests.  
- Any failure will surface in CI, preventing regressions in graph validation logic.

### Risks & follow‑ups  
- **Schema drift**: if the graph schema evolves, these tests may fail; run `npm test` after schema changes.  
- **Alias handling**: ensure `validateGraph` continues to map `business_*` and `has_flow`/`next_step` to canonical types; otherwise normalization tests fail.  
- **Cross‑domain support**: verify that the `cross_domain` edge type remains valid in the schema.  
- **Linting/build**: run `npm run lint` and `npm run build` to confirm the new test file passes style and compilation checks.
