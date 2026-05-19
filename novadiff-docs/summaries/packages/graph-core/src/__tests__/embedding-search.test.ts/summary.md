### Overview  
A new test file `packages/graph-core/src/__tests__/embedding-search.test.ts` has been added.  
The file imports `vitest` helpers (lines 1‑3), the `SemanticSearchEngine` and `cosineSimilarity` utilities (line 2), and the `GraphNode` type (line 3).  
It defines an in‑memory `nodes` array (lines 5‑9) and an `embeddings` map (lines 12‑16) for three sample nodes.  
The test suite (lines 18‑92) exercises the cosine similarity function and the search engine’s public API.

### Key changes  
- **Imports**: `vitest`, `SemanticSearchEngine`, `cosineSimilarity`, `GraphNode`.  
- **Test data**: `nodes` array and `embeddings` map defined inline.  
- **Cosine similarity tests**: identity, orthogonality, similarity threshold, zero‑vector handling.  
- **SemanticSearchEngine tests**:  
  - Result ordering by similarity.  
  - `limit` and `threshold` options.  
  - Type filtering (`types: ["function"]`).  
  - Handling of missing embeddings.  
  - `hasEmbeddings` flag behavior.  
  - `addEmbedding` updates the index.

### Impact  
- Provides unit coverage for core search logic, ensuring that changes to similarity calculations or filtering are detected during testing.  
- Centralizes test data; future updates to node structure or embeddings can be made in a single location.  
- No modifications to production code paths; the new file only adds tests.

### Risks & follow‑ups  
- **Determinism**: The tests rely on fixed embeddings; any change to `cosineSimilarity` must preserve the expected outputs.  
- **Coverage gaps**: All public methods of `SemanticSearchEngine` are exercised, but edge cases such as an empty node list are not explicitly tested.  
- **CI integration**: It is unknown from the diff whether the new tests are automatically included in the CI pipeline.
