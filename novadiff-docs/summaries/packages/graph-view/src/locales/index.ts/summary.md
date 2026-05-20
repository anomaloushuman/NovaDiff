### Overview  
A new module `packages/graph-view/src/locales/index.ts` (lines R1‑32) introduces locale definitions and lookup utilities.

### Key changes  
- **Imports**: `en`, `zh`, `zhTW`, `ja`, `ko` (R1‑R5).  
- **Types**: `LocaleKey` enumerates supported keys (R7); `Locale` is inferred from `en` (R8).  
- **Locale map**: `locales` records each key to its locale object (R10‑R16).  
- **Lookup**: `getLocale(key)` returns the locale or falls back to `en` (R18‑R20).  
- **Normalization**: `resolveLocaleKey(lang)` normalizes language strings to a `LocaleKey` (R22‑R29).  
- **Re‑exports**: individual locales are re‑exported, aliasing `zhTW` as `"zh-TW"` (R32).

### Impact  
- Centralizes locale handling, simplifying future additions.  
- Provides type safety for locale keys.  
- O(1) lookup via the `locales` map; normalization uses lightweight string ops.

### Risks & follow‑ups  
- Verify that the `zhTW` alias correctly resolves to `"zh-TW"` in imports and consumers.  
- Add unit tests for `resolveLocaleKey` covering edge cases (e.g., `"zh_cn"`, `"ja-JP"`).  
- Ensure `getLocale`’s fallback to `en` behaves as expected when an unknown key is passed.  
- Check for potential circular dependencies introduced by re‑exporting locale modules.
