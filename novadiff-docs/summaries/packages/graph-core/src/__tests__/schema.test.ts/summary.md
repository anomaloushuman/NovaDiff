### Overview  
A new test file `packages/graph-core/src/__tests__/schema.test.ts` (added lines R1‑730) exercises the graph‑schema utilities: `validateGraph`, `sanitizeGraph`, `autoFixGraph`, and the alias maps `NODE_TYPE_ALIASES`/`EDGE_TYPE_ALIASES`. The file imports `vitest` helpers, the core functions, the alias constants, and the `KnowledgeGraph` type.

### Key changes  
- **Imports**: `vitest` helpers and the schema utilities are added (R1‑R6).  
- **Fixture**: `validGraph` (lines 12‑59) provides a minimal, well‑formed graph used throughout the tests.  
- **Validation tests**: cover success, missing required fields, invalid node/edge types, dangling references, alias normalization (e.g., `"func"` → `"function"`), and enforcement that alias values are not alias keys (lines 61‑268).  
- **Sanitization tests**: verify null‑to‑undefined conversion, lowercasing of enum‑like strings, and handling of null `tour`/`layers` (lines 280‑349).  
- **Auto‑fix tests**: check defaulting of missing fields, alias mapping, type coercion, and out‑of‑range clamping (lines 351‑500).  
- **Extended type tests**: confirm support for new node types (`config`, `document`, …) and edge types (`deploys`, `serves`, …), including legacy alias resolution (lines 502‑730).  
- **Permissive validation**: tests that nodes/edges with missing IDs or references are dropped with appropriate issues, and fatal errors are raised when no valid nodes remain (lines 504‑590).

### Impact  
- **Coverage**: The test suite adds numerous assertions that exercise edge cases and alias handling.  
- **Maintainability**: Changes to alias maps or validation logic will be caught early.  
- **Compatibility**: Requires `vitest` as a dev dependency; no runtime changes.  

### Risks & follow‑ups  
- **Regression**: Altering alias constants or validation rules may cause failures; review these constants.  
- **Test brittleness**: The shared `validGraph` fixture must be deep‑cloned (`structuredClone`) to avoid accidental mutation.  
- **Coverage gaps**: Tests focus on positive paths; consider adding negatives for malformed input types.  
- **Performance**: The suite contains many assertions; monitor runtime to keep it acceptable.
