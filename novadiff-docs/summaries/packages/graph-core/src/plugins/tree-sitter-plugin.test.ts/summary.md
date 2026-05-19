### Overview  
A new test file, `packages/graph-core/src/plugins/tree-sitter-plugin.test.ts`, has been added. It imports `vitest` (`describe, it, expect, beforeAll`) and the `TreeSitterPlugin` implementation. The file contains 307 added lines that exercise the plugin’s parsing, import resolution, call‑graph extraction, and metadata.

### Key changes  
- **Imports** – Lines 1‑2 show the added imports for `vitest` and `TreeSitterPlugin`.  
- **`analyzeFile` tests** – Lines 12‑186 cover extraction of functions, arrow functions, classes, imports, and exports for both TypeScript and JavaScript sources.  
- **`resolveImports` test** – Lines 238‑262 verify that relative imports are resolved to absolute paths and that external packages keep their original names.  
- **`extractCallGraph` test** – Lines 265‑294 confirm that function calls are linked correctly (`main → greet`, `greet → formatMessage`).  
- **Metadata tests** – Lines 297‑305 assert that `plugin.name` is `"tree-sitter"` and that `plugin.languages` includes `"typescript"` and `"javascript"`.

### Impact  
- Adds ~307 lines of test code, raising coverage for the `TreeSitterPlugin`.  
- Provides concrete expectations for AST parsing, import resolution, call‑graph extraction, and metadata exposure.

### Risks & follow‑ups  
- **Regression risk** – Any change to the public API of `TreeSitterPlugin` may break these tests; run the suite after refactors.  
- **Environment dependency** – Tests rely on `vitest` and the compiled plugin; ensure the build pipeline includes these dependencies.  
- **Path resolution** – The `resolveImports` test assumes a project layout rooted at `/project/src/index.ts`; verify that this path remains valid in all environments.
