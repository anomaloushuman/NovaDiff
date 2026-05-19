### Overview  
A new file `packages/graph-core/src/languages/catalog-builder.ts` is added.  
It exports helpers that build `LanguageConfig` objects from the generated `alphabeticalCatalogEntries`.

### Key changes  
- **Imports** (R1‑R3)  
  - `LanguageConfig` from `./types.js`  
  - `LanguageCatalogEntry` from `./catalog-types.js`  
  - `alphabeticalCatalogEntries` from `./alphabetical-catalog.generated.js`  
- **`EMPTY_FILE_PATTERNS`** (lines 5‑10) supplies default empty arrays for `entryPoints`, `barrels`, `tests`, and `config`.  
- **`catalogEntryToLanguageConfig`** (lines 12‑27) converts a `LanguageCatalogEntry` to a `LanguageConfig`, copying `id`, `displayName`, `extensions`, and adding `filenames` and `treeSitter` when present.  
- **`buildAlphabeticalLanguageConfigs`** (lines 29‑31) maps all catalog entries to configs.  
- **`listAlphabeticalLanguages`** (lines 33‑45) returns a read‑only array of `{ id, displayName, extensions, hasTreeSitter }` for UI use.

### Impact  
- Centralizes configuration construction; other modules can import the exported helpers.  
- No changes to existing public APIs; the new helpers are additive.  
- The implementation uses straightforward array mapping, so runtime cost is minimal for typical catalog sizes.

### Risks & follow‑ups  
- Verify that `alphabeticalCatalogEntries` is correctly generated; missing entries would produce empty configs.  
- Ensure `catalogEntryToLanguageConfig` handles optional `wasmsFile` and `filenames`; unit tests should cover edge cases.  
- Confirm that `hasTreeSitter` flag matches downstream UI expectations.  
- Run lint, tests, and production build to catch any type or import errors introduced by the new file.
