### Overview  
A new locale file `packages/graph-view/src/locales/zh.ts` has been added.  
It declares `export const zh = { … }` (lines 1‑270) and exports the object as the module’s default (`export default zh;` at line 272).  

### Key changes  
- **File addition**: `packages/graph-view/src/locales/zh.ts` now exists.  
- **Exported constant**: `zh` contains ~270 key/value pairs for UI strings (common, projectOverview, nodeInfo, etc.).  
- **Default export**: `export default zh;` (line 272).  
- **No other files modified**.  

### Impact  
- **Internationalization**: Provides Chinese translations for the graph‑view UI.  
- **Build size**: Adds a small JSON‑like data block; impact is negligible.  
- **Testing**: Existing locale imports will resolve to this file; tests should verify that all keys render correctly.  
- **Documentation**: No README or docs were updated.  

### Risks & follow‑ups  
- **Import usage**: Verify components import the locale correctly (`import zh from './locales/zh'`).  
- **Key consistency**: Ensure no duplicate or misspelled keys that could break rendering.  
- **Fallback behavior**: Confirm the app falls back to English when a key is missing in `zh`.  
- **Build pipeline**: Run lint, tests, and production build to catch syntax or export issues.
