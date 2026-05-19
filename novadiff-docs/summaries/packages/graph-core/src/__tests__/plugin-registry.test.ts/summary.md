### Overview  
A new test file `packages/graph-core/src/__tests__/plugin-registry.test.ts` has been added.  
It exercises the `PluginRegistry` API and the `registerAllParsers` helper, ensuring that plugins are registered, looked‑up, and cleaned up correctly, and that file‑type parsing works for a variety of minimal inputs.

### Key changes  
- **Imports** (lines 1‑4): `vitest` helpers, `PluginRegistry`, `registerAllParsers`, and type imports from `../types.js`.  
- **`createMockPlugin` helper** (lines 13‑20) builds minimal `AnalyzerPlugin` objects for the tests.  
- **Registry tests** (lines 22‑140) cover:  
  - registration, language/file lookup, and priority handling.  
  - `getSupportedLanguages`, `unregister`, and language‑map rebuild logic.  
  - Delegation of `analyzeFile` and `resolveImports`, including a test for a plugin that omits `resolveImports`.  
- **Smoke test for `registerAllParsers`** (lines 197‑228) registers all parsers and verifies that each returns a non‑null `StructuralAnalysis` for a minimal content snippet.  
  The test iterates over 12 file types: `README.md`, `config.yaml`, `config.json`, `config.toml`, `.env`, `Dockerfile`, `schema.sql`, `schema.graphql`, `types.proto`, `main.tf`, `Makefile`, `script.sh`.

### Impact  
- **Correctness**: The tests expose edge cases in plugin lookup and lifecycle, tightening the observable contract for `PluginRegistry`.  
- **Maintainability**: `createMockPlugin` centralizes mock creation, reducing duplication.  
- **Observability**: Failure messages include file‑path context (e.g., `analyzeFile should return a result for ${filePath}`), aiding debugging.  
- **Performance**: The smoke test runs ~12 iterations; negligible CI impact.

### Risks & follow‑ups  
- **Regression risk**: Changes to `PluginRegistry` may cause many tests to fail; run the full suite after any implementation change.  
- **Optional `resolveImports` handling**: Verify that non‑code plugins (e.g., the markdown plugin test) still return `null` for imports.  
- **Parser registration**: Ensure `registerAllParsers` registers all parsers; inspect the test case list for omissions.  
- **Snapshot drift**: No snapshots are used; if parser outputs change, update the structural‑analysis shape assertions accordingly.
