### Overview
A new file `.novadiff-graph/config.json` has been added. It contains a minimal JSON object with two properties.

### Key changes
- File addition: `.novadiff-graph/config.json` (lines R1‑R4 added).  
- `autoUpdate`: set to `false` (line R2).  
- `outputLanguage`: set to `"en"` (line R3).  
- JSON structure: `{ "autoUpdate": false, "outputLanguage": "en" }` (lines R1‑R4).

### Impact
- The presence of this file may affect components that load configuration from this path.  
- The default values are explicitly defined; previously implicit defaults may no longer apply.  
- Unknown from the available diff/scan evidence whether any runtime behavior changes.

### Risks & follow‑ups
- Verify that consumers of this config handle the `false` value for `autoUpdate`.  
- Ensure older deployments that did not ship this file still function, or provide a fallback.  
- Update documentation to list the new config file and its purpose.  
- Run targeted tests that load the config and confirm the default language is `"en"`.
