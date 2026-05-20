### Overview  
A new test file `packages/graph-core/src/__tests__/plugin-registry.test.ts` (lines 1‑228) was added.  
It imports `vitest` helpers, `PluginRegistry`, `registerAllParsers`, and types `AnalyzerPlugin`, `StructuralAnalysis`, `ImportResolution`.  
A helper `createMockPlugin` (lines 13‑20) constructs a stub `AnalyzerPlugin` with default `analyzeFile` and `resolveImports` implementations.

### Key changes  
- **Imports** added at the top of the file (R1‑R4).  
- **Mock plugin factory** (`createMockPlugin`) returns an `AnalyzerPlugin` with stubbed methods (R13‑R20).  
- **Behavioral tests** (R22‑R194) cover:
  - registration, lookup by language and file extension, language mapping, and priority of later registrations.  
  - `getSupportedLanguages`, `unregister`, and language‑file resolution.  
  - Delegation of `analyzeFile` and `resolveImports` to the correct plugin, including handling of optional `resolveImports`.  
- **Smoke test** (R197‑R228) registers all parsers via `registerAllParsers` and verifies that each parser returns a non‑null `StructuralAnalysis` for minimal content across a variety of file types (Markdown, YAML, JSON, TOML, `.env`, Dockerfile, SQL, GraphQL, Proto, Terraform, Makefile, shell script).

### Impact  
- Adds 228 lines of test code, expanding coverage of `PluginRegistry` behavior.  
- Provides concrete assertions for plugin lookup, delegation, and language mapping.  
- The smoke test ensures that every parser can handle minimal content for its supported file types.

### Risks & follow‑ups  
- **Regression risk**: any change to `PluginRegistry` internals (e.g., language map logic) may cause multiple tests to fail; run the full suite after refactors.  
- **Snapshot drift**: if the shape of `StructuralAnalysis` changes, the smoke test may need updates; verify against current snapshots.  
- **Lint/build**: ensure the new file passes the repository’s TypeScript linting and build steps.  
- **Performance**: the smoke test iterates over many file types; monitor CI test duration to avoid timeouts.
