### Overview  
A new test suite `packages/graph-core/src/__tests__/schema.test.ts` has been added to exercise the graph schema validation, sanitization, auto‑fix, permissive validation, and support for extended node/edge types.

### Key changes  
- **New test file** `packages/graph-core/src/__tests__/schema.test.ts` imports `vitest` helpers and the schema utilities from `../schema.js`.  
- Tests cover **validation** of required fields, alias normalization, dropping invalid items, and fatal conditions.  
- **Sanitization** tests verify null handling, enum lower‑casing, and array defaults.  
- **Auto‑fix** tests confirm defaulting, alias mapping, type coercion, and out‑of‑range clamping.  
- **Permissive validation** tests check node/edge dropping, reference filtering, and error preservation.  
- **Extended types** tests assert support for new node types (`config`, `document`, …) and edge types (`deploys`, `serves`, …), including alias resolution.

### Impact  
- **Correctness**: Increases confidence that schema logic handles edge cases and new types.  
- **Coverage**: Adds ~730 lines of test code, raising overall test coverage for the graph module.  
- **Observability**: Provides detailed failure messages for each validation rule, aiding debugging.  
- **Compatibility**: No API changes; only test additions, so runtime behavior remains unchanged.

### Risks & follow‑ups  
- **Test flakiness**: Ensure deterministic timestamps (`analyzedAt`) or mock them to avoid failures.  
- **Snapshot updates**: If any snapshot tests exist, run `vitest --update` to refresh them.  
- **Alias chain validation**: Verify that `NODE_TYPE_ALIASES` and `EDGE_TYPE_ALIASES` still have no chains; the tests assert this.  
- **Performance**: Running ~730 test lines may increase CI time; monitor for regressions in test duration.
