### Overview  
A new test file `packages/graph-core/src/__tests__/fingerprint.test.ts` (lines R1‑R427) has been added.  
It imports the fingerprint utilities (`contentHash`, `extractFileFingerprint`, `compareFingerprints`, `analyzeChanges`) and the `StructuralAnalysis` type from `../types.js`.  
The file mocks `node:fs` (lines R12‑R18) to provide `readFileSync` and `existsSync` stubs, and clears these mocks before each test (line R23).  
All tests run under `vitest` (imported at R1).

### Key changes  
- **Imports** – `vitest` helpers, `StructuralAnalysis`, and the four fingerprint functions (R1‑R10).  
- **Mocking** – `vi.mock("node:fs")` replaces the real file‑system functions (R12‑R16).  
- **Content‑hash tests** – verify deterministic SHA‑256 output and distinct hashes for different inputs (R27‑R34).  
- **Fingerprint extraction tests** – cover functions, classes, imports, exports, content hash, and line counts (R40‑R126).  
- **Fingerprint comparison tests** – exercise all change levels (`NONE`, `COSMETIC`, `STRUCTURAL`) and edge cases such as missing structural analysis (R128‑R330).  
- **Analyze‑changes tests** – validate classification of new, deleted, unchanged, and unknown files, and confirm that input arrays are not mutated (R332‑R427).  
- **Mock usage** – `mockedReadFileSync` and `mockedExistsSync` are cast with `vi.mocked` (R20‑R21).  
- **Registry and store** – a mock registry (`analyzeFile`) and an existing fingerprint store are used in the `analyzeChanges` tests (R333‑R361).

### Impact  
- **Coverage** – the test suite exercises every exported fingerprinting function and the `analyzeChanges` workflow, providing early detection of regressions.  
- **Maintainability** – changes to fingerprint logic will be caught by the focused test blocks.  
- **Observability** – failures surface immediately in CI with clear diagnostics on which comparison rule failed.  
- **Performance** – unknown from the available diff/scan evidence.

### Risks & follow‑ups  
- **Mock reliability** – ensure `vi.mocked` correctly casts the stubs; run tests to confirm no TypeScript errors.  
- **Snapshot drift** – if the hash algorithm or fingerprint format changes, snapshots may need updating (`vitest --update`).  
- **Edge‑case coverage** – verify that `analyzeChanges` handles files lacking structural analysis; targeted tests already exist (R304‑R330).  
- **CI integration** – confirm the new test file is included in the test matrix and that the `vitest` command is updated accordingly.
