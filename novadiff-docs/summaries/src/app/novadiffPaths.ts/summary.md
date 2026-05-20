### Overview  
A new module `src/app/novadiffPaths.ts` defines a constant and a helper function for paths reserved for Novadiff documentation. The comment on line 1 notes that the value must match `NOVADIFF_DOCS_DIR` in `cli/src/main.rs`.

### Key changes  
- **Line 2** – `export const NOVADIFF_DOCS_REL = "novadiff-docs";`  
- **Line 4** – `export function isNovadiffDocsReservedPath(rel: string | null | undefined): boolean`  
- **Lines 8‑9** – The function normalises backslashes to forward slashes and returns `true` if the path equals `NOVADIFF_DOCS_REL` or starts with `novadiff-docs/`.  
- **Lines 5‑7** – Handles `null` or empty strings by returning `false`.

### Impact  
- **Correctness** – Centralises the reserved‑docs path, reducing duplicated string literals.  
- **Maintainability** – Future changes to the docs directory require editing only this file.  
- **Compatibility** – Adds exports without altering existing APIs.  
- **Observability** – The function can be unit‑tested to confirm alignment with the Rust constant.

### Risks & follow‑ups  
- Verify that `NOVADIFF_DOCS_REL` matches the Rust `NOVADIFF_DOCS_DIR` value; a mismatch will affect routing.  
- Add unit tests for `isNovadiffDocsReservedPath` covering `null`, empty, relative, and absolute paths.  
- Ensure linting and TypeScript compilation succeed with the new file.
