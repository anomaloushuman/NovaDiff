### Repository overview

NovaDiff is a cross‑platform desktop tool that visualises and analyses changes in a codebase.  
Key parts of the repository are:

| Layer | Purpose | Main entry points |
|-------|---------|-------------------|
| **Electron** | UI and orchestration | `electron/main.cjs`, `electron/preload.cjs` |
| **Rust CLI** | Diff engine and Git helpers | `cli/src/main.rs` |
| **Graph‑Core** | Graph building, LLM analysis, embeddings | `packages/graph-core/src` |
| **LLM integration** | Prompt generation & response parsing | `electron/llm.cjs` |
| **Git / GitHub** | Repository discovery, PR handling | `electron/git-service.cjs`, `electron/github-service.cjs` |
| **Security scan** | Vulnerability detection | `electron/security-scan-runner.cjs` |
| **Workspace store/history** | Snapshotting & navigation | `electron/workspace-store.cjs`, `electron/workspace-history.cjs` |

The repository is organised as a monorepo under `packages/` (primarily `graph-core`) and an Electron bundle that consumes those packages.

### Architectural layout

```mermaid
graph TD
  subgraph Electron
    A[main.cjs] --> B[preload.cjs]
    B --> C[renderer]   %% renderer code not in scan
    A --> D[git-service.cjs]
    A --> E[github-service.cjs]
    A --> F[security-scan-runner.cjs]
    A --> G[knowledge-graph-runner.cjs]
    A --> H[workspace-store.cjs]
    A --> I[workspace-history.cjs]
    A --> J[prefetch-summaries.cjs]
    A --> K[export-snapshot.cjs]
    A --> L[diff-excerpt.cjs]
  end
  subgraph Rust CLI
    M[cli/src/main.rs] --> N[diff engine]
  end
  subgraph Graph‑Core
    O[packages/graph-core/src] --> P[LLM analyzer]
    O --> Q[Embedding search]
    O --> R[Change classifier]
    O --> S[Layer detector]
  end
  D --> M
  E --> M
  G --> O
  P --> O
  Q --> O
  R --> O
  S --> O
```

* The Electron **main** process exposes APIs to the renderer via the **preload** script.  
* Diff requests are forwarded to the **Rust CLI** (`cli/src/main.rs`).  
* The **Graph‑Core** library is imported by the Electron renderer and by the Rust CLI (via a Node bridge).  
* LLM prompts are generated in `electron/llm.cjs` and sent to external providers (Ollama, LM Studio).  
* GitHub authentication flows use the `gh` CLI (`electron/github-auth-flow.cjs`).  
* Security scans are launched from the main process and parse audit outputs from npm, pip, and cargo.

### Key subsystems

* **Electron UI & orchestration**  
  * `electron/main.cjs` – window creation, menu, IPC handlers.  
  * `electron/preload.cjs` – safe API surface for the renderer.  
  * `electron/diff-excerpt.cjs` – builds diff snippets for the UI.  
  * `electron/export-snapshot.cjs` – zips workspace snapshots.  
  * `electron/prefetch-summaries.cjs` – background worker that pre‑loads LLM summaries.

* **Rust CLI** (`cli/src/main.rs`)  
  * `ChangeKind` enum – classifies file changes.  
  * `walk_path_allowed`, `filter_changes_for_prefetch_gitignore` – path filtering logic.  
  * `try_build_gitignore_for_root` – generates a `.gitignore` for the workspace root.  
  * Exposed via `electron/compare-runner.cjs` (`runCompareEngine`, `parseEngineStdout`).

* **Graph‑Core** (`packages/graph-core/src`)  
  * **Analyzer** – builds a graph of files, functions, and calls.  
    * `GraphBuilder` (`src/analyzer/graph-builder.ts`) – core graph construction.  
    * `normalize-graph.ts` – node/edge normalisation.  
    * `change-classifier.ts` – determines update decisions.  
    * `layer-detector.ts` – assigns LLM‑derived layers.  
  * **LLM integration** – prompts and response parsing (`llm-analyzer.ts`).  
  * **Embedding search** – semantic search over file embeddings (`embedding-search.ts`).  
  * Tests live under `packages/graph-core/src/__tests__`.

* **Git & GitHub**  
  * `electron/git-service.cjs` – thin wrapper around `git` CLI.  
  * `electron/github-service.cjs` – uses `gh` CLI for PRs, repos, auth.  
  * `electron/gh-install.cjs` / `electron/gh-path.cjs` – install & path resolution helpers.

