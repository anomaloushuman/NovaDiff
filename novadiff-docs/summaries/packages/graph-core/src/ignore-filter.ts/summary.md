### Overview  
The `DEFAULT_IGNORE_PATTERNS` array in `packages/graph-core/src/ignore-filter.ts` now contains two new glob patterns. The changes appear in the diff at lines 16–17: `".venv-*/"` and `"**/site-packages/"`. No other parts of the file were modified.

### Key changes  
- Added `".venv-*/"` to ignore any directory whose name starts with `.venv-` (e.g., `.venv-3.10`).  
- Added `"**/site-packages/"` to ignore any `site-packages` directory anywhere under the project tree.  
- The ignore‑filter construction (`createIgnoreFilter`) and its exported interface remain unchanged.

### Impact  
- Projects that contain Python virtual environments or nested `site-packages` directories will be excluded from analysis by default, reducing noise.  
- The default ignore list is still centralized; future additions can follow the same pattern.  
- Custom `.novadiffignore` files still override these defaults via negation, as described in the function comment.

### Risks & follow‑ups  
- Verify that legitimate directories named `.venv-…` or `site-packages` that are not Python environments are not unintentionally ignored.  
- Ensure the glob `"**/site-packages/"` does not match unintended paths (e.g., a folder named `site-packages` in a non‑Python context).  
- Run the existing test suite and a sample scan on a mixed‑language repository to confirm that the new defaults do not break analysis.  
- Update any documentation that lists default ignore patterns to reflect the new entries.
