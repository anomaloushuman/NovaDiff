### Overview
Adds a new English locale file for the graph‑view component. The file is located at `packages/graph-view/src/locales/en.ts` and defines a constant `en` containing UI strings grouped into sections such as `common`, `projectOverview`, `nodeInfo`, etc.

### Key changes
- New file `packages/graph-view/src/locales/en.ts` added.  
- Lines 1‑272 contain the `en` object; line 272 exports it as default (`export default en;`).  
- The object holds roughly 270 string entries covering all UI text used in graph‑view.

### Impact
- No existing files are modified; the change is additive.  
- Components that import `en` can display English text, enabling i18n support.  
- The added strings will be compiled into the bundle; the size impact is minimal.

### Risks & follow‑ups
- **Import consistency**: verify that components needing the locale import `en` correctly; missing imports will cause runtime errors.  
- **Build inclusion**: ensure the new file is included in the TypeScript compilation and bundled output.  
- **Default vs. named export**: confirm consuming code uses the default export where appropriate.  
- **Key coverage**: run i18n tests to confirm all UI elements reference existing keys and that no duplicate keys exist.
