### Overview  
The `electron/code-city-model.cjs` module now imports Node’s `path` module (added at line 3) and extends `buildSideNodes` to emit a synthetic file‑level symbol when a file has no explicit symbols (added lines 113‑131). This ensures every file appears in the CodeCity model.

### Key changes  
- `const path = require("path");` added at the top of the file.  
- In `buildSideNodes`, after retrieving `symbolEntries`, a guard `if (symbolEntries.length === 0)` pushes a new symbol:  
  - `id: `${rootSide}:${relPath}:file:${path.basename(relPath)}``  
  - `name: path.basename(relPath)`  
  - `kind: "file"`  
  - `startLine: 1`, `endLine: lineCount` (where `lineCount` is `Math.max(1, Number(file?.line_count ?? 0))`)  
  - `lineCount`, `changeState`, `dominantAuthor`, and `owners` are inherited from the file’s blame data.  
- The synthetic symbol is added only when no real symbols exist for the file.

### Impact  
- **Completeness**: Guarantees a node for every file, preventing missing entries in visualizations.  
- **No API change**: The payload shape returned by `buildCodeCityModelPayload` remains the same.  
- **Minimal runtime cost**: Uses only Node’s core `path` module and a single `path.basename` call per file.

### Risks & follow‑ups  
- **Duplicate symbols**: Verify that the synthetic symbol does not collide with an existing symbol when a file actually contains symbols.  
- **Performance**: The added `path.basename` call is trivial, but benchmark on large outlines if needed.  
- **Linting**: Run `npm run lint` to confirm the new import satisfies style rules.  
- **Testing**: Add unit tests for `buildSideNodes` covering the empty‑symbol case.
