### Overview
A new file, `.novadiff-graph/config.json`, has been added to the repository.  
The file contains four lines:

```
{
  "autoUpdate": false,
  "outputLanguage": "en"
}
```

### Key changes
- **File addition**: `.novadiff-graph/config.json` now exists (previously absent).  
- **Configuration defaults**: The file sets `"autoUpdate": false` and `"outputLanguage": "en"`.

### Impact
- **Scope**: The change is limited to the new configuration file; no other files were modified.  
- **Usage**: It is unknown from the diff whether any component currently reads this file.  
- **Future maintenance**: Centralizing these flags may simplify future adjustments, but code that previously assumed no config file may need to handle its presence.

### Risks & follow‑ups
- **Configuration loading**: Unknown from the available evidence whether the graph module loads this file; verify that the loader is invoked during initialization.  
- **Flag enforcement**: Run targeted tests to confirm that `autoUpdate` is respected if the config is read.  
- **Documentation**: Update any relevant docs to reflect the new configuration options once their usage is confirmed.
