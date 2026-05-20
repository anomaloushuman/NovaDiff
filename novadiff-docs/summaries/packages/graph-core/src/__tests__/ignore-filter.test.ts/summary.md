### Overview  
A new test suite `packages/graph-core/src/__tests__/ignore-filter.test.ts` was added (lines R1‑155). It imports vitest helpers (R1), ignore‑filter utilities (R2), and Node’s `fs`, `path`, `os` modules (R3‑R5). The suite creates a temporary directory with `tmpdir()` and removes it after each test.

### Key changes  
- **Default pattern checks** – `DEFAULT_IGNORE_PATTERNS` (imported in R2) is asserted to contain `"node_modules/"`, `".git/"`, `"obj/"`, `"dist/"`, `"build/"`, `"out/"`, `"coverage/"` and to omit `"bin/"` (lines 20‑42).  
- **Filter behavior without user file** – `createIgnoreFilter(testDir)` is exercised to confirm it ignores default patterns, lock files, binary/asset files, generated files, and IDE directories while leaving source files untouched (lines 45‑86).  
- **User ignore file handling** – Tests read `.novadiff-graph/.novadiffignore` and root `.novadiffignore`, verifying support for comments, blank lines, negation (`!dist/`), recursive patterns (`**/snapshots/`), and merging of both files (lines 89‑154).

### Impact  
- **Compatibility** – The test suite uses only vitest and Node’s built‑in modules; no new dependencies are introduced.  
- **Observability** – Each assertion targets a specific pattern or file type, so failures directly indicate the mismatched rule.

### Risks & follow‑ups  
- **Regression risk** – Any change to `createIgnoreFilter` or `DEFAULT_IGNORE_PATTERNS` may cause failures; run the suite after modifications.  
- **Parsing edge cases** – Ensure the ignore parser handles comments, blank lines, and negation as exercised by the tests.  
- **Recursive pattern support** – Verify that `**/snapshots/` matches nested directories as expected.  
- **Merge precedence** – Confirm that patterns from `.novadiff-graph/.novadiffignore` and root `.novadiffignore` are combined without unintended overrides.
