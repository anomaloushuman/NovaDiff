### Overview  
A new module `packages/graph-core/src/fingerprint.ts` implements a fingerprinting pipeline for JavaScript/TypeScript files. It hashes file contents, extracts structural signatures (functions, classes, imports, exports), and classifies changes into NONE, COSMETIC, or STRUCTURAL.

### Key changes  
- **Imports** (R1‑R5): added `node:crypto`, `node:fs`, `node:path`, and type imports from `./types.js` and `./plugins/registry.js`.  
- **Type definitions** (R9‑R48): introduced `FunctionFingerprint`, `ClassFingerprint`, `ImportFingerprint`, `FileFingerprint`, `FingerprintStore`, and `ChangeLevel`.  
- **Helpers** (R70‑R121): `contentHash` computes SHA‑256; `extractFileFingerprint` builds a `FileFingerprint` from a `StructuralAnalysis`.  
- **Comparison** (R131‑R246): `compareFingerprints` checks content hash, structural signatures, and flags significant size changes. Missing structural analysis defaults to STRUCTURAL.  
- **Store builder** (R253‑R291): `buildFingerprintStore` reads files, runs `registry.analyzeFile`, and falls back to hash‑only fingerprints when analysis is unavailable.  
- **Change analyzer** (R297‑R385): `analyzeChanges` orchestrates file existence checks, fingerprint extraction, and categorizes changes into new, deleted, unchanged, cosmetic, or structural.

### Impact  
- **Correctness**: Structural comparison can surface API changes that content hashing alone would miss.  
- **Maintainability**: Centralized fingerprint logic replaces scattered implementations.  
- **Compatibility**: The module is additive; no existing APIs are altered.  
- **Performance**: Reading and hashing all files adds runtime cost; impact on CI or hot‑reload scenarios is unknown from the diff.

### Risks & follow‑ups  
- **False positives**: `JSON.stringify` on arrays may mis‑order elements; ensure `methods`/`properties` are sorted before comparison.  
- **Large file handling**: `content.split("\n")` could be memory intensive; benchmark on large files.  
- **Registry contract**: `registry.analyzeFile` must return `StructuralAnalysis` or `null`; otherwise fingerprints become hash‑only.  
- **Test coverage**: Add unit tests for `compareFingerprints` edge cases (e.g., no structural analysis, significant size change).
