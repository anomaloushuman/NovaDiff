### Overview  
`packages/graph-core/src/ignore-filter.ts` adds a reusable ignore filter.  
The file imports `ignore`, `fs` (`readFileSync`, `existsSync`) and `path` (`join`) at lines 1‑3.  
A constant `DEFAULT_IGNORE_PATTERNS` (lines 9‑70) lists common dependency, build, lock, binary, IDE, and license patterns.  
An `IgnoreFilter` interface (lines 72‑75) exposes `isIgnored(relativePath: string): boolean`.  
`createIgnoreFilter(projectRoot: string)` (lines 86‑111) builds an `ignore` instance, layering patterns in this order:  
1. hard‑coded defaults,  
2. `.novadiff-graph/.novadiffignore` if present,  
3. `.novadiffignore` at the project root if present.  
The returned object implements `isIgnored` by delegating to `ig.ignores(relativePath)`.

### Key changes  
- **Imports added**: `ignore`, `fs`, `path` (lines 1‑3).  
- **Default patterns**: comprehensive array (lines 9‑70).  
- **Interface**: `IgnoreFilter` (lines 72‑75).  
- **Factory function**: `createIgnoreFilter` (lines 86‑111) with layered pattern loading.  
- **Pattern loading**: uses `existsSync` and `readFileSync` to read user‑defined ignore files.

### Impact  
- Provides a single, documented source for ignore patterns.  
- Enables consistent ignore logic across graph‑core modules.  
- Exposes a clean API (`createIgnoreFilter`) for internal use.

### Risks & follow‑ups  
- **Pattern precedence**: later layers can override earlier ones via negation; verify correct behavior.  
- **File existence checks**: `existsSync` paths are resolved with `join`; confirm cross‑platform correctness.  
- **Test coverage**: add unit tests for `createIgnoreFilter` with various `.novadiffignore` contents.  
- **Integration**: ensure graph‑building components now use this filter and that no legacy ignore logic remains.
