### Overview  
`packages/graph-core/src/languages/types.ts` now defines Zod schemas for language and framework configuration objects.  
The file adds an import of `z` from **zod** (line 1) and exports several schemas and inferred types (lines 8‑68).  

### Key changes  
- **Import**: `import { z } from "zod"` (R1).  
- **Tree‑sitter config**:  
  - `TreeSitterConfigSchema` – a union of two object shapes (R8‑17).  
  - `TreeSitterConfig` inferred type (R19).  
- **File pattern config**:  
  - `FilePatternConfigSchema` (R22‑27).  
  - `FilePatternConfig` inferred type (R29).  
- **Language config**:  
  - `LanguageConfigSchema` with fields `id`, `displayName`, `extensions`, optional `filenames`, optional `treeSitter`, `concepts`, and `filePatterns` (R32‑40).  
  - `LanguageConfig` inferred type (R42).  
  - `StrictLanguageConfigSchema` refines `LanguageConfigSchema` to require at least one extension or filename (R51‑54).  
- **Framework config**:  
  - `FrameworkConfigSchema` with fields `id`, `displayName`, `languages`, `detectionKeywords`, `manifestFiles`, `promptSnippetPath`, optional `entryPoints`, optional `layerHints` (R57‑66).  
  - `FrameworkConfig` inferred type (R68).  

### Impact  
- Provides **runtime validation** of config objects via Zod, catching malformed data earlier.  
- Centralizes schema definitions, reducing duplication and easing future changes.  
- Existing code that used plain TypeScript types can import the new inferred types without breaking the public API.  

### Risks & follow‑ups  
- **Missing `zod` dependency**: the package must list `zod` in its `package.json`.  
- **Unused file**: it is unknown from the diff whether the new schemas are referenced elsewhere.  
- **Test coverage**: no tests are added in this change; adding tests would confirm validation behavior.  
- **Performance**: runtime validation incurs overhead; benchmark if many configs are processed at startup.
