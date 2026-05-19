### Overview  
`packages/graph-core/src/index.ts` is a new entry point that re‑exports the public surface of the graph‑core package. The file was added in the diff (lines 1‑126) and pulls in types, persistence helpers, schema utilities, plugins, analyzers, search, staleness logic, layer detection, tour generation, language lessons, registry, language configs, parsers, ignore utilities, and starter ignore file generation.

### Key changes  
- Added re‑exports for `./types.js` and `./persistence/index.js`.  
- Exposed `KnowledgeGraphSchema`, `validateGraph`, `sanitizeGraph`, `autoFixGraph`, `COMPLEXITY_ALIASES`, `DIRECTION_ALIASES`, and related types from `./schema.js`.  
- Re‑exported `TreeSitterPlugin`, `LanguageExtractor`, and `builtinExtractors` from the plugins tree.  
- Made the analyzer surface available: `GraphBuilder`, LLM prompts/response parsers, normalization helpers, and search engine types.  
- Added staleness utilities (`getChangedFiles`, `isStale`, `mergeGraphUpdate`).  
- Included layer detection, tour generation, and language‑lesson analyzers.  
- Exported registry and language config APIs (`LanguageRegistry`, `FrameworkRegistry`, etc.).  
- Added parser registry (`MarkdownParser`, `YAMLConfigParser`, …) and ignore utilities (`createIgnoreFilter`, `generateStarterIgnoreFile`).

### Impact  
- **Convenience**: Consumers can import any core API from a single path (`import { validateGraph } from 'graph-core'`).  
- **Tree‑shaking**: Re‑exports are static; bundlers can prune unused symbols.  
- **Build size**: Slightly larger entry point, but no runtime overhead.  
- **Type safety**: All exported types are now part of the public API surface, improving IDE support.

### Risks & follow‑ups  
- **Missing modules**: Verify that every re‑exported file exists and compiles; a missing file will break the build.  
- **Circular dependencies**: Ensure that the new re‑exports do not introduce cycles that could cause runtime errors.  
- **API surface expansion**: Document the new public symbols so downstream projects know what is available.  
- **Compatibility**: Since this is a new file, existing consumers are unaffected, but any future migration to this entry point should be tested for type mismatches.
