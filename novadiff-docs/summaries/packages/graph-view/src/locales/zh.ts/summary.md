### Overview  
A new file `packages/graph-view/src/locales/zh.ts` has been added.  
It contains a complete Chinese translation bundle for the graph‑view component, added in lines 1‑272 of the file.

### Key changes  
- **Locale module**: `export const zh = { … }` (lines 1‑270) defines all UI strings in Chinese.  
- **Default export**: `export default zh;` (line 272) makes the bundle consumable by the i18n loader.  
- **Coverage**: 272 key/value pairs covering common UI, project overview, node info, file explorer, filters, persona selector, sidebar, mobile, drawer, domain view, detail level, node type labels, token gate, diff toggle, learn panel, layer, breadcrumb, warning banner, theme picker, code viewer, custom node, aria labels, node type filter, keyboard shortcuts, search, export, edge labels, path finder, and more.  
- **Additive change**: No existing files were modified.

### Impact  
- **Feature**: Enables Chinese language support throughout the graph‑view UI.  
- **Build**: The new file will be compiled and bundled automatically; no extra build steps are required.  
- **Runtime**: No breaking changes; existing locales remain untouched.  
- **Testing**: Tests that assert locale keys may need to include `zh`.  
- **Documentation**: Any docs listing available locales should be updated to mention `zh`.

### Risks & follow‑ups  
- **Import**: Verify that the i18n loader imports `zh.ts` (e.g., via an index file).  
- **Key consistency**: Ensure all translation keys used in the UI are present in `zh`; missing keys will fall back to defaults.  
- **Test coverage**: Add or update tests to confirm that the `zh` bundle loads correctly and that UI components render Chinese strings.  
- **Localization pipeline**: Confirm that this new bundle is included in the deployment pipeline.
