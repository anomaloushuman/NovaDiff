### Overview
New file `packages/graph-view/src/contexts/I18nContext.tsx` adds a lightweight i18n context for the graph‑view package.

### Key changes
- Imports: `createContext, useContext, useMemo, ReactNode` from `react` (line 1) and `getLocale, resolveLocaleKey, Locale, LocaleKey` from `../locales` (line 2).  
- `interface I18nContextValue` (lines 4‑7) defines `locale`, `localeKey`, and `t`.  
- `I18nContext` created with `createContext<I18nContextValue | null>(null)` (line 10).  
- `useI18n` hook (lines 12‑18) throws if the provider is missing.  
- `I18nProvider` component (lines 20‑44) accepts optional `language` and `children`.  
- Inside the provider: `localeKey` memoized via `resolveLocaleKey(language)` (line 27); `locale` memoized via `getLocale(localeKey)` (line 28).  
- Provider value: `{ locale, localeKey, t: locale }` (lines 32‑34).

### Impact
- The hook guarantees a context value, throwing when used outside `I18nProvider`.  
- Locale logic is centralized, reducing duplication.  
- Memoization limits recomputation when `language` or `locale` does not change.  
- Components must be wrapped in `I18nProvider` to access `useI18n`.

### Risks & follow‑ups
- Verify all consumers of `useI18n` are inside an `I18nProvider`; otherwise an error will surface.  
- Ensure `getLocale` and `resolveLocaleKey` return consistent results for the optional `language` prop; mismatches could break translation lookup.  
- Test that the `t` field (currently set to `locale`) behaves as intended in downstream components.  
- Confirm that the new context does not cause unnecessary re‑renders when `children` change but locale remains the same.
