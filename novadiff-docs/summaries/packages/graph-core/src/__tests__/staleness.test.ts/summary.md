### Overview  
A new test file `packages/graph-core/src/__tests__/staleness.test.ts` validates the staleness utilities (`getChangedFiles`, `isStale`, `mergeGraphUpdate`). It mocks `child_process.execFileSync` (lines 1‑6) and uses helper constructors (`makeGraph`, `makeNode`, `makeEdge` – lines 14‑32) to build deterministic graph fixtures.

### Key changes  
- **Imports & mocking** – added Vitest imports and a mock for `child_process` (lines 1‑6).  
- **Graph helpers** – `makeGraph`, `makeNode`, `makeEdge` provide reusable fixtures (lines 14‑32).  
- **`getChangedFiles` tests** – verify git diff parsing, empty results, and error handling (lines 56‑86).  
- **`isStale` tests** – confirm stale flag and changed file list (lines 89‑110).  
- **`mergeGraphUpdate` tests** – cover node replacement, edge pruning, and metadata updates (lines 113‑252).  
- **Timestamp validation** – checks that `project.analyzedAt` falls between two timestamps (lines 242‑251).

### Impact  
- Adds explicit unit tests for staleness logic, reducing ambiguity around expected behavior.  
- Centralizes graph construction helpers, lowering duplication in future tests.  
- Provides concrete assertions on edge removal and timestamp updates, aiding debugging.

### Risks & follow‑ups  
- The global `child_process` mock may affect other tests; run the full suite to confirm isolation.  
- The timestamp test assumes `analyzedAt` is set to the current time; if the implementation changes to a fixed value, the test will fail.  
- Current tests cover typical scenarios; consider adding cases for circular dependencies or missing nodes.  
- Unknown from the available diff/scan evidence whether the mock interferes with other test suites.
