### Overview  
The file `.novadiff-graph/config.json` has been deleted.  
All four lines that composed the file – the opening brace, `autoUpdate`, `outputLanguage`, and the closing brace – are gone (L1‑L4 removed).

### Key changes  
- **File removal**: `./.novadiff-graph/config.json` no longer exists in the repository.  
- **Removed configuration keys**: `autoUpdate` and `outputLanguage` were the only keys in the file.  
- **No fallback configuration** is provided by this file.

### Impact  
- Any code that imports or reads `./.novadiff-graph/config.json` will encounter a missing‑file error unless it handles the absence.  
- The repository no longer exposes a JSON configuration for auto‑update or language; downstream logic must rely on hard‑coded defaults or environment variables (unknown from the available diff/scan evidence).  
- Build scripts, Dockerfiles, or CI pipelines that referenced the file may fail; verify that no such references remain.

### Risks & follow‑ups  
- **Runtime failure**: Modules importing the removed file will throw an error; review imports and add error handling.  
- **Default behavior drift**: Ensure that any implicit defaults match the previous explicit settings; run tests that assert default behavior (unknown from the available diff/scan evidence).  
- **CI pipeline**: Confirm that build scripts no longer reference the deleted file.  
- **Documentation**: Update any README or internal docs that mention the config file.
