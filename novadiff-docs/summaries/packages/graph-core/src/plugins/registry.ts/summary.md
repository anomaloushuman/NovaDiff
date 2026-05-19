### Overview  
`packages/graph-core/src/plugins/registry.ts` now contains a `PluginRegistry` class (added at line 11).  
It centralizes analyzer plugin management and language resolution via `LanguageRegistry` (imported at lines 1‑2).

### Key changes  
- **Imports** – type imports for `AnalyzerPlugin`, `StructuralAnalysis`, `ImportResolution`, `CallGraphEntry` (R1) and a runtime import of `LanguageRegistry` (R2).  
- **Class definition** – fields: `plugins: AnalyzerPlugin[]`, `languageMap: Map<string, AnalyzerPlugin>`, and `languageRegistry: LanguageRegistry` (R12‑14).  
- **Constructor** – accepts an optional `LanguageRegistry`; defaults to `LanguageRegistry.createDefault()` (R16‑18).  
- **Plugin lifecycle** –  
  - `register(plugin)` pushes to `plugins` and populates `languageMap` (R20‑24).  
  - `unregister(name)` removes the plugin, clears and rebuilds `languageMap` (R27‑36).  
- **Lookup helpers** – `getPluginForLanguage(language)` (R39‑41), `getPluginForFile(filePath)` (R43‑47), and `getLanguageForFile(filePath)` (R52‑54).  
- **Analysis delegation** – `analyzeFile`, `resolveImports`, and `extractCallGraph` forward to the appropriate plugin if available (R56‑72).  
- **Introspection** – `getPlugins()` and `getSupportedLanguages()` expose current state (R74‑80).

### Impact  
- **Correctness** – replaces hard‑coded language lookups with `LanguageRegistry` (commented at R8‑10).  
- **Maintainability** – a single registry simplifies adding/removing plugins; tests can mock `LanguageRegistry`.  
- **Performance** – `register`/`unregister` rebuild the map in linear time relative to the number of plugins.  
- **Compatibility** – no changes to existing plugin interfaces; only a new entry point for consumers.

### Risks & follow‑ups  
- Duplicate language entries across plugins will overwrite earlier mappings (`languageMap.set` in `register`).  
- `unregister` clears and rebuilds the map; verify that stale entries are removed and subsequent lookups reflect the updated state.  
- Confirm that `LanguageRegistry.createDefault()` populates all supported file types.  
- Run integration tests to ensure delegation methods (`analyzeFile`, `resolveImports`, `extractCallGraph`) correctly route to the right plugin after registration changes.
