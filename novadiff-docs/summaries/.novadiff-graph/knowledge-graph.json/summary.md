### Overview
- New file `.novadiff-graph/knowledge-graph.json` added (lines R1‑R6).  
- File starts with `{` and contains metadata: `"version": "1.0.0"`, `"project": {"name": "NovaDiff"}`, `"languages": ["css", …]`.  
- The file is ~8 000 lines long.

### Key changes
- Metadata header: `version`, `project`, and `languages` arrays (R2‑R6).  
- Node schema: the file defines nodes with fields such as `id`, `type`, `name`, `filePath`, `summary`, `tags`, `complexity`, `layerId`.  
- Coverage and function details are unknown from the available diff/scan evidence.

### Impact
- Provides a single source of truth for the NovaDiff architecture that tooling can query, visualize, and analyze.  
- Enables automated tests and documentation generation to reference the graph directly.

### Risks & follow‑ups
- **Verification**: Run targeted tests and a smoke test on the knowledge‑graph consumer to ensure integrity.  
- **Maintenance**: Future code changes must update the graph to keep it current.  
- **Performance**: Large graph size (~8 000 lines) may impact load times; monitor tooling performance.
