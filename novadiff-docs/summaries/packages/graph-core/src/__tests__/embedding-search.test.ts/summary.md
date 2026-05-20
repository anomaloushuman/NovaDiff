### Overview  
A new test file `packages/graph-core/src/__tests__/embedding-search.test.ts` (lines 1‑92) has been added. It validates the `cosineSimilarity` helper and the `SemanticSearchEngine` class.

### Key changes  
- **Imports** (R1‑R3): `vitest` helpers, `SemanticSearchEngine`, `cosineSimilarity`, and the `GraphNode` type.  
- **Test data** (R5‑R7): a mock `nodes` array of three `GraphNode` objects and a 4‑dimensional `embeddings` map.  
- **Unit tests** for `cosineSimilarity` covering identical, orthogonal, similar, and zero‑vector cases.  
- **Comprehensive tests** for `SemanticSearchEngine`:  
  - Result ordering by similarity.  
  - `limit` and `threshold` options.  
  - `types` filtering.  
  - Handling of missing embeddings.  
  - `hasEmbeddings` and `addEmbedding` behavior.

### Impact  
- Adds coverage for embedding utilities; no production code is modified, so runtime behavior is unchanged.  
- Provides concrete test scenarios that can serve as a reference for future changes to the search engine or similarity function.

### Risks & follow‑ups  
- If `SemanticSearchEngine` does not implement the `types` filter or `threshold` logic as expected, the tests will fail; verify the implementation matches the test expectations.  
- Ensure the relative import `../embedding-search.js` resolves correctly in the test environment.  
- The test embeddings are 4‑dimensional; confirm this matches the dimensionality used in production (unknown from the available diff/scan evidence).  
- Run the full test suite to confirm no flakiness is introduced.
