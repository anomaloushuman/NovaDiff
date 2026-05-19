### Overview  
`packages/graph-core/src/fingerprint.ts` replaces the previous ad‑hoc change‑detection logic with a structured fingerprinting system for source files.

### Key changes  
- **Imports added** (lines 1‑5): `node:crypto`, `node:fs`, `node:path`, `./types.js`, `./plugins/registry.js`.  
- **New types** (lines 9‑63): `FunctionFingerprint`, `ClassFingerprint`, `ImportFingerprint`, `FileFingerprint`, `FingerprintStore`, `ChangeLevel`, `FileChangeResult`, `ChangeAnalysis`.  
- **`contentHash`** (lines 70‑72) computes a SHA‑256 hash of file contents.  
- **`extractFileFingerprint`** (lines 79‑122) builds a structural fingerprint from a `StructuralAnalysis`, capturing functions, classes, imports, exports, and line counts.  
- **`compareFingerprints`** (lines 131‑246) compares two fingerprints, classifying changes as `NONE`, `COSMETIC`, or `STRUCTURAL` and producing a diff list.  
- **`buildFingerprintStore`** (lines 253‑291) creates a fingerprint store for a project, falling back to content‑hash‑only fingerprints when structural analysis is unavailable (lines 268‑281).  
- **`analyzeChanges`** (lines 297‑385) orchestrates change detection across a set of files, returning a `ChangeAnalysis` summary.

### Impact  
- **Correctness**: Deterministic structural change detection; conservative `STRUCTURAL` classification when analysis is missing (lines 142‑149).  
- **Maintainability**: Centralized fingerprint logic and explicit type definitions aid future extensions.  
- **Performance**: Adds file I/O and hashing per file; early hash comparison (lines 138‑140) mitigates unnecessary work, but overall runtime depends on project size.

### Risks & follow‑ups  
- **False positives**: Structural comparison may flag benign changes (e.g., reordered imports) as `STRUCTURAL` (lines 220‑226).  
- **Missing analysis**: Files without tree‑sitter support are always marked `STRUCTURAL` (lines 268‑281); confirm this aligns with business expectations.  
- **Registry integration**: `registry.analyzeFile` must return a `StructuralAnalysis`; test that unsupported file types are handled correctly.  
- **Performance regression**: Benchmark `buildFingerprintStore` on large codebases to ensure acceptable runtime.
