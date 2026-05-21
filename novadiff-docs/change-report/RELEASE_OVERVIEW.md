# Release overview

**Baseline:** f7c2bfd81af2

**Target:** NovaDiff

## Readiness signals

| Signal | Count |
| --- | --- |
| Changed files | 62 |
| Saved file summaries | 49 |
| Saved selection docs | 0 |
| High-risk signals | 0 |
| Medium-risk signals | 1 |
| Low-risk signals | 0 |

## Confidence badges

- **Partial summary coverage**: Some file-level summaries are available, but the narrative still covers unsummarized paths.
- **Deterministic risk signals available**: Risk sections can reference offline heuristic signals instead of only free-form LLM claims.
- **Heuristic scan data**: Imports, calls, and symbol spans come from bounded heuristics rather than a full AST index.

## Top changed files

- **removed** `.novadiff-graph/config.json`
- **removed** `.novadiff-graph/diff-overlay.json`
- **removed** `.novadiff-graph/knowledge-graph.json`
- **removed** `.novadiff-graph/meta.json`
- **added** `electron/export-snapshot.cjs`
- **added** `electron/git-commit.cjs`
- **modified** `electron/git-publish.cjs`
- **modified** `electron/git-service.cjs`
- **added** `electron/github-commit-context.cjs`
- **modified** `electron/github-service.cjs`
- **modified** `electron/llm.cjs`
- **modified** `electron/main.cjs`
- **modified** `electron/novadiff-docs-html.cjs`
- **modified** `electron/prefetch-summaries.cjs`
- **modified** `electron/preload.cjs`
- **modified** `electron/workspace-history.cjs`
- **modified** `electron/workspace-store.cjs`
- **modified** `packages/graph-view/src/App.tsx`
- **added** `packages/graph-view/src/GraphEmbedSyncBridge.tsx`
- **modified** `packages/graph-view/src/NovaDiffGraphExplorer.tsx`

## Deterministic risk review

### High severity

_None detected._

### Medium severity

- **Config-adjacent file touched: `vite.config.ts`** (`vite.config.ts`)
  - Configuration or environment behavior may change across deploy targets.

### Low severity

_None detected._

## Summary rollup

### `.novadiff-graph/config.json`

### Overview The file `./.novadiff-graph/config.json` has been removed from the repository. It previously contained two configuration flags: `autoUpdate` and `outputLanguage`. ### Key changes - Entire file `./.novadiff-graph/config.json` deleted (lines 1‑4 removed). - The `autoUpdate` flag (`false`) and `outputLanguage` (`"en"`) are no longer persisted. ### Impact - Any code that previously parsed this JSON will no longer find the file, potentially causing a file‑not‑found error unless guarded. - Tests that mock o…

### `.novadiff-graph/diff-overlay.json`

### Overview The file `.novadiff-graph/diff-overlay.json` has been deleted entirely (lines 1‑156). It previously stored metadata for the diff overlay, including the version, base branch, generation timestamp, lists of changed files, changed node IDs, and affected node IDs. ### Key changes - Removal of the JSON file at `.novadiff-graph/diff-overlay.json`. - All persisted data (`"changedFiles"`, `"changedNodeIds"`, `"affectedNodeIds"`) is no longer available. - No new file or alternative storage was added in this co…

### `.novadiff-graph/meta.json`

### Overview The file `.novadiff-graph/meta.json` was removed from the repository. All six lines of JSON content—`lastAnalyzedAt`, `gitCommitHash`, `version`, and `analyzedFiles`—were deleted (lines 1‑6 in the diff). ### Key changes - **File deletion**: `.novadiff-graph/meta.json` no longer exists in the tree. - **Metadata loss**: The six lines of JSON that tracked analysis timestamp, commit hash, version, and file count are gone. - **No other source changes**: The diff shows only the removal of this file. ### Imp…

### `electron/export-snapshot.cjs`

_Touched symbols found · Import/export surface changed_

### Overview A new CommonJS module `electron/export-snapshot.cjs` is added. It exposes a single function, `exportProjectSnapshotZip`, that zips a given bundle directory into a specified output path using the system `zip` utility. ### Key changes - **Imports added**: `node:fs`, `node:path`, and `node:child_process` (`spawnSync`). - **Function `exportProjectSnapshotZip(bundleDir, outZipPath)`**: - Resolves and validates `bundleDir`. - Ensures the output directory exists (`mkdirSync` with `recursive`). - Removes any…

### `electron/git-commit.cjs`

_Touched symbols found · Import/export surface changed_

