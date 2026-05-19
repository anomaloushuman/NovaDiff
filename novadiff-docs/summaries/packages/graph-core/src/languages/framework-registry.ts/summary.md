### Overview  
A new file `packages/graph-core/src/languages/framework-registry.ts` (lines R1‑86) introduces the `FrameworkRegistry` class, centralizing framework configuration handling.

### Key changes  
- **Imports (R1‑R3)** – `FrameworkConfigSchema`, `FrameworkConfig` type, and `builtinFrameworkConfigs` are imported.  
- **Class export (R9)** – `export class FrameworkRegistry` is added.  
- **Internal maps (R10‑R11)** – `byId` and `byLanguage` `Map`s store configurations.  
- **`register` method (R13‑R26)** – validates configs via `FrameworkConfigSchema`, skips duplicates, and indexes languages.  
- **Lookup helpers (R28‑R38)** – `getById`, `getForLanguage`, and `getAllFrameworks` expose read‑only views.  
- **`detectFrameworks` (R40‑R74)** – scans a manifest map, matches filenames, and checks detection keywords case‑insensitively.  
- **Static factory (R76‑R85)** – `createDefault` registers all `builtinFrameworkConfigs`.

### Impact  
- **Correctness** – Schema validation and duplicate guard prevent malformed or repeated entries.  
- **Maintainability** – A single registry simplifies adding or updating framework configs.  
- **Performance** – Map lookups and a single-pass detection keep runtime linear in the number of configs and manifests.  
- **Observability** – No new logs; registry state can be inspected via public methods.

### Risks & follow‑ups  
- `builtinFrameworkConfigs` must contain all expected entries; missing configs will silently fail detection.  
- `detectFrameworks` performs case‑insensitive keyword matching; test with mixed‑case manifests to confirm.  
- Duplicate registration is silently ignored; consider emitting a warning if needed.  
- Run the existing test suite and linting to ensure imports and type resolution work.
