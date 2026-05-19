### Overview
Adds a new CLI script `electron/graph/extract-structure.mjs` that deterministically extracts structural data from a batch of files using TreeSitter and non‑code parsers, replacing earlier regex‑based logic.

### Key changes
- **Imports**: Adds Node core imports (`createRequire`, `dirname`, `resolve`, `join`, `fileURLToPath`, `pathToFileURL`, `readFileSync`, `writeFileSync`) at lines 19‑22.  
- **Dynamic core loading**: Resolves `@novadiff/graph-core` with `pathToFileURL` to support Windows ESM paths (lines 35‑41).  
- **CLI entry point**: Implements `async function main()` (lines 48‑140) that parses `process.argv`, reads input JSON, processes each file, builds results via `buildResult`, and writes output JSON.  
- **Result builder**: Exports `buildResult(file, totalLines, nonEmptyLines, analysis, callGraph, batchImportData)` (lines 147‑305) to map analysis data to the expected output schema.  
- **CLI guard**: Detects direct execution and runs `main()` (lines 311‑321).

### Impact
- **Correctness**: Provides deterministic extraction using TreeSitter and non‑code parsers; replaces fragile regex scripts.  
- **Maintainability**: Centralizes result construction in a pure function (`buildResult`), making it unit‑testable and easier to modify.  
- **Performance**: Skips analysis for files >12,000 lines, reducing runtime on large codebases.  
- **Compatibility**: Uses `pathToFileURL` to handle Windows paths, ensuring ESM imports work cross‑platform.  
- **Observability**: Emits detailed metrics (`importCount`, `exportCount`, etc.) and logs errors to `stderr`.

### Risks & follow‑ups
- **Path resolution**: Verify `pathToFileURL` handling on Windows; ensure `require.resolve('@novadiff/graph-core')` resolves correctly in all environments.  
- **Batch import data**: Confirm `batchImportData` is populated; fallback logic may miscount imports if data is missing.  
- **Large file handling**: Files >12,000 lines are skipped from analysis; ensure this threshold matches project expectations.  
- **CLI argument parsing**: Test with missing or extra arguments to confirm error messages and exit codes.
