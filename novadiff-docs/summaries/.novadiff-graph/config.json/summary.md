### Overview  
The file `./.novadiff-graph/config.json` has been removed from the repository.  
It previously contained two configuration flags: `autoUpdate` and `outputLanguage`.

### Key changes  
- Entire file `./.novadiff-graph/config.json` deleted (lines 1‑4 removed).  
- The `autoUpdate` flag (`false`) and `outputLanguage` (`"en"`) are no longer persisted.

### Impact  
- Any code that previously parsed this JSON will no longer find the file, potentially causing a file‑not‑found error unless guarded.  
- Tests that mock or assert the presence of this config may now fail.  
- Documentation or code that references the config file should be updated.

### Risks & follow‑ups  
- Verify that no modules import or read `./.novadiff-graph/config.json`.  
- Run the targeted unit tests that involve graph configuration to ensure no regressions.  
- Check the build pipeline for any steps that generate or consume this file.  
- Update any README or internal docs that mention the config file.
