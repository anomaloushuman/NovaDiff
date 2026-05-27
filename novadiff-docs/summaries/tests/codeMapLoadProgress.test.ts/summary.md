### Overview
A new test file `tests/codeMapLoadProgress.test.ts` (lines 1‑40) has been added. It imports `vitest` helpers and the two functions `computeCodeMapLoadSnapshot` and `isCodeMapExperienceReady` from `../src/app/codeMapLoadProgress`.

### Key changes
- **Imports**: `import { describe, expect, it } from "vitest";` and the two functions (R1‑R5).
- **Snapshot test**: Calls `computeCodeMapLoadSnapshot` with a graph‑building state and asserts that `snap.phase` equals `"Knowledge graph"` and `snap.percent` is less than 55 (R8‑R19).
- **Readiness test**: Calls `isCodeMapExperienceReady` with different flag combinations and expects `true` only when `graphReady`, `explorerMounted`, and `cityReady` are all true (R22‑R39).

### Impact
- Provides unit checks for the state‑transition logic in `codeMapLoadProgress`.
- Future changes to the snapshot or readiness logic will be caught by these tests.

### Risks & follow‑ups
- No production code changes; risk is limited to test failures if logic changes.
- Run the full test suite to confirm no regressions; update snapshots or logic if needed.
