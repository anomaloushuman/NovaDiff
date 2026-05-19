### Overview  
A new test suite `packages/graph-core/src/__tests__/ignore-filter.test.ts` (lines R1‑R155) has been added. It exercises the `ignore-filter` module, validating default ignore patterns, the filter’s behavior without a user file, and its handling of `.novadiffignore` files in both the graph directory and the project root.

### Key changes  
- **Imports** (`R1‑R5`): Vitest helpers, `createIgnoreFilter`, `DEFAULT_IGNORE_PATTERNS`, and Node fs/path/os utilities.  
- **Test setup** (`R7‑R18`): Creates a temporary directory per test, writes a `.novadiff-graph` folder, and cleans up with `rmSync`.  
- **Default pattern checks** (`R20‑R42`): Asserts that `DEFAULT_IGNORE_PATTERNS` contains `node_modules/`, `.git/`, `obj/`, `dist/`, `build/`, `out/`, `coverage/` and does not contain `bin/`.  
- **Filter behavior tests** (`R45‑R86`): Verify that `createIgnoreFilter` ignores default patterns, lock files, binaries, generated files, and IDE directories.  
- **User ignore file tests** (`R89‑R154`):  
  - Reads patterns from `/.novadiff-graph/.novadiffignore` and the project root.  
  - Handles comments, blank lines, negation (`!dist/`), recursive `**/snapshots/`.  
  - Merges both ignore files.  
- **Teardown** (`R16‑R18`): Uses `rmSync(testDir, { recursive: true, force: true })` to ensure cleanup.

### Impact  
- **Correctness**: The tests confirm that the ignore filter honors expected patterns and user overrides.  
- **Maintainability**: Future changes to ignore logic or defaults will be caught by the suite.  
- **Observability**: Failures surface immediately during test runs.  
- **Compatibility**: No API changes; tests rely only on existing exports.

### Risks & follow‑ups  
- **Regression if defaults change**: Modifying `DEFAULT_IGNORE_PATTERNS` will cause failures; review intentional changes.  
- **Cleanup reliability**: `rmSync` is invoked in `afterEach`; ensure it runs even on test failures to avoid stale state.  
- **Test environment**: Verify Vitest is configured to run these tests; missing configuration could hide failures.  
- **Performance**: The suite creates and deletes directories per test; monitor CI runtime for any slowdown.
