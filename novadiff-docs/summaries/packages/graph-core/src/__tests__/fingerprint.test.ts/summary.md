### Overview  
A new test file `packages/graph-core/src/__tests__/fingerprint.test.ts` (lines R1‑427) has been added.  
It exercises the fingerprint utilities `contentHash`, `extractFileFingerprint`, `compareFingerprints`, and `analyzeChanges`.  
Mocks for `node:fs` are set up via `vi.mock("node:fs")` (lines 12‑16) and typed access via `vi.mocked` (lines 20‑21).

### Key changes  
- Imports added at R1‑6: `vitest` helpers, `StructuralAnalysis` type, and fingerprint functions from `../fingerprint.js`.  
- Additional import of `readFileSync` and `existsSync` from `node:fs` at R18.  
- Test cases cover:  
  - SHA‑256 consistency and uniqueness of `contentHash` (lines 27‑38).  
  - Extraction of functions, classes, imports, exports, content hash, and line count in `extractFileFingerprint` (lines 40‑125).  
  - Detection of change levels (`NONE`, `COSMETIC`, `STRUCTURAL`) in `compareFingerprints` across structural modifications (lines 128‑330).  
  - Classification of new, deleted, unchanged, and unknown files in `analyzeChanges` (lines 332‑427).  
- Edge‑case checks for non‑mutating array handling and conservative classification when `hasStructuralAnalysis` is false (lines 270‑329).

### Impact  
- Provides unit coverage for fingerprint logic, helping detect regressions in change detection.  
- Centralizes test logic; future updates to fingerprint functions will be caught early.  
- Tests execute locally and do not alter production code.

### Risks & follow‑ups  
- Mock reliability: ensure `vi.mocked` types match stubs; otherwise assertions may silently pass.  
- Test flakiness: `contentHash` relies on deterministic SHA‑256; confirm no environment‑specific variations.  
- Coverage gaps: verify all public fingerprint functions are exercised; consider integration tests for real file trees.  
- Future API changes: if `FingerprintStore` or `StructuralAnalysis` evolve, update test fixtures accordingly.
