### Overview  
A new file `packages/graph-core/src/ignore-filter.ts` (added in the diff) introduces a reusable ignore‑filter. It exports:

- `DEFAULT_IGNORE_PATTERNS` (R9‑R70) – a hard‑coded list of common build, lock, binary, IDE, and license patterns.
- `IgnoreFilter` interface (R72‑R75) with `isIgnored(relativePath: string): boolean`.
- `createIgnoreFilter(projectRoot: string)` (R86‑R111) that builds an `ignore` instance, layers defaults, `.novadiff-graph/.novadiffignore`, and root `.novadiffignore`, then returns an object implementing `IgnoreFilter`.

### Key changes  
- **Imports**: added `ignore`, `readFileSync`, `existsSync`, and `join` (R1‑R3).  
- **Default patterns**: defined in `DEFAULT_IGNORE_PATTERNS` (R9‑R70).  
- **Interface**: `IgnoreFilter` (R72‑R75).  
- **Factory**: `createIgnoreFilter` (R86‑R111) merges layers and exposes `isIgnored`.  
- **Negation**: later patterns override earlier ones via `!` syntax, as noted in the comment block (R77‑R84).

### Impact  
- Provides a single source for ignore rules that can be shared across scanning modules.  
- Centralizes pattern maintenance; adding a rule requires editing only `DEFAULT_IGNORE_PATTERNS`.  
- `ignore` parses patterns once per `createIgnoreFilter` call; subsequent `isIgnored` checks use `ig.ignores`, offering efficient lookups.  
- No breaking API changes are introduced; the new module is additive.

### Risks & follow‑ups  
- **Malformed ignore files**: `ignore` may silently ignore patterns; validate contents in tests.  
- **Path resolution**: `join(projectRoot, ".novadiff-graph", ".novadiffignore")` assumes a fixed subdirectory; confirm it matches repository layout.  
- **Negation precedence**: ensure later layers correctly override earlier ones; unit tests should cover `!` patterns.  
- **Integration**: search for existing hard‑coded ignore logic that may conflict; replace with `IgnoreFilter` where appropriate.
