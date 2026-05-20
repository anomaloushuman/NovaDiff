### Overview  
A new locale file `packages/graph-view/src/locales/ko.ts` has been added.  
It defines a `const ko = { … }` object containing Korean translations for the graph‑view UI and ends with `export default ko;` (line 272).

### Key changes  
- **File addition**: `packages/graph-view/src/locales/ko.ts` (lines 1‑272).  
- **Export**: The file exports the locale object as the default export.  
- **Content**: The object includes ~270 key/value pairs covering common UI text, project overview, node info, filters, and more.  
- **No other code changes**: The diff introduces only this new file.

### Impact  
- Adds Korean language support for the graph‑view component.  
- The locale follows the same shape as other language files, so it can be imported by the i18n system without further changes.  
- Existing unit tests that check locale completeness may need to include `ko`.  
- The file will be compiled by the TypeScript compiler and bundled in the production build.

### Risks & follow‑ups  
- **i18n loader configuration**: Verify that the build system automatically includes `ko.ts`; otherwise the locale may be omitted.  
- **Missing keys**: Ensure all UI keys are present in `ko`.  
- **Runtime fallback**: Confirm that the application falls back to English when the user’s locale is not Korean, preventing `undefined` strings.  
- **Documentation**: Update any README or developer docs that list supported locales to include `ko`.
