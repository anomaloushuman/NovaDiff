### Overview  
A new test file `packages/graph-core/src/__tests__/plugin-discovery.test.ts` (lines 1‑116) has been added. It imports `vitest` helpers and the discovery utilities from `../plugins/discovery.js` and exercises the parsing and serialization logic for plugin configuration objects.

### Key changes  
- **Imports**: `import { describe, it, expect } from "vitest";` and `import { parsePluginConfig, serializePluginConfig, type PluginConfig, type PluginEntry, DEFAULT_PLUGIN_CONFIG } from "../plugins/discovery.js";` (diff lines 1‑8).  
- **`parsePluginConfig` tests** cover:  
  - Valid JSON with required fields (lines 12‑22).  
  - Invalid JSON or empty string → defaults to `DEFAULT_PLUGIN_CONFIG` (lines 25‑33).  
  - Filtering of entries missing `name` or `languages` (lines 35‑46).  
  - Defaulting `enabled` to `true` when omitted (lines 48‑56).  
  - Handling non‑array or missing `plugins` fields (lines 58‑71).  
- **`DEFAULT_PLUGIN_CONFIG` assertion**: contains a single enabled `tree-sitter` entry (lines 75‑80).  
- **`serializePluginConfig` tests** verify formatted JSON output and inclusion of an `options` field (lines 83‑114).

### Impact  
- **Correctness**: Provides deterministic checks for edge cases in plugin configuration handling.  
- **Maintainability**: Acts as a guard against regressions when the discovery module is modified.  
- **Observability**: Any change that breaks these expectations will surface immediately in the test suite.  
- **Runtime**: No changes to production code; only test coverage is expanded.

### Risks & follow‑ups  
- If the discovery implementation changes, these tests may fail; run the full suite to confirm.  
- No snapshots are used, but ensure that any formatting changes to `serializePluginConfig` are intentional.  
- Verify that the new test file passes linting and that the project builds successfully.
