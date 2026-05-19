### Overview  
A new file `packages/graph-core/src/languages/language-registry.ts` introduces a `LanguageRegistry` class that stores language configurations and provides lookup by ID, file extension, or filename.

### Key changes  
- **Imports added** (`R1‑R6`): `LanguageConfigSchema`, `LanguageConfig`, and helper functions from `./configs/index.js`.  
- **`LanguageRegistry` class** (`R12‑R67`):  
  - Three `Map`s: `byId`, `byExtension`, `byFilename`.  
  - `register(config)` parses with `LanguageConfigSchema`, normalizes extensions (adds a leading dot if missing), lower‑cases filenames, and populates the maps.  
  - Query helpers: `getById`, `getByExtension`, `getForFile`, `getAllLanguages`.  
  - Static `createDefault()` builds a registry pre‑loaded with all built‑in configs via `languageConfigsForRegistry(detailedLanguageConfigs)`.

### Impact  
- **Centralized lookup**: all language config resolution is now in one place.  
- **Performance**: `Map` gives O(1) lookups; extension normalization ensures consistent keys.  
- **Maintainability**: registration logic is isolated, easing future updates.  
- **Compatibility**: the new file is additive; no existing APIs are changed, so current code should compile unchanged.

### Risks & follow‑ups  
- Verify that `languageConfigsForRegistry` returns all configs; missing entries will break `createDefault()`.  
- Ensure extension normalization matches callers’ expectations (e.g., `.ts` vs `ts`).  
- Test `getForFile` with edge cases: files without extensions, mixed‑case names, Docker‑compose style names.  
- Confirm that the registry is imported and used where needed; otherwise legacy lookup paths may remain.
