### Overview  
A new file `packages/graph-core/scripts/language-names.txt` has been added.  
The diff shows 675 added lines (R1‑675). The first entry is **“A.NET (A#/A sharp)”** and the last is **“ZPL”**.

### Key changes  
- **File addition**: `packages/graph-core/scripts/language-names.txt` now exists in the `graph-core` package.  
- **Content**: The file contains a plain‑text list of 675 programming‑language names, alphabetically ordered.  
- **No other code changes**: The diff contains only the new file; no imports, exports, or references to it appear in the changed files.

### Impact  
- **Build**: The file is static; adding it does not alter compilation or runtime unless another module explicitly reads it.  
- **Documentation**: The list can be consumed by future tooling or docs generators that need a reference of language names.  
- **Size**: Approximately 10 KB; negligible effect on repository size or network transfer.  
- **Testing**: No tests were added or modified; existing tests remain unchanged.

### Risks & follow‑ups  
- **Unintended consumption**: If a future module imports this file, it will introduce a hard dependency on a large static list. No evidence of such imports in the current diff.  
- **Maintenance**: The list is static; consider a script to keep it updated if ongoing coverage is required.  
- **Documentation consistency**: Verify that any documentation referring to supported languages includes this new list to avoid discrepancies.
