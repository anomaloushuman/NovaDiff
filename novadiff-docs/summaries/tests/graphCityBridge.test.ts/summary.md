### Overview  
The `graphCityBridge` test suite was extended to cover additional edge‑case scenarios. New imports and tests validate line‑suffix handling, missing graph nodes, and graph‑node visibility logic.

### Key changes  
- **Import added**: `graphNodeIdsForCityLayout` is now imported at line 7.  
- **Test “maps disambiguated function node ids with line suffix”** (lines 113‑131) checks that a node id such as `function:src/a.ts:foo:42` maps to the city building `target:src/a.ts:function:foo:1`.  
- **Test “highlights from city building id when graph node is missing”** (lines 133‑141) verifies that `cityBuildingIdsForHighlight` returns a primary id and highlights related buildings even when the graph argument is `null`.  
- **Test “collects graph node ids for visible city buildings”** (lines 146‑155) ensures `graphNodeIdsForCityLayout` returns a set containing the file and function nodes but excludes unrelated class nodes.  
- Minor formatting adjustments keep test imports consistent.

### Impact  
- **Correctness**: The added tests confirm that line‑suffix node ids resolve correctly and that missing graph data is handled without errors.  
- **Maintainability**: Centralizing node‑id collection in `graphNodeIdsForCityLayout` reduces duplication across tests.  
- **Observability**: New tests surface regressions in mapping logic early in CI.  
- **Compatibility**: No API changes; only test coverage expansion.

### Risks & follow‑ups  
- If `graphNodeToCityBuildingIds` or `cityBuildingIdsForHighlight` are modified elsewhere, the new tests may fail; run the full suite after such changes.  
- Ensure `graphNodeIdsForCityLayout` is exported correctly; otherwise the tests will error.  
- Verify that `cityBuildingIdsForHighlight` accepts a `null` graph without throwing; the test covers this but may require defensive coding.
