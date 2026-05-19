### Overview
A new test file `packages/graph-core/src/__tests__/plugin-discovery.test.ts` (lines 1‑116) has been added to validate the plugin‑discovery utilities exported from `../plugins/discovery.js`. The tests exercise parsing, default configuration, and serialization logic.

### Key changes
- **Imports** (lines 1‑8):  
  ```ts
  import { describe, it, expect } from "vitest";
  import {
    parsePluginConfig,
    serializePluginConfig,
    type PluginConfig,
    type PluginEntry,
    DEFAULT_PLUGIN_CONFIG,
  } from "../plugins/discovery.js";
  ```
- **Parsing tests** (lines 10‑72): verify that `parsePluginConfig`  
  - parses valid JSON with multiple plugins,  
  - falls back to `DEFAULT_PLUGIN_CONFIG` on invalid JSON, empty string, or a non‑array `plugins` field,  
  - filters out entries missing required fields (`name`, `languages`), and  
  - defaults `enabled` to `true` when omitted.
- **Default config test** (lines 75‑81): ensures `DEFAULT_PLUGIN_CONFIG` contains a single enabled `tree-sitter` plugin.
- **Serialization tests** (lines 83‑115): confirm that `serializePluginConfig` produces JSON containing `name`, `enabled`, `languages`, and correctly serializes an optional `options` field.

### Impact
- **Correctness**: The tests guarantee that the parsing and serialization functions handle edge cases and defaults as intended.  
- **Maintainability**: Future refactors of the plugin‑discovery module will be caught early by this test suite.  
- **Observability**: No runtime changes; tests run during CI.  
- **Compatibility**: No public API changes; only test coverage is expanded.

### Risks & follow‑ups
- **Regression risk**: If `parsePluginConfig` or `serializePluginConfig` are altered, the tests may fail; run the full suite after any related refactor.  
- **Test fragility**: Assertions rely on exact string containment (e.g., `"name": "tree-sitter"`); if the serialization format changes, update the tests.  
- **Coverage gap**: The current tests cover typical scenarios but not deeply nested `options` objects; consider adding such cases if needed.  
- **CI load**: Adding a test file increases test count; monitor CI duration for any slowdown.
