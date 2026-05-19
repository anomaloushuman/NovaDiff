### Overview  
A new file `packages/graph-view/src/locales/index.ts` (lines R1‑R32) introduces a lightweight locale system for the graph‑view module. It imports JSON locale files, defines a `LocaleKey` union, exposes a `Locale` type, and provides helper functions to retrieve and resolve locales.

### Key changes  
- **Imports** (R1‑R5)  
  ```ts
  import en from "./en";
  import zh from "./zh";
  import zhTW from "./zh-TW";
  import ja from "./ja";
  import ko from "./ko";
  ```
- **Types** (R7‑R8)  
  ```ts
  export type LocaleKey = "en" | "zh" | "zh-TW" | "ja" | "ko";
  export type Locale = typeof en;
  ```
- **Locale map** (R10‑R16)  
  ```ts
  export const locales: Record<LocaleKey, Locale> = {
    en,
    zh,
    "zh-TW": zhTW,
    ja,
    ko,
  };
  ```
- **Accessor** (R18‑R20)  
  ```ts
  export function getLocale(key: LocaleKey): Locale {
    return locales[key] ?? locales.en;
  }
  ```
- **Resolver** (R22‑R29)  
  ```ts
  export function resolveLocaleKey(lang: string | undefined): LocaleKey {
    if (!lang) return "en";
    const normalized = lang.toLowerCase().replace(/[_\s]/g, "-");
    if (normalized === "zh" || normalized === "chinese" || normalized === "zh-cn") return "zh";
    if (normalized === "zh-tw" || normalized === "traditional-chinese") return "zh-TW";
    if (normalized === "ja" || normalized === "japanese") return "ja";
    if (normalized === "ko" || normalized === "korean") return "ko";
    return "en";
  }
  ```
- **Re‑exports** (R32)  
  ```ts
  export { en, zh, zhTW as "zh-TW", ja, ko };
  ```

### Impact  
- Centralizes locale definitions and resolution logic, simplifying future language additions.  
- Provides deterministic lookup with a clear fallback to `en`.  
- No existing code is altered; consumers must import from the new path to use the locale system.

### Risks & follow‑ups  
- **Missing locale files**: Verify that `en.json`, `zh.json`, `zh-TW.json`, `ja.json`, and `ko.json` exist and export valid objects.  
- **Alias correctness**: Ensure that `zhTW as "zh-TW"` re‑export works for downstream consumers.  
- **Resolver edge cases**: Add tests for uncommon language strings (e.g., `"zh_cn"`, `"japanese"`) to confirm mapping.  
- **Type safety**: Run the TypeScript compiler to confirm that `LocaleKey` and `Locale` types are inferred correctly across the repo.
