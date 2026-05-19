### Overview  
A new locale file **`packages/graph-view/src/locales/zh-TW.ts`** has been added.  
It defines Traditional Chinese translations for the graph‑view UI, with an export of the locale object and a default export.

### Key changes  
- **Export declaration** – `export const zhTW = { … }` (added at line 1).  
- **Default export** – `export default zhTW;` (added at line 272).  
- **Translation coverage** – The object contains sections such as `common`, `projectOverview`, `nodeInfo`, `fileExplorer`, `filterPanel`, `personaSelector`, `sidebar`, `mobile`, `drawer`, `domainView`, `detailLevel`, `nodeTypeLabels`, `tokenGate`, `diffToggle`, `learnPanel`, `layer`, `breadcrumb`, `warningBanner`, `themePicker`, `codeViewer`, `customNode`, `ariaLabels`, `nodeTypeFilter`, `keyboardShortcuts`, `search`, `export`, `edgeLabels`, `pathFinder`.  
- No other files were modified; the diff consists solely of this new file.

### Impact  
- **Feature** – Enables the graph‑view UI to be displayed in Traditional Chinese once the locale is registered.  
- **Integration** – The locale must be added to the i18n registry; otherwise it will not appear as an option.  
- **Build** – Adding a TypeScript file increases the bundle size by a few kilobytes (exact size unknown from the diff).  
- **Testing** – Unit tests that load locales should include `zhTW` to verify that all keys are present.

### Risks & follow‑ups  
- **Missing registration** – If `zhTW` is not added to the locale registry, the UI will default to another language. (unknown from the available diff/scan evidence)  
- **Translation accuracy** – Manual review of key strings (e.g., `noGraphLoaded`, `focus`, `edgeLabels`) is recommended to ensure correctness.  
- **Edge‑label consistency** – The nested `imports`, `exports`, etc., must match existing edge‑label keys; a mismatch could break rendering. (unknown from the available diff/scan evidence)  
- **Build lint** – Run `npm run lint` and `npm run build` to confirm the new file passes TypeScript checks. (unknown from the available diff/scan evidence)
