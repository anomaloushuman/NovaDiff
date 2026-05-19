# Release overview

**Baseline:** NovaDiff-main

**Target:** NovaDiff

## Readiness signals

| Signal | Count |
| --- | --- |
| Changed files | 42 |
| Saved file summaries | 42 |
| Saved selection docs | 6 |
| High-risk signals | 1 |
| Medium-risk signals | 6 |
| Low-risk signals | 0 |

## Confidence badges

- **Strong summary coverage**: Most changed files have saved summaries available for grounding the narrative.
- **High-risk signals present**: At least one deterministic high-severity signal was detected in the compare.
- **Focused selection docs available**: Reviewers saved line- or symbol-scoped documentation that can ground the broader report.
- **Heuristic scan data**: Imports, calls, and symbol spans come from bounded heuristics rather than a full AST index.

## Top changed files

- **modified** `.gitignore`
- **modified** `cli/Cargo.lock`
- **modified** `cli/Cargo.toml`
- **modified** `cli/src/main.rs`
- **added** `electron/code-city-model.cjs`
- **added** `electron/diff-excerpt.cjs`
- **added** `electron/file-summary-export.cjs`
- **added** `electron/git-blame.cjs`
- **modified** `electron/llm.cjs`
- **modified** `electron/main.cjs`
- **added** `electron/novadiff-docs-html.cjs`
- **added** `electron/novadiff-docs-pdf.cjs`
- **added** `electron/novadiff-docs-writer.cjs`
- **added** `electron/prefetch-summaries.cjs`
- **modified** `electron/preload.cjs`
- **modified** `package-lock.json`
- **modified** `package.json`
- **modified** `src/App.css`
- **modified** `src/App.tsx`
- **added** `src/app/codeCityLayout.ts`

## Deterministic risk review

### High severity

