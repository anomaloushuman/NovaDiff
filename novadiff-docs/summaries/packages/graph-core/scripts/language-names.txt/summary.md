### Overview  
A new data file `packages/graph-core/scripts/language-names.txt` has been added.  
The file contains 675 lines, each listing a programming language name (e.g., `A.NET (A#/A sharp)`, `ABAP`, `Python`, `ZPL`).  
The diff shows lines 1‑675 added (R1‑675).

### Key changes  
- **File addition**: `packages/graph-core/scripts/language-names.txt` now exists in the repository.  
- **Content**: 675 language names, covering mainstream and niche languages.  
- **No code changes**: The diff only introduces this data file; no source files or tests were modified.

### Impact  
- Any component that imports or reads this file will now have a comprehensive list to work with.  
- Future edits can be made in a single file rather than across multiple code paths.  
- Build size increase is unknown from the available diff/scan evidence.

### Risks & follow‑ups  
- Verify that modules expecting `language-names.txt` correctly resolve the new path.  
- Ensure downstream consumers handle the plain‑text format and any special characters (parentheses, slashes).  
- Run existing tests that rely on language lists to confirm they still pass with the expanded set.  
- Update any documentation that lists supported languages to reflect the new additions.
