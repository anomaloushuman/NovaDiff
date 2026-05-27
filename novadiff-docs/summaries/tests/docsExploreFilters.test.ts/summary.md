### Overview
A new test file `tests/docsExploreFilters.test.ts` was added to validate the three exported utilities from `../src/app/docsExploreFilters`. The file imports `vitest` helpers (`describe`, `expect`, `it`) and the functions `graphDetailFromSymbolKinds`, `symbolMatchesKindGroups`, and `toggleSymbolKindGroup`.

### Key changes
- **Imports added** (lines 1‑6 of the test file):
  ```ts
  import { describe, expect, it } from "vitest";
  import {
    graphDetailFromSymbolKinds,
    symbolMatchesKindGroups,
    toggleSymbolKindGroup,
  } from "../src/app/docsExploreFilters";
  ```
- **Test cases**:
  - Verify `graphDetailFromSymbolKinds` maps symbol kinds to the correct graph detail level and `showFunctionsInClassView` flag (lines 10‑25).
  - Confirm `symbolMatchesKindGroups` matches a symbol kind against a list of structure groups (lines 29‑32).
  - Ensure `toggleSymbolKindGroup` keeps at least one group enabled when toggling (lines 36‑40).

### Impact
- **Correctness**: Explicit assertions guard against silent regressions in the filtering logic.
- **Coverage**: Adds dedicated tests for the docs‑explore filtering utilities, which previously had no tests.
- **Maintainability**: The tests serve as documentation for expected behavior, aiding future refactors.
- **Build/CI**: No changes to build scripts; the new file will be executed by the existing test runner.

### Risks & follow‑ups
- **Implementation drift**: If the signatures or return shapes of the three functions change, the tests will fail. Verify that the implementation matches the expected contract.
- **Path changes**: The import path `../src/app/docsExploreFilters` must remain valid; moving the module will require updating the test import.
- **Test flakiness**: The tests are deterministic, but ensure that any global state or environment configuration does not affect the outcomes.
- **CI performance**: Adding a few tests has negligible impact; run the full test suite to confirm no regressions.