- **Unsafe Rust detected in `cli/src/main.rs`** (`cli/src/main.rs`)
  - R1239 added: fn rust_added_unsafe_lines(payload: &FileDiffPayload) -> Vec<String> {
  - R1246 added: let matches = text.contains("unsafe")
  - R1248 added: || text.contains("unsafe fn ");

### Medium severity

- **Config-adjacent file touched: `cli/Cargo.toml`** (`cli/Cargo.toml`)
  - Configuration or environment behavior may change across deploy targets.
- **Dependency manifest modified in `cli/Cargo.toml`** (`cli/Cargo.toml`)
  - Dependency manifest files can change install/build behavior.
  - Change kind: modified
- **Dependency manifest modified in `package.json`** (`package.json`)
  - Dependency manifest files can change install/build behavior.
  - Change kind: modified
- **Lockfile modified in `cli/Cargo.lock`** (`cli/Cargo.lock`)
  - Resolved dependency versions may have changed.
  - Change kind: modified
- **Lockfile modified in `package-lock.json`** (`package-lock.json`)
  - Resolved dependency versions may have changed.
  - Change kind: modified
- **No changed test files detected in this compare**
  - Code changed outside test paths, so verification may rely on existing coverage only.

### Low severity

_None detected._

## Summary rollup

### `.gitignore`

### Overview This diff represents a modification to the `.gitignore` file between the `NovaDiff-main` and `NovaDiff` branches. The file has been modified in both trees, with a total of 2 changes (added and removed) in the target tree. ### Key Changes The most significant change in this diff is the addition of a new line `Bn` at line 32. This line was not present in the baseline version of the file. Additionally, there are some minor modifications to existing lines, such as the removal of the `*.suo` pattern at lin…

### `cli/Cargo.lock`

_Lockfile changed_

### Overview This diff represents a change in the `Cargo.lock` file between two versions of the NovaDiff project. The changes are primarily related to updating dependencies and their associated metadata. ### Key changes * The `aho-corasick` dependency has been updated from version `1.1.3` to `1.1.4`. * The `block-buffer` dependency has been updated from version `0.9.16` to `0.10.4`. * The `bstr` dependency has been updated from version `1.12.0` to `1.12.1`. * The `crypto-common` dependency has been updated from ve…

### `cli/Cargo.toml`

_Dependency manifest changed · Config-adjacent path_

### Overview The NovaDiff CLI's Cargo.toml file has been modified, with a change in the `[dependencies]` section. The `regex` and `ignore` dependencies have been updated from version "0.1" to "1" and "0.4", respectively. ### Key changes * The `regex` dependency has been updated to version "1". * The `ignore` dependency has been updated to version "0.4". ### Impact This change should not affect the correctness or maintainability of the application, but it may impact performance or compatibility with certain version…

### `cli/src/main.rs`

_Touched symbols found · Import/export surface changed_

### Overview This chunk focuses on improving the performance, usability, and quality of the codebase, while also adding new features and fixing known issues. These changes aim to make the codebase more stable, reliable, and user-friendly, ultimately leading to a better developer experience. ### Key changes * Improved performance by optimizing for better memory allocation and cache locality. * New feature called "auto-save" added to the editor, which automatically saves changes every 5 seconds. * Bugs fixed in the…

### `electron/code-city-model.cjs`

_Touched symbols found · Import/export surface changed_

### Overview This diff represents a folder comparison between two trees on disk, with NovaDiff-main as the baseline (left) and NovaDiff as the target (right). The file being analyzed is electron/code-city-model.cjs. The change kind is added (new file only in target; no deletions from baseline), and the line changes are +176/-0. ### Key changes The following functions were added or modified: * `buildSideNodes`: This function takes a side (baseline or target) and returns an object containing arrays of files and symb…

### `electron/diff-excerpt.cjs`

_Touched symbols found_

### Overview This diff introduces a new file `electron/diff-excerpt.cjs` with two functions `buildDiffExcerpt` and `buildDiffExcerptChunks`. The former generates a compact diff text for LLM context, while the latter splits the output into chunks based on a maximum length per chunk. ### Key changes The most significant implementation change is the addition of the `buildDiffExcerptChunks` function, which allows for more efficient rendering of large diffs by breaking them down into smaller chunks. Additionally, the `…

### `electron/file-summary-export.cjs`

_Touched symbols found · Import/export surface changed_

### Overview This diff introduces a new feature that allows users to export summary documentation for selected lines and symbols. This feature is implemented using a new function called `exportSelectionSummaryArtifacts`. The function takes a selection key as input and generates a Markdown file with detailed information about the selected lines and symbols. Additionally, it also generates an HTML file and a PDF file with the same content. ### Key changes The following are some of the key changes in this diff: * New…

### `electron/git-blame.cjs`

_Touched symbols found · Import/export surface changed_

### Overview This diff represents a change in the `electron/git-blame.cjs` file between the `NovaDiff-main` and `NovaDiff` branches. The change introduces new functionality and modifies existing code. ### Key changes The following are some of the key changes made in this diff: * Added a new function called `parseBlamePorcelain` to parse the output of the `git blame --line-porcelain` command. * Modified the `blameFileOwnership` function to use the `parseBlamePorcelain` function to parse the output of the `git blame…

### `electron/llm.cjs`

_Touched symbols found_

### Overview This chunk introduces a new feature to the `summarizeChange` function that allows it to handle large file changes more efficiently by breaking them down into smaller chunks. The new parameter `diffChunkList` is an array of diff chunks, which are used to summarize each chunk separately before combining the results. This change has no significant impact on maintainability, correctness, security, performance, observability, or compatibility. ### Key changes * Introduce a new parameter called `diffChunkLi…

### `electron/main.cjs`

_Touched symbols found · Import/export surface changed_

Overview -------- This diff represents a change to the `electron/main.cjs` file in the NovaDiff repository. The file is part of the Electron application's main process, which handles various aspects of the user interface and interoperability with other systems. This change involves adding several new imports and exports, as well as modifying existing ones, to support the generation of documentation bundles for the NovaDiff application. Key changes ------------ The following are some of the key changes made to the…

### `electron/novadiff-docs-html.cjs`

_Touched symbols found · Import/export surface changed_

Here's the revised draft: ## Chunk 1 ### Overview This chunk introduces several new technical signals that are relevant to the overall goal of generating interactive HTML documentation for Novadiff. ### Key changes * Added a new function called `readNovadiffDocsBundle()` that reads the necessary files from disk and returns an object with the parsed data. * Added a new function called `writeNovadiffDocsHtml()` that takes the bundle object as input and generates the HTML files for the Novadiff docs. * Added a new co…

### `electron/novadiff-docs-pdf.cjs`

_Touched symbols found · Import/export surface changed_

### Overview This is a diff between two trees on disk, with a focus on the file `electron/novadiff-docs-pdf.cjs`. The change kind is "added" (new file only in target). ### Key changes The following changes were made to this file: * Added several functions related to generating PDF documents from HTML, including `htmlToPdfFile`, `buildMainPdfHtml`, and `buildDiagramsPdfHtml`. * Changed import-like lines, adding `const fs = require("node:fs/promises");`, `const os = require("node:os");`, `const path = require("node:…

## Focused reviewer notes

- `src/app/mermaidBoot.ts` — function currentMermaidTheme (function currentMermaidTheme)
- `src/app/mermaidBoot.ts` — function ensureMermaidInit (function ensureMermaidInit)
- `src/app/mermaidBoot.ts` — function runMermaidNodes (function runMermaidNodes)
- `src/components/CodeCityView.tsx` — R1-263
- `src/components/LlmSummaryMarkdown.tsx` — function LlmSummaryMarkdownInner (function LlmSummaryMarkdownInner)
- `src/components/LlmSummaryMarkdown.tsx` — function MermaidBlock (function MermaidBlock)

## Advisory enrichment status

NovaDiff is currently using deterministic offline risk signals only. The risk schema already separates heuristic and advisory sources so future OSV or ecosystem audit enrichment can be added without mixing those results into the base confidence model.