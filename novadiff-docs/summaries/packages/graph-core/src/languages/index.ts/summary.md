### Overview  
A new file `packages/graph-core/src/languages/index.ts` (lines R1‑R27) has been added. It re‑exports language‑related types, schemas, registries, and built‑in configurations.

### Key changes  
- **Type re‑exports** (R2‑R6): `LanguageConfig`, `TreeSitterConfig`, `FilePatternConfig`, `FrameworkConfig` from `./types.js`.  
- **Schema re‑exports** (R9‑R14): `LanguageConfigSchema`, `TreeSitterConfigSchema`, `FilePatternConfigSchema`, `FrameworkConfigSchema` from `./types.js`.  
- **Registry exports** (R17‑R18): `LanguageRegistry` from `./language-registry.js`, `FrameworkRegistry` from `./framework-registry.js`.  
- **Built‑in language configs** (R21‑R25): `builtinLanguageConfigs`, `detailedLanguageConfigs`, `listAlphabeticalLanguages` from `./configs/index.js`.  
- **Built‑in framework configs** (R26): `builtinFrameworkConfigs` from `./frameworks/index.js`.  
- **Catalog type export** (R27): `LanguageCatalogEntry` from `./catalog-types.js`.

### Impact  
- Consumers can import these symbols directly from `graph-core/languages`.  
- No breaking changes; only new exports are added.  
- The file contains only re‑exports, so runtime impact is none.

### Risks & follow‑ups  
- **Import regressions**: unknown from the available diff/scan evidence. Verify that existing modules still resolve symbols after the change.  
- **Duplicate symbol names**: unknown from the available diff/scan evidence. Ensure no naming collisions with other modules.  
- **Build inclusion**: unknown from the available diff/scan evidence. Confirm the file is compiled and bundled correctly.  
- **Linting & tests**: run `npm run lint`, `npm test`, and `npm run build` to catch any subtle type or import errors.
