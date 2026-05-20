### Overview  
A new Node script `packages/graph-core/scripts/generate-alphabetical-catalog.mjs` (added at R1‑R5) reads `language-names.txt`, normalizes language names, resolves file extensions and tree‑sitter WASM files, and writes a TypeScript module `../src/languages/alphabetical-catalog.generated.ts` containing a sorted array of `LanguageCatalogEntry` objects.

### Key changes  
- **Imports** (`R6‑R8`): `fs`, `path`, and `url` modules are required to locate the input and output files.  
- **Normalization helpers** (`R182‑R216`): `normalizeKey` trims and normalizes display names, handling special cases such as “c++”, “objective‑c”, and “webassembly”.  
- **Slug generation** (`R217‑R232`): `slugify` creates unique identifiers, avoiding collisions via a `used` set.  
- **WASM resolution** (`R233‑R262`): `resolveWasmsKey` maps normalized keys to WASM filenames using an alias table.  
- **Extension resolution** (`R263‑R281`): `resolveExtensions` looks up extensions from `EXT_BY_KEY`, with a fallback that scans keys containing the display name.  
- **Extension claiming** (`R282‑R291`): `claimExtensions` ensures each extension appears only once across all entries.  
- **Entry construction** (`R293‑R300`): For each language, an object with `id`, `displayName`, `extensions`, and optional `wasmsFile` is built.  
- **Output generation** (`R312‑R322`): The sorted entries are formatted into a TypeScript module and written to `../src/languages/alphabetical-catalog.generated.ts`.

### Impact  
- **Build pipeline**: The generated file must be included in the TypeScript build; the CI or build scripts should run this generator before compiling.  
- **Runtime**: No direct runtime changes; the script is a build‑time helper.  
- **Maintainability**: Centralizes language metadata generation, reducing manual edits to the catalog.

### Risks & follow‑ups  
- **Normalization correctness**: unknown from the available diff/scan evidence.  
- **Slug uniqueness**: unknown from the available diff/scan evidence.  
- **WASM mapping**: unknown from the available diff/scan evidence.  
- **Build integration**: unknown from the available diff/scan evidence.
