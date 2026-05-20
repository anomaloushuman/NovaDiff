### Overview  
A new CommonJS module `electron/novadiff-docs-writer.cjs` is added to generate a NovaDiff documentation bundle on disk. It introduces helper functions for bundle metadata, writes a set of Markdown, JSON, and Mermaid files, and exports the writer and a constant.

### Key changes  
- **Imports**: `fs/promises` and `path` are required (lines 3‑4).  
- **Constants**: `NOVADIFF_DOCS` and `DEFAULT_BUNDLE_KEY` (lines 6‑7).  
- **Helper functions**:  
  - `bundleKeyOf(bundle)` (lines 9‑12) normalizes the bundle key.  
  - `bundleBaseDir(root, bundle)` (lines 14‑16) builds the output directory path.  
  - `bundleHeadline(bundle)` (lines 18‑26) selects a human‑readable headline.  
  - `readme(bundle)` (lines 51‑93) constructs a README with a table of contents.  
- **Main writer**: `writeNovadiffDocsBundle(bundle)` (lines 96‑174)  
  - Validates `bundle.targetRoot`.  
  - Creates the base and `diagrams` directories.  
  - Writes README, AI project doc, compare metrics, codebase outline, risk signals, summary/selection indexes, confidence badges, release overview, and Mermaid diagram files (writes at lines 105‑110, 112‑115, 117‑120, 122‑125, 127‑130, 132‑135, 137‑140, 142‑145, 147‑151, 152‑156, 158‑161, 163‑166, 168‑170).  
  - Returns `{ ok: true, dir: base, bundleKey: bundleKeyOf(bundle) }` (line 173).  
- **Exports**: `module.exports = { writeNovadiffDocsBundle, NOVADIFF_DOCS }` (line 176).

### Impact  
- **Correctness**: Guarantees a fully populated docs bundle; missing `targetRoot` throws an error.  
- **Maintainability**: Centralizes bundle generation logic; helper functions aid reuse.  
- **Performance**: Uses async I/O; writes files sequentially, which may be a bottleneck for large bundles.  
- **Compatibility**: Pure CommonJS; no ES module syntax, so it fits the existing Electron build.  
- **Observability**: Returns the output directory and bundle key, useful for downstream tooling.

### Risks & follow‑ups  
- **Error handling**: Only `targetRoot` is validated; other properties are assumed truthy, which could lead to silent failures if omitted.  
- **Race conditions**: Concurrent calls to `writeNovadiffDocsBundle` could overwrite files; consider locking or unique temp dirs.  
- **Path safety**: `bundleKeyOf` trims and defaults but does not sanitize; malformed keys could produce unexpected paths.  
- **Testing**: No unit tests cover this module; add tests for file creation, error paths, and output content.
