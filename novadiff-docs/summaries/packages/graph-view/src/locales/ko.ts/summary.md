### Overview  
A new locale file `packages/graph-view/src/locales/ko.ts` has been added. It defines a constant `ko` containing ~272 Korean translation strings and exports it as the default.

### Key changes  
- **File added**: `packages/graph-view/src/locales/ko.ts` (lines 1‑272).  
- **Exported constant**: `export const ko = { … };` at line 1.  
- **Default export**: `export default ko;` at line 272.  
- No existing files were modified.

### Impact  
- **Internationalization**: Korean language support is now available for the graph‑view component.  
- **Build**: The file will be bundled automatically; no script changes are required.  
- **Testing**: Tests that iterate over all locales may need to include the new `ko` locale.  
- **Documentation**: References to available locales should list Korean.

### Risks & follow‑ups  
- **Key consistency**: Verify that every key in `ko` matches the UI’s expected keys; missing keys could trigger fallbacks.  
- **Locale registration**: Ensure the application’s locale loader imports and registers `ko` (unknown from the available diff/scan evidence).  
- **Test coverage**: Add or update tests to confirm Korean strings render correctly (unknown from the available diff/scan evidence).  
- **Bundle size**: Adding a large locale file increases bundle size; monitor load times for users who never use Korean.
