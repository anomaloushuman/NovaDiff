### Overview  
A new file `packages/graph-core/src/languages/merge-configs.ts` adds two exported helpers that merge hand‑authored language configs with the automatically generated alphabetical catalog.

### Key changes  
- **Imports added** (R1‑R2): `LanguageConfig` type and `buildAlphabeticalLanguageConfigs` builder.  
- **`mergeLanguageConfigs`** (R8‑R19):  
  - Builds a `Map<string, LanguageConfig>` from `buildAlphabeticalLanguageConfigs()` (R10‑R12).  
  - Overwrites entries with the detailed array (R13‑R15).  
  - Returns the values sorted by `displayName` using `localeCompare` with `"en"` and base sensitivity (R16‑R18).  
- **`languageConfigsForRegistry`** (R22‑R27):  
  - Calls `mergeLanguageConfigs` (R24).  
  - Separates catalog‑only entries from detailed ones (R25‑R26).  
  - Returns `[...catalogOnly, ...detailed]` to preserve registration order (R27).  

Both functions are exported (R8, R22).

### Impact  
- **Correctness**: Detailed configs override catalog entries on ID collision and the final list is alphabetically sorted by `displayName`.  
- **Maintainability**: Centralizes merging logic; future changes to catalog generation or merging rules can be made in one place.  
- **Performance**: Uses a single `Map` traversal and a final sort, yielding O(n log n) complexity.

### Risks & follow‑ups  
- **Ordering**: `localeCompare` with `"en"` base sensitivity may produce unexpected order for names with diacritics.  
- **Duplicate IDs**: If the catalog builder emits duplicate IDs, they could be silently overridden by detailed configs.  
- **Test coverage**: Add unit tests for overlapping IDs, empty detailed lists, and large catalogs.  
- **Build integration**: Verify that the new file is included in the TypeScript compilation and that its imports resolve in all target environments.
