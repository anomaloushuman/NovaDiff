### Overview  
A new test file `tests/codeCityLayout.test.ts` was added. It imports `vitest` helpers, `buildCodeCityLayout`, and the `CodeCityModel` type. A helper function `modelWithSrcFilesOnly` (lines 5‑7) returns a minimal `CodeCityModel` containing two target‑side files (`src/App.tsx`, `src/util.ts`) and corresponding file‑level symbols (lines 11‑38, 40‑71).

### Key changes  
- **Imports added** (R1‑3).  
- **Helper function** `modelWithSrcFilesOnly` defined (R5‑7) with file and symbol data.  
- **Three test cases**:  
  1. Builds layout for subsystem `src` when only file symbols exist (lines 76‑92).  
  2. Handles subsystem paths containing backslashes (`src\\App.tsx`) (lines 94‑111).  
  3. Filters by symbol kind (`file`) and change state (`added`) (lines 113‑158).

### Impact  
- Provides a reusable minimal model for testing `buildCodeCityLayout`.  
- Adds a factory that can be reused by future tests.  
- Tests run locally with `vitest`; no new runtime flags are introduced.

### Risks & follow‑ups  
- **Regression risk**: any change to `buildCodeCityLayout` that alters symbol handling may break these tests; run the suite after refactors.  
- **Path normalization**: ensure the implementation consistently normalizes backslashes; failing tests may surface this.  
- **Coverage gap**: the helper covers only target‑side files; baseline‑side scenarios are not represented.  
- **Test isolation**: the helper creates fresh objects each call, so shared state mutation is unlikely.
