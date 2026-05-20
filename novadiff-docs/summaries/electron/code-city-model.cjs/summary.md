### Overview  
`electron/code-city-model.cjs` is a new CommonJS module that builds a Code‑City model payload from two project outlines. It adds utilities for normalizing side names, determining dominant authors, mapping blame data, and assembling file and symbol nodes.

### Key changes  
- **`normalizeSide` (lines 5‑7)** – normalizes `"baseline"` or `"target"` strings, defaulting to `"target"`.  
- **`dominantAuthor` (lines 9‑11)** – returns the first author in an owners array or `null`.  
- **`ownershipForRange` (lines 13‑35)** – counts author line‑counts for a given range and returns up to six top owners.  
- **`selectBlamePaths` (lines 38‑54)** – sorts file paths by change kind and size, then limits to 140 entries.  
- **`buildBlameMap` (lines 57‑62)** – creates a map of relative paths to blame ownership using `blameFileOwnership`.  
- **`buildSymbolFileIndex` (lines 65‑77)** – indexes symbol spans by file path.  
- **`buildSideNodes` (lines 79‑139)** – constructs file and symbol node arrays for a side, aggregating authors and dominant authors.  
- **`buildCodeCityModelPayload` (lines 142‑174)** – orchestrates outline loading, blame mapping, side node construction, and returns a payload with `generatedAt`, labels, files, symbols, and sorted authors.  
- **Import** – `const { blameFileOwnership } = require("./git-blame.cjs");` (line 3).  
- **Export** – `module.exports = { buildCodeCityModelPayload };` (line 176).

### Impact  
- **Correctness** – the module relies on well‑formed outlines; missing `symbol_spans_by_file` entries are silently ignored.  
- **Maintainability** – side‑node logic is centralized, easing future blame‑handling changes.  
- **Performance** – the implementation iterates over all files and symbols; large projects may incur higher runtime and memory usage.  
- **Compatibility** – uses CommonJS, so existing Node environments remain unaffected.

### Risks & follow‑ups  
- **Testing** – no unit tests currently cover this module; adding tests for `ownershipForRange` and `buildCodeCityModelPayload` is advisable.  
- **Error handling** – functions assume valid input; behavior with malformed outlines is undefined.  
- **Blame data size** – `buildBlameMap` loads blame for each selected path; monitor memory usage on very large repositories.  
- **Author selection** – `dominantAuthor` simply picks the first owner; confirm this aligns with business expectations.
