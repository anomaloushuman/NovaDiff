### Overview  
A new test file `tests/smoke.test.ts` has been added to the repository. It contains a basic Vitest smoke test that verifies a simple arithmetic operation.

### Key changes  
- **Import added** at line 1: `import { describe, expect, it } from "vitest";` (R1 added).  
- **Test suite defined** at lines 3‑7: `describe("toolchain", () => { … });` (R3 added).  
- **Single test case** at lines 4‑5: `it("runs tests", () => { expect(1 + 1).toBe(2); });` (R4‑5 added).  
- The file resides in the `tests/` directory, following existing test conventions.

### Impact  
- Adds a sanity check that the test runner and JavaScript engine are functioning; unlikely to affect production code.  
- Provides a minimal example for future test writers, demonstrating Vitest syntax and project structure.  
- Running the test suite will now include this smoke test, giving quick feedback if the test environment is misconfigured.  
- Runtime impact negligible; the test executes instantly.

### Risks & follow‑ups  
- Ensure Vitest is installed and configured; otherwise the test will fail to run.  
- Run `npm run lint` to confirm the new file passes linting rules.  
- No snapshots are involved, so no refresh is needed.  
- Verify that the CI pipeline picks up the new test file and that it passes on all target platforms.
