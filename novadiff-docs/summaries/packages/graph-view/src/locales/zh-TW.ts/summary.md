### Overview  
A new locale file `packages/graph-view/src/locales/zh-TW.ts` has been added. It contains Traditional Chinese translations for the Graph View UI.

### Key changes  
- **Exported object**: `export const zhTW = { … }` (lines 1–270) defines all translation strings.  
- **Default export**: `export default zhTW;` (line 272) makes the object available as the module’s default.  
- The object covers common UI elements, node info, filters, panels, and edge labels.

### Impact  
- **Internationalization**: The module now provides a `zhTW` locale that can be imported by the i18n loader.  
- **Build**: The file is pure data; compilation and bundle size are unaffected.  
- **Testing**: Existing i18n tests should verify that `zhTW` contains the required keys.  
- **Documentation**: Add `zh-TW` to any locale registry or README listing supported languages.

### Risks & follow‑ups  
- **Missing keys**: Verify that every key used in the UI is present in `zhTW`; missing entries could fall back to English.  
- **Locale registration**: Ensure the new file is imported and registered in the locale configuration; otherwise the UI will not switch to Traditional Chinese.  
- **Consistency**: Run a diff against the English locale to confirm that all translations are present and correctly mapped.  
- **Performance**: No measurable impact is expected, but confirm that the added file does not trigger unnecessary re‑renders in the i18n provider.
