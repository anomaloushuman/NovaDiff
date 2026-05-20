### Overview  
A new locale file `packages/graph-view/src/locales/en.ts` has been added. It defines the English string bundle `en` (exported at line 1) and exports it as the module’s default export (line 272).

### Key changes  
- **File creation** – `packages/graph-view/src/locales/en.ts` now exists.  
- **Exported object** – `export const en = { … }` introduces a comprehensive set of UI labels, tooltips, and messages (see diff lines 1‑270).  
- **Default export** – `export default en;` (line 272) makes the bundle available via `import en from './locales/en'`.  
- **No other modules touched** – the diff shows only this new file; no imports or references were added elsewhere.

### Impact  
- The bundle is self‑contained; importing it will not cause runtime errors unless the import path is incorrect.  
- It centralizes English strings, simplifying future updates.  
- Existing code that does not import `en` remains unaffected.

### Risks & follow‑ups  
- **Unused file** – Verify that the build process includes this file; otherwise it may be omitted from the bundle.  
- **Missing imports** – Ensure components that need English strings import `en` from the correct path.  
- **Duplicate keys** – The large object contains many nested keys; confirm that no accidental key collisions exist with other locale files.  
- **Build size** – Adding a large string bundle could increase bundle size; monitor the production build size to confirm it stays within acceptable limits.
