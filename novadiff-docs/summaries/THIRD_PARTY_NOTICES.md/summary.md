### Overview  
A new documentation file `THIRD_PARTY_NOTICES.md` was added to the repository root. It contains a header and a paragraph describing the open‑source components used by NovaDiff’s knowledge‑graph engine.

### Key changes  
- File added: `THIRD_PARTY_NOTICES.md` (root).  
- Header: `# Third‑party notices` (line 1).  
- First paragraph (lines 2‑3) references `packages/graph-core` and `packages/graph-view` and notes that they incorporate MIT‑licensed components for Tree‑sitter parsing and grammar handling.

### Impact  
- Provides a static record of third‑party licenses for the graph‑core and graph‑view modules.  
- No build or runtime changes; the file is purely documentation.  
- The presence of a top‑level notice file facilitates license‑scanning tools.

### Risks & follow‑ups  
- Verify that all third‑party libraries used by `graph-core` and `graph-view` are listed; omissions could affect compliance.  
- Confirm that the MIT license attribution matches the actual license files of the referenced components.  
- Ensure future dependency updates are reflected in this file; consider automating updates.
