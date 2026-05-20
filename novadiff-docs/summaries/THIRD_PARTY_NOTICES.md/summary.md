### Overview  
A new documentation file `THIRD_PARTY_NOTICES.md` was added to the repository root. The file begins with `# Third‑party notices` (added line 1) and includes a paragraph describing the MIT‑licensed components used by NovaDiff’s knowledge‑graph engine (added line 3). The paragraph references `packages/graph-core` and `packages/graph-view` and notes that they incorporate Tree‑sitter parsing and grammar handling libraries.

### Key changes  
- **File addition**: `THIRD_PARTY_NOTICES.md` (root).  
- **Header**: `# Third‑party notices` (line 1).  
- **Content**: Mentions MIT‑licensed components for Tree‑sitter parsing in `packages/graph-core` and `packages/graph-view` (line 3).  
- **No source code changes**: Only documentation was added.

### Impact  
- **Compliance**: Provides a record of third‑party licenses for the mentioned components.  
- **Documentation**: Adds transparency about external dependencies.  
- **Build/packaging**: No effect on build or runtime; the file is informational.

### Risks & follow‑ups  
- **Incomplete coverage**: The notice only lists Tree‑sitter components; other dependencies may be missing.  
- **Future updates**: Add new dependencies to this file as they appear.  
- **Discoverability**: Ensure the file is referenced in project documentation so users can find it.
