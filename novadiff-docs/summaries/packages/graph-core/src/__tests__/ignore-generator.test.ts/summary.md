### Overview  
A new test file `packages/graph-core/src/__tests__/ignore-generator.test.ts` (lines R1‑162) was added to validate `generateStarterIgnoreFile`. The suite checks header content, directory‑based suggestions, generic test‑file patterns, and integration with an existing `.gitignore`.

### Key changes  
- **Imports** – added `vitest` helpers, `generateStarterIgnoreFile`, and Node `fs`, `path`, `os` modules (R1‑R5).  
- **Test harness** – `beforeEach` creates a unique temp directory `tmpdir()/ignore-gen-test-${Date.now()}`; `afterEach` removes it (R10‑R17).  
- **Header checks** – asserts presence of `.novadiffignore`, a reference to `.gitignore`, and “Built‑in defaults” (R19‑R23).  
- **Directory suggestions** – verifies commented suggestions for existing directories (`__tests__`, `docs`, `test`, `tests`, `fixtures`, `examples`, `.storybook`, `migrations`, `scripts`) and that non‑existent ones are omitted (R26‑R96).  
- **Generic test patterns** – ensures `*.snap`, `*.test.*`, and `*.spec.*` are always suggested (R84‑R88).  
- **`.gitignore` integration** – tests inclusion of uncovered patterns, deduplication, comment/blank‑line skipping, trailing‑slash normalization, and omission when all patterns are covered (R98‑R153).  
- **Section omission** – confirms no “From .gitignore” section appears when absent or fully covered (R144‑R153).

### Impact  
The added tests provide concrete coverage of ignore‑file generation logic, making regressions in header formatting, directory detection, or `.gitignore` handling immediately visible.

### Risks & follow‑ups  
- **Parallel test flakiness** – `Date.now()` may produce duplicate directories; consider a UUID suffix.  
- **Cleanup reliability** – `rmSync(..., { recursive: true, force: true })` should always delete the temp dir; a final existence check could guard against failures.  
- **Future default changes** – if built‑in defaults evolve, corresponding assertions (e.g., header text, generic patterns) will need updating.
