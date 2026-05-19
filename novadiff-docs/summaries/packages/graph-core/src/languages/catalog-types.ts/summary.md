### Overview  
A new file `packages/graph-core/src/languages/catalog-types.ts` has been added. It declares and exports the `LanguageCatalogEntry` interface, which defines the shape of catalog entries used for language support.

### Key changes  
- **Exported interface** `LanguageCatalogEntry` (lines 1‑7).  
- Required properties:  
  - `id: string` – unique identifier.  
  - `displayName: string` – human‑readable name.  
  - `extensions: string[]` – list of file extensions.  
- Optional properties:  
  - `wasmsFile?: string` – path to a WebAssembly module.  
  - `filenames?: string[]` – specific file names associated with the language.  

### Impact  
- The interface is now available to other modules via the export statement.  
- No JavaScript runtime code is added; the change is purely type‑level.  
- Linting will flag any unused imports of this interface.  
- The build output will include the new file; run `npm run build` to confirm inclusion.  

### Risks & follow‑ups  
- **Unused export**: Verify that imports of `LanguageCatalogEntry` are actually used; otherwise, linting will report unused variables.  
- **Integration**: Modules that consume catalog entries should import this interface to maintain type consistency.  
- **Test coverage**: Unknown from the available diff/scan evidence whether tests need updating to construct `LanguageCatalogEntry` objects.  
- **Build consistency**: Ensure the new file is compiled by running the repository’s build commands.