* **Security scanning** (`electron/security-scan-runner.cjs`) – orchestrates `npm audit`, `pip audit`, `cargo audit`, parses advisories, maps severity to confidence, and emits markers.

* **Workspace persistence** (`electron/workspace-store.cjs`, `electron/workspace-history.cjs`) – JSON‑based session store and commit‑based snapshot indexing.

### Dependency signals

| Source | Target | Edge type | Notes |
|--------|--------|-----------|-------|
| electron/main.cjs | electron/preload.cjs | IPC | Exposes APIs |
| electron/main.cjs | electron/git-service.cjs | import | Git helper |
| electron/main.cjs | electron/github-service.cjs | import | GitHub helper |
| electron/main.cjs | electron/security-scan-runner.cjs | import | Security scans |
| electron/main.cjs | electron/knowledge-graph-runner.cjs | import | Graph building |
| electron/main.cjs | electron/llm.cjs | import | LLM prompts |
| electron/knowledge-graph-runner.cjs | packages/graph-core/src | import | Graph‑Core library |
| electron/llm.cjs | electron/llm.cjs | internal | LLM config |
| electron/compare-runner.cjs | cli/src/main.rs | spawn | Rust diff engine |
| electron/compare-runner.cjs | electron/git-service.cjs | import | Repo context |
| electron/compare-runner.cjs | electron/github-service.cjs | import | PR context |
| packages/graph-core/src | packages/graph-core/src/analyzer | import | Analyzer modules |
| packages/graph-core/src | packages/graph-core/src/embedding-search | import | Embedding engine |
| packages/graph-core/src | packages/graph-core/src/language-lesson | import | Language detection |
| packages/graph-core/src | packages/graph-core/src/layer-detector | import | Layer assignment |

### Operational considerations

* **Build**  
  * Rust CLI: `cargo build --release` → `cli/target/release/cli`.  
  * Electron: `npm run build` (uses `electron-builder`).  
  * Graph‑Core: TypeScript compiled via `tsc` (part of Electron build).

* **Runtime**  
  * Requires `git`; `gh` (GitHub CLI) is optional.  
  * LLM provider: Ollama or LM Studio; configured in `electron/llm.cjs`.  
  * Security scans run asynchronously; results are cached in workspace snapshots.

* **Packaging**  
  * `electron-builder` produces platform‑specific installers.  
  * The Rust binary is bundled under `resources/cli`.

* **Testing**  
  * Unit tests: `packages/graph-core/src/__tests__`.  
  * Integration tests: `tests/` (not fully scanned).  
  * LLM tests use mock responses (`packages/graph-core/src/__tests__/...`).

* **Performance**  
  * Diff engine is CPU‑bound; runs in a child process.  
  * Embedding search uses `SemanticSearchEngine` (cosine similarity).  
  * Prefetch summaries run in a worker thread to avoid UI blocking.

### Documentation gaps

* Electron renderer API surface – no explicit README or API surface description.  
* CLI usage guide – `cli/src/main.rs` is documented in code, but no high‑level CLI guide.  
* Graph‑Core public API – no generated docs or example usage.  
* LLM configuration – environment variables or config files are not described.  
* Security scan output – format and interpretation are not documented.  
* Workspace store schema – JSON structure is inferred but not formally described.  
* Testing strategy – coverage metrics and test harness details are missing.

### Suggested onboarding and verification

1. **Clone & install**  
   ```bash
   git clone https://github.com/yourorg/NovaDiff
   cd NovaDiff
   npm ci
   cargo fetch
   ```

2. **Build Rust CLI**  
   ```bash
   cargo build --release
   ```

3. **Run Electron in dev mode**  
   ```bash
   npm run dev
   ```

4. **Verify core functionality**  
   * Open a sample repo in the UI.  
   * Trigger a diff and inspect the graph.  
   * Check that LLM prompts appear in the console.

5. **Run unit tests**  
   ```bash
   npm test
   ```

6. **Run integration tests** (if available)  
   ```bash
   npm run test:integration
   ```

7. **Validate security scans**  
   ```bash
   npm run security:scan
   ```

8. **Build installers**  
   ```bash
   npm run build
   ```

9. **Review generated docs** (if any)  
   * Check `packages/graph-core/docs` or similar.

10. **Cross‑check API surface**  
    * Inspect `electron/preload.cjs` for exposed functions.  
    * Verify that renderer code imports these correctly.