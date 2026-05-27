# Release overview

**Baseline:** 9aadd5eb5604

**Target:** NovaDiff

## Readiness signals

| Signal | Count |
| --- | --- |
| Changed files | 71 |
| Saved file summaries | 62 |
| Saved selection docs | 3 |
| High-risk signals | 1 |
| Medium-risk signals | 4 |
| Low-risk signals | 0 |

## Confidence badges

- **Strong summary coverage**: Most changed files have saved summaries available for grounding the narrative.
- **High-risk signals present**: At least one deterministic high-severity signal was detected in the compare.
- **Focused selection docs available**: Reviewers saved line- or symbol-scoped documentation that can ground the broader report.
- **Heuristic scan data**: Imports, calls, and symbol spans come from bounded heuristics rather than a full AST index.

## Top changed files

- **modified** `.novadiff-graph/diff-overlay.json`
- **modified** `.novadiff-graph/knowledge-graph.json`
- **modified** `.novadiff-graph/meta.json`
- **modified** `cli/src/main.rs`
- **modified** `electron/code-city-model.cjs`
- **modified** `electron/git-service.cjs`
- **modified** `electron/knowledge-graph-runner.cjs`
- **modified** `electron/main.cjs`
- **modified** `electron/preload.cjs`
- **added** `electron/security-scan-runner.cjs`
- **modified** `electron/workspace-history.cjs`
- **modified** `package-lock.json`
- **modified** `package.json`
- **modified** `packages/graph-core/src/analyzer/graph-builder.test.ts`
- **modified** `packages/graph-core/src/analyzer/graph-builder.ts`
- **modified** `packages/graph-core/src/ignore-filter.ts`
- **modified** `packages/graph-view/src/App.tsx`
- **modified** `packages/graph-view/src/GraphEmbedSyncBridge.tsx`
- **modified** `packages/graph-view/src/NovaDiffGraphExplorer.tsx`
- **modified** `packages/graph-view/src/NovaDiffGraphExplorerEmbed.tsx`

## Deterministic risk review

### High severity

- **Potential Rust lifetime leak pattern in `cli/src/main.rs`** (`cli/src/main.rs`)
  - R1313 added: let matches = text.contains("Box::leak(")
  - R1314 added: || text.contains("mem::forget(")
  - R1315 added: || text.contains("ManuallyDrop::new(");

### Medium severity

- **Config-adjacent file touched: `vite.config.ts`** (`vite.config.ts`)
  - Configuration or environment behavior may change across deploy targets.
- **Dependency manifest modified in `package.json`** (`package.json`)
  - Dependency manifest files can change install/build behavior.
  - Change kind: modified
- **Lockfile modified in `package-lock.json`** (`package-lock.json`)
  - Resolved dependency versions may have changed.
  - Change kind: modified
- **Potentially incomplete implementation in `cli/src/main.rs`** (`cli/src/main.rs`)
  - R1334 incomplete stub: let looks_incomplete = low.contains("todo!")
  - R1335 incomplete stub: || low.contains("todo(")
  - R1336 incomplete stub: || low.contains("notimplemented")

### Low severity

_None detected._

## Summary rollup

### `.novadiff-graph/diff-overlay.json`

### Overview The file **`.novadiff-graph/diff-overlay.json`** was deleted. It previously stored JSON metadata with keys `"changedFiles"`, `"changedNodeIds"`, `"affectedNodeIds"`, and a timestamp. ### Key changes - Entire file removed (lines 1‑430 deleted). - No other code changes appear in this diff. ### Impact - Any component or service that reads this file will throw a file‑not‑found error unless it is guarded. - Tests that assert the file’s existence or its contents will fail. - The removal eliminates the overh…

### `.novadiff-graph/knowledge-graph.json`

_Truncated diff_

### Overview The file `.novadiff-graph/knowledge-graph.json` was deleted entirely (lines L1‑8000). All graph data—including metadata, node entries for files, functions, classes, and symbol spans—was removed. Consequently, any references to Electron modules, language‑lesson logic, extractor implementations, and persistence utilities that were stored in this file are no longer present. ### Key changes - The entire knowledge‑graph file was removed. - All nodes stored in the graph (functions, files, classes, symbol sp…

### `.novadiff-graph/meta.json`

### Overview The file `.novadiff-graph/meta.json` was modified. - Line 2: `lastAnalyzedAt` was updated. - Line 5: `analyzedFiles` was updated. ### Key changes - `lastAnalyzedAt` changed from `2026-05-26T01:49:38.223Z` to `2026-05-26T07:21:38.024Z` (diff: L2 → R2). - `analyzedFiles` increased from `352` to `373` (diff: L5 → R5). - No other fields were altered. ### Impact - Any code that reads this JSON will now see the new timestamp and file count. - If consumers cache based on `lastAnalyzedAt`, earlier caches may…

### `electron/code-city-model.cjs`

_Touched symbols found · Import/export surface changed_

### Overview The `electron/code-city-model.cjs` module now imports Node’s `path` module (added at line 3) and extends `buildSideNodes` to emit a synthetic file‑level symbol when a file has no explicit symbols (added lines 113‑131). This ensures every file appears in the CodeCity model. ### Key changes - `const path = require("path");` added at the top of the file. - In `buildSideNodes`, after retrieving `symbolEntries`, a guard `if (symbolEntries.length === 0)` pushes a new symbol: - `id: `${rootSide}:${relPath}:f…

### `electron/git-service.cjs`

_Touched symbols found_

### Overview The `electron/git-service.cjs` file was extended with new Git‑output parsing helpers and tooling detection. The changes add several functions (see line ranges R237‑248, R250‑269, R271‑311, R314‑330, R332‑335, R337‑344) and expose them via `module.exports` (R346‑365). ### Key changes - **`splitGitFormatLine`** (R237‑248): splits a string by `\x1f`, tab, or `%x1f`, falling back to the raw line. - **`parseLogLines`** (R250‑269): uses `splitGitFormatLine` to turn `git log` output into `{hash, shortHash, s…

### `electron/knowledge-graph-runner.cjs`

_Touched symbols found_

### Overview The `electron/knowledge-graph-runner.cjs` file was modified to refine project‑file traversal logic. ### Key changes - `SKIP_DIRS` now contains `"venv"`, `".venv"`, and `".venv-main"` (added at R32‑R34). - In `walkProjectFiles`, the guard was updated to skip any entry whose name starts with `".venv"` in addition to the existing `SKIP_DIRS` check (added at R162‑R165). - The previous isolated guard `if (SKIP_DIRS.has(entry.name))` was removed (L159). - Exclusion logic for `"site-packages"` remains unchan…

### `electron/preload.cjs`

### Overview The preload script `electron/preload.cjs` now exposes four new IPC helpers. They are added at lines 45‑46 and 152‑155 and use the same `ipcRenderer.invoke` pattern as the existing API. ### Key changes - `scanSecurityInsights(payload)` – lines 45‑46 – invokes `"security-insights-scan"`. - `gitListBranches(payload)` – lines 152‑152 – invokes `"git-list-branches"`. - `gitListBranchCommits(payload)` – lines 153‑153 – invokes `"git-list-branch-commits"`. - `workspaceMaterializeCommit(payload)` – lines 154‑…

### `electron/security-scan-runner.cjs`

_Touched symbols found · Import/export surface changed_

### Overview A new module `electron/security-scan-runner.cjs` is added, exposing `runSecurityInsightScan`. It orchestrates multi‑ecosystem vulnerability scans (OSV, npm, pip, cargo, govulncheck, bundle‑audit) and aggregates results into a unified signal list. ### Key changes - **Imports**: `fs`, `path`, `child_process.spawnSync`, `crypto` added at the top (lines 1‑6). - **Utility helpers**: `severityFromAdvisory`, `confidenceFromSeverity`, `hashId`, `relPathFromRoot` (lines 8‑26). - **Repository traversal**: `walk…

### `electron/workspace-history.cjs`

_Touched symbols found · Import/export surface changed_

### Overview `electron/workspace-history.cjs` now imports two additional helpers from `git-service.cjs` (`listBranches`, `listCommitsForRef`) and introduces a new function, `materializeCommitForCompare`. This helper resolves a Git ref or hash to a snapshot path, creating the snapshot if it does not already exist. The module’s export list is updated to expose the new function and the two imported helpers. ### Key changes - **Import expansion** – line 6 now pulls `listBranches` and `listCommitsForRef` from `git-serv…

### `package.json`

_Dependency manifest changed_

### Overview The `package.json` in the `NovaDiff` branch updates the Electron runtime and its builder. Electron is bumped from `^34.2.0` (removed at L56) to `^42.2.0` (added at R56). Electron‑builder is bumped from `^25.1.8` (removed at L57) to `^26.8.1` (added at R57). No other dependencies were modified. ### Key changes - **Electron runtime** – line 56 now requires `electron@^42.2.0`. - **Electron‑builder** – line 57 now requires `electron-builder@^26.8.1`. - The `build` script (`"electron:build": "npm run rust:…

### `packages/graph-core/src/analyzer/graph-builder.test.ts`

_Test-related file_

### Overview A new test in `packages/graph-core/src/analyzer/graph-builder.test.ts` (lines 363‑387) confirms that `GraphBuilder` now disambiguates duplicate function names within the same file by appending the function’s start line number to the node ID. ### Key changes - **Function ID generation** – When a file contains two functions with the same name, the second receives an ID suffix of its start line (`:30` in the test). - **Duplicate detection** – The builder tracks seen function names per file and applies th…

### `packages/graph-core/src/analyzer/graph-builder.ts`

_Touched symbols found_

### Overview `GraphBuilder` now ensures every node has a unique identifier. A new helper `uniqueNodeId` (lines 84‑109) builds deterministic IDs that optionally include a line number and, if needed, a numeric suffix to avoid collisions. Node‑creation methods have been updated to use this helper, and file nodes are now added only if the ID is not already present (lines 146‑157). ### Key changes - **`uniqueNodeId`** – generates collision‑free IDs (lines 84‑109). - **`addFileWithAnalysis`** – checks `this.nodeIds.has(…

## Focused reviewer notes

- `electron/workspace-history.cjs` — Code explanation (L80-98)
- `package.json` — Code explanation (L23-45)
- `package.json` — Code explanation (L46-63)

## Advisory enrichment status

No advisory findings were attached. Baseline confidence remains derived from deterministic offline signals.