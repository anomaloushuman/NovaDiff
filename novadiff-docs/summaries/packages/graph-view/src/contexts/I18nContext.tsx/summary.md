### Overview  
A new i18n context module was added at `packages/graph-view/src/contexts/I18nContext.tsx`. It introduces a `useI18n` hook and an `I18nProvider` component for locale handling.

### Key changes  
- **Imports** (lines 1‑2): `createContext`, `useContext`, `useMemo`, `ReactNode` from *react*; `getLocale`, `resolveLocaleKey`, `Locale`, `LocaleKey` from `../locales`.  
- **Interface** (lines 4‑7): `I18nContextValue` exposes `locale: Locale`, `localeKey: LocaleKey`, and `t: Locale`.  
- **Context** (line 10): `I18nContext` initialized with `null`.  
- **Hook** (lines 12‑18): `useI18n()` retrieves the context and throws if called outside a provider.  
- **Provider** (lines 20‑44): accepts optional `language` and `children`, memoizes `localeKey` and `locale`, and supplies `{ locale, localeKey, t: locale }` to the context.

### Impact  
- Components must be wrapped in `I18nProvider`; otherwise `useI18n` throws an error.  
- Locale logic is centralized, simplifying future changes to language resolution.  
- `useMemo` keeps `localeKey`, `locale`, and the context value stable across renders, reducing unnecessary re‑renders.

### Risks & follow‑ups  
- `t` is currently the locale object; if a translation function is intended, the implementation should be updated.  
- Verify that `getLocale` and `resolveLocaleKey` return correct values for all supported languages.  
- Run lint, tests, and a production build to confirm no type or runtime errors.  
- Add unit tests for `useI18n` throwing behavior and provider value correctness.