### Overview A new module `electron/git-commit.cjs` is added. It exports a `getCommitDetail` helper that retrieves commit metadata and statistics by invoking Git commands. ### Key changes - Import added at line 3: `const { runGit, tryRunGit } = require("./git-service.cjs");` - Function `getCommitDetail(repoRoot, hash)` added (lines 1‑69): - Validates `repoRoot` and `hash` (lines 12‑14). - Runs `git log -1 <hash>` with a custom format to capture hash, short hash, subject, author, email, date, and parents (lines 16‑…

### `electron/git-publish.cjs`

_Touched symbols found · Import/export surface changed_

### Overview `electron/git-publish.cjs` now stages a user‑supplied list of paths instead of always staging the entire repository. The change adds `stagePaths` to the import from `./git-service.cjs` (line 4) and rewrites the staging logic in `executePublish`. ### Key changes - **Import update** – `stagePaths` is added to the destructured import from `./git-service.cjs` (line 4). - **Conditional staging** – `stageAll(root)` is replaced by logic that builds `stagePathsList` from `opts.stagePaths` (lines 63‑70). - **B…

### `electron/git-service.cjs`

_Touched symbols found_

### Overview Three new helper functions were added to `electron/git-service.cjs` to give callers finer control over staging: * `stagePaths(repoRoot, paths)` – normalises a list of paths, runs `git add -- <paths>`, and returns `{ staged: N }`. * `unstagePaths(repoRoot, paths)` – runs `git reset HEAD -- <paths>` and returns `{ unstaged: N }`. * `stageDistrict(repoRoot, topDir, statusFiles?)` – filters the repository’s status files to those under `topDir` (or its sub‑directories) and delegates to `stagePaths`. The mo…

### `electron/github-commit-context.cjs`

_Touched symbols found · Import/export surface changed_

### Overview Adds `electron/github-commit-context.cjs` exposing `getGithubCommitContext(fullName, sha)` to gather pull requests, issues, and comment threads for a commit using the GitHub CLI. ### Key changes - Added `parseJsonSafe(raw, fallback)` (lines 5‑12) to safely parse JSON, returning `fallback` on error. - Added `shortGhError(message)` (lines 13‑22) to normalize CLI error messages. - Added `normalizeThread(entry)` (lines 25‑33) to standardize thread objects with defaults. - Implemented `getGithubCommitConte…

### `electron/github-service.cjs`

_Touched symbols found · Import/export surface changed_

### Overview A new export `getGithubCommitContext` has been added to `electron/github-service.cjs`. The export forwards all arguments to the helper defined in `./github-commit-context.cjs`: ```js getGithubCommitContext: (...args) => require("./github-commit-context.cjs").getGithubCommitContext(...args) ``` This change appears in the diff at lines 224‑225 of the file. ### Key changes - **Export addition** – `module.exports` now contains the `getGithubCommitContext` property (lines 224‑225). - **No other functional…

### `electron/prefetch-summaries.cjs`

_Touched symbols found_

### Overview `electron/prefetch-summaries.cjs` now runs prefetch jobs with a configurable worker pool instead of a single sequential loop. The change replaces the old `for (let i = 0; i < jobs.length; i++)` block (lines 116‑120) with a concurrency‑controlled loop (lines 116‑122 and 214‑226). ### Key changes - **Concurrency calculation** – `concurrency` is set to `Math.min(3, Math.max(1, Number(process.env.NOVADIFF_PREFETCH_CONCURRENCY) || 2))` (added lines 116‑122). - **Worker pool** – an async `worker` pulls jobs…

### `electron/preload.cjs`

### Overview The preload script now exposes five new IPC‑invoked methods via `contextBridge`. These extend the Git and GitHub tooling API surface. ### Key changes - `gitStagePaths` (`ipcRenderer.invoke("git-stage-paths")`) added at line 129. - `gitStageDistrict` (`ipcRenderer.invoke("git-stage-district")`) added at line 130. - `exportProjectSnapshot` (`ipcRenderer.invoke("export-project-snapshot")`) added at line 131. - `gitCommitDetail` (`ipcRenderer.invoke("git-commit-detail")`) added at line 146. - `githubCommi…

### `electron/workspace-history.cjs`

_Touched symbols found_

### Overview The file `electron/workspace-history.cjs` was modified to change how workspace state is persisted during history indexing. In both `indexWorkspaceHistory` (lines 100‑174) and `refreshWorkspaceHistory` (lines 188‑292) the unconditional `await upsertWorkspace(userData, workspace);` that previously ran on every commit was removed (diff lines 135 and 240). Instead, a `persistSession` flag is computed: ```js i === 0 || i === commits.length - 1 || (i + 1) % 10 === 0 ``` and passed to `upsertWorkspace` as `{…

## Focused reviewer notes

_No saved selection docs yet._

## Advisory enrichment status

NovaDiff is currently using deterministic offline risk signals only. The risk schema already separates heuristic and advisory sources so future OSV or ecosystem audit enrichment can be added without mixing those results into the base confidence model.