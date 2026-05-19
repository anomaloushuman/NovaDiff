### Overview  
A new test file `packages/graph-core/src/__tests__/ignore-generator.test.ts` (lines R1‑162) validates `generateStarterIgnoreFile`. It imports `vitest` helpers, the generator, and Node fs/path/os APIs, then creates a temporary project directory for each test.

### Key changes  
- **Imports** (R1‑R5): `vitest` functions, `generateStarterIgnoreFile`, `mkdirSync`, `rmSync`, `writeFileSync`, `join`, `tmpdir`.  
- **Setup/teardown** (R7‑R17): `beforeEach` creates a unique temp dir via `tmpdir()` and `mkdirSync`; `afterEach` removes it with `rmSync`.  
- **Header tests** (R19‑R24): assert that the output contains `.novadiffignore`, “same as .gitignore”, and “Built‑in defaults”.  
- **Suggestion logic** (R26‑R57): verify all suggested patterns are commented out and that directory‑based suggestions (`__tests__`, `docs`, `test`, `tests`, `fixtures`, `examples`, `.storybook`, `migrations`, `scripts`) appear only when the directory exists.  
- **Generic test file suggestions** (R84‑R89): always include `*.snap`, `*.test.*`, `*.spec.*`.  
- **.gitignore integration** (R98‑R161): create `.gitignore` files with `writeFileSync`, check that non‑default patterns are prefixed with `#`, comments/blank lines are ignored, trailing‑slash normalization works, and the section is omitted when no `.gitignore` or all patterns are defaults.

### Impact  
- Adds comprehensive guardrails for `generateStarterIgnoreFile`.  
- Expands coverage for directory suggestions and `.gitignore` parsing.  
- Tests perform filesystem writes; cleanup is handled in `afterEach`, but failures could leave temp dirs.

### Risks & follow‑ups  
- **Temp dir uniqueness**: `Date.now()` may collide under heavy parallel runs; consider `crypto.randomUUID()` if flaky.  
- **Cleanup reliability**: ensure `afterEach` runs even on failures to avoid orphaned directories.  
- **Environment permissions**: tests assume write access to the OS temp directory; verify in CI.  
- **API changes**: if `generateStarterIgnoreFile` signature changes, these tests will fail; maintainers should update imports accordingly.
