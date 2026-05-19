### Overview  
A new test file `packages/graph-core/src/__tests__/framework-registry.test.ts` has been added.  
The file contains imports (R1‑R4) and a suite of tests covering registration, lookup, detection, default registry creation, and immutability (R6‑R123).

### Key changes  
- **Imports added**  
  - `vitest` helpers (R1)  
  - `FrameworkRegistry` (R2)  
  - `djangoConfig` and `reactConfig` (R3‑R4)  
- **CRUD tests** (R6‑R11) verify `register`, `getById`, and `getForLanguage`.  
- **Detection logic tests** (R13‑R82) exercise `detectFrameworks` against `requirements.txt`, `package.json`, case‑insensitivity, no‑match, empty manifests, duplicate detection, and cross‑language support.  
- **Default registry tests** (R84‑R122) confirm `FrameworkRegistry.createDefault()` registers 10 built‑in frameworks and exposes them across multiple languages.  
- **Immutability check** (R100‑R106) ensures `getForLanguage` returns a copy, not the internal array.

### Impact  
- **Correctness**: The tests enforce expected behavior of registration, lookup, and detection logic.  
- **Coverage**: Adds unit coverage for edge cases such as duplicate entries and empty inputs.  
- **Maintainability**: Future changes to `FrameworkRegistry` must satisfy these tests, providing a safety net for refactors.  
- **Observability**: Failures will pinpoint specific methods (e.g., `detectFrameworks`, `createDefault`) that deviate from expectations.

### Risks & follow‑ups  
- **API drift**: If `FrameworkRegistry`’s public API changes (e.g., method signatures), the tests will fail; review recent refactors.  
- **Detection logic changes**: Modifying heuristics could break `detectFrameworks` tests; ensure new patterns are reflected in expectations.  
- **Default config count**: The test expects exactly 10 built‑in frameworks; adding or removing defaults will require updating the assertion.  
- **Immutability contract**: If the implementation changes to return a reference instead of a copy, the immutability test will fail; verify that `getForLanguage` still returns a new array.
