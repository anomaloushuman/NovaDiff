### Overview
A new test file `packages/graph-view/src/__tests__/selectionCluster.test.ts` was added. It imports `vitest` helpers, the `KnowledgeGraph` type, and the two functions under test.

### Key changes
- **Imports** added at lines 1‑3: `vitest` helpers, `KnowledgeGraph`, and `graphNodeIdsInFile`, `graphSelectionCluster`.  
- **Mock graph** defined at lines 5‑45: two file nodes (`file:src/a.ts`, `file:src/b.ts`) and two function nodes (`function:src/a.ts:foo`, `function:src/a.ts:bar`). Edges include containment, calls, and imports.  
- **Tests** at lines 47‑61:  
  - `graphSelectionCluster` is called with a file node and the test asserts that the returned cluster contains the file and both functions.  
  - `graphNodeIdsInFile` is called for `src/a.ts` and the test checks that the returned array includes the file and its functions.

### Impact
Adds unit coverage for the selection utilities, ensuring that changes to graph traversal logic are detected during CI. The mock graph is self‑contained, making future updates straightforward.

### Risks & follow‑ups
- **Schema drift**: If the `KnowledgeGraph` shape changes, the mock will need updating; run `vitest` to confirm.  
- **Edge‑case coverage**: Only file‑level selection is tested; consider adding tests for function‑level selection and nested imports.  
- **Linting/build**: Verify that the new file passes `tsc`, `eslint`, and the repository’s build pipeline.  
- **Snapshot drift**: No snapshots are used, so no risk of stale snapshots.
