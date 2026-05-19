### Overview
Adds a Japanese locale file for the graph‑view component, enabling UI text in Japanese.

### Key changes
- New file **packages/graph-view/src/locales/ja.ts** added.  
- Lines 1–272 contain `export const ja = { … }` with nested translation objects (`common`, `projectOverview`, `nodeInfo`, etc.).  
- Line 272 ends with `export default ja;`.

### Impact
- The application can display Japanese text when the locale is set to `ja`.  
- Only string data is added; runtime impact is minimal.  
- No existing source files are modified.

### Risks & follow‑ups
- Verify that the i18n loader imports and registers the `ja` locale so keys resolve.  
- Ensure every UI key used in the application exists in this file; missing keys will fall back to defaults.  
- Confirm the file is included in the TypeScript compilation and bundled output.  
- Run UI tests with the locale set to Japanese to validate that all strings render correctly.
