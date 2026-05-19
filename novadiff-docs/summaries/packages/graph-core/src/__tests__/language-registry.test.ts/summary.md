### Overview  
A new test file `packages/graph-core/src/__tests__/language-registry.test.ts` (lines R1‑198) was added to exercise the `LanguageRegistry` implementation and its schema enforcement.

### Key changes  
- **Imports** added at the top of the test file:  
  - `vitest` helpers (`describe`, `it`, `expect`) – R1.  
  - `LanguageRegistry` – R2.  
  - `StrictLanguageConfigSchema` – R3.  
  - Sample configs (`typescriptConfig`, `pythonConfig`) – R4‑R5.  
- **Registry behavior tests**:  
  - Registering a config and retrieving it by ID, extension, or file path.  
  - Null returns for unknown extensions or files lacking extensions.  
  - `getAllLanguages()` returns the full set of registered configs.  
- **Default registry tests** (`LanguageRegistry.createDefault()`):  
  - Confirms 40 built‑in configs are registered (line 53‑56).  
  - Verifies mapping for common extensions (`.ts`, `.py`, `.go`, etc.) (lines 60‑74).  
  - Checks that no extension is mapped to more than one config (lines 78‑85).  
  - Ensures every config contains at least one concept (lines 89‑92).  
- **Non‑code language detection**: tests for README, YAML, JSON, Dockerfile, Makefile, `.env` variants, and filename‑based configs (lines 98‑131).  
- **Schema validation tests**: use `StrictLanguageConfigSchema.safeParse` to reject configs lacking extensions or filenames and accept valid combinations (lines 149‑196).

### Impact  
- Provides concrete assertions for registry lookup logic and default configuration coverage.  
- Detects regressions in extension mapping, duplicate mappings, and concept presence.  
- Validates that the schema enforces the presence of at least one extension or filename.

### Risks & follow‑ups  
- **Fragility**: Tests depend on the exact list of 40 built‑in configs; adding or removing configs will require test updates.  
- **Performance**: `createDefault()` is exercised; significant slowdowns in registry construction would surface here.  
- **Schema drift**: If `StrictLanguageConfigSchema` changes, the validation tests may need adjustment.  
- **Regression**: Run the full test suite after any registry refactor to ensure no unintended behavior changes.
