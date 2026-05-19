### Overview  
A new file `packages/graph-core/src/plugins/discovery.ts` introduces a lightweight plugin configuration system. It exports `PluginEntry`, `PluginConfig`, a default configuration, and helper functions for parsing and serializing JSON configs.

### Key changes  
- `import { builtinLanguageConfigs }` (R1) pulls language metadata for default plugin generation.  
- `export interface PluginEntry` (R3‑R7) defines a plugin entry with `name`, `enabled`, `languages`, and optional `options`.  
- `export interface PluginConfig` (R10‑R12) aggregates an array of `PluginEntry`.  
- `DEFAULT_PLUGIN_CONFIG` (R14‑R24) pre‑populates a `tree-sitter` plugin with all languages that support Tree‑Sitter, derived from `builtinLanguageConfigs`.  
- `parsePluginConfig(jsonString)` (R30‑R60) parses a JSON string, validates that `plugins` is an array and each entry has a non‑empty `name`, a non‑empty `languages` array, and an optional boolean `enabled`. On any failure it returns a shallow copy of `DEFAULT_PLUGIN_CONFIG`.  
- `serializePluginConfig(config)` (R66‑R68) returns a pretty‑printed JSON string of the config.

### Impact  
- Provides a single source of truth for plugin config shape.  
- Centralizes default config and parsing logic, reducing duplication.  
- Existing code that imports `PluginConfig` can use the new module without breaking other modules.

### Risks & follow‑ups  
- `parsePluginConfig` swallows all parse errors and silently falls back to defaults; callers should detect this case or add logging.  
- `options` is optional and only type‑checked; stricter validation may be needed if required.  
- Default config construction filters and maps `builtinLanguageConfigs` on each import; monitor performance if the language set grows.  
- Ensure any module that consumes `PluginConfig` imports this file and updates type references accordingly.
