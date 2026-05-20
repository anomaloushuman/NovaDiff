### Overview  
A new test file `packages/graph-core/src/__tests__/staleness.test.ts` (R1‑253) is added.  
It imports `vitest` helpers and the `KnowledgeGraph` types, mocks `child_process.execFileSync` (R4‑6), and defines `makeNode`, `makeEdge`, and `makeGraph` helpers (R14‑49).  
The suite exercises `getChangedFiles`, `isStale`, and `mergeGraphUpdate` with a variety of scenarios.

### Key changes  
- **Imports & mock setup** – `vitest` utilities and type imports are added (R1‑2). `child_process` is mocked with `vi.mock` (R4‑6) and the mock is cleared before each test (R52‑54).  
- **Helper constructors** – `makeNode`, `makeEdge`, and `makeGraph` build minimal graph objects for assertions (R14‑49).  
- **`getChangedFiles` tests** – Verify parsing of git diff output, handling of empty diffs, and graceful error handling (R56‑87).  
- **`isStale` tests** – Confirm stale detection when files change and non‑stale when no changes (R89‑110).  
- **`mergeGraphUpdate` tests** – Cover node replacement, edge pruning, dangling edge removal, and updates to `analyzedAt` and `gitCommitHash` (R113‑253).  
- **Mocked execFileSync** – Typed via `vi.mocked(execFileSync)` (R12).

### Impact  
The added tests provide concrete coverage for the staleness utilities, ensuring that git diff parsing, stale detection, and graph merging behave as expected. They also expose edge cases such as empty diffs, git errors, and dangling edges.

### Risks & follow‑ups  
- **Mock leakage** – `vi.clearAllMocks()` is called before each test, but any future test that omits this could inherit stale mock state.  
- **Edge‑case depth** – Current tests use small graphs; larger or deeply nested graphs may reveal additional issues.  
- **Timestamp precision** – The `analyzedAt` test compares two `Date` calls; on very fast systems the timestamps could be identical, potentially causing intermittent failures. A mock clock could mitigate this.
