### Repository overview
The repository is a monorepo that contains three main parts:

* **packages/graph-core/** – a TypeScript library that builds and normalises a graph of a codebase.  
* **electron/** – the Electron desktop application (main, preload, renderer, and many helper modules).  
* **cli/** – a Rust binary (`compare`) that performs diff analysis and is invoked from Electron.

The project is built with `npm`/`yarn` for the JavaScript parts and `cargo` for the Rust CLI.

### Architectural layout
```mermaid
graph TD
  subgraph Electron
    A[main.cjs] --> B[preload.cjs]
    B --> C[renderer (index.html)]
    A --> D[git-service.cjs]
    A --> E[github-service.cjs]
    A --> F[llm.cjs]
    A --> G[knowledge-graph-runner.cjs]
    A --> H[compare-runner.cjs]
    A --> I[export-snapshot.cjs]
  end
  subgraph Graph Core
    J[packages/graph-core/src] --> K[GraphBuilder]
    J --> L[normalize-graph.ts]
    J --> M[change-classifier.ts]
    J --> N[embedding-search.ts]
    J --> O[fingerprint.ts]
  end
  subgraph CLI
    P[cli/src/main.rs] --> Q[ChangeKind, path utilities]
  end
  A --> J
  G --> J
  H --> P
```

* **Electron main** (`electron/main.cjs`) orchestrates windows, menus, and IPC.  
* **Preload** (`electron/preload.cjs`) exposes safe APIs to the renderer.  
* **Renderer** (`index.html` + bundled JS) displays the UI.  
* **Graph Core** is a pure TS library that builds a graph of files, fingerprints, and LLM‑derived metadata.  
* **CLI** (`cli/src/main.rs`) runs the compare engine and is called from Electron.

### Key subsystems
| Subsystem | Purpose | Main files | Notable symbols |
|-----------|---------|------------|-----------------|
| **Graph Core** | Build and normalise a project graph | `packages/graph-core/src/analyzer/*.ts` | `GraphBuilder`, `normalizeNodeId`, `classifyUpdate`, `SemanticSearchEngine` |
| **Electron Main** | Application lifecycle, window management, progress reporting | `electron/main.cjs` | `createWindow`, `buildMenu`, `sendEngineProgress` |
| **Electron Preload** | Secure IPC bridge | `electron/preload.cjs` | `contextBridge`, `ipcRenderer` |
| **Git Service** | Git plumbing (status, blame, commit) | `electron/git-service.cjs` | `gitExecutable`, `runGit`, `parsePorcelainStatus` |
| **GitHub Service** | GitHub API interactions | `electron/github-service.cjs` | `runGh`, `listRepos`, `createPullRequest` |
| **LLM** | LLM request/response handling | `electron/llm.cjs` | `normalizeBase`, `sendAccumulated`, `ollamaGenerationOptions` |
| **Knowledge Graph Runner** | Executes graph core in a child process | `electron/knowledge-graph-runner.cjs` | `runCommand`, `loadCore`, `detectLanguage` |
| **Compare Runner** | Invokes the Rust compare engine | `electron/compare-runner.cjs` | `runCompareEngine`, `parseEngineStdout` |
| **Export / Summary** | Snapshot export, summary rendering | `electron/export-snapshot.cjs`, `electron/file-summary-export.cjs` | `exportProjectSnapshotZip`, `markdownToHtml` |
| **CLI** | Rust binary for compare engine | `cli/src/main.rs` | `ChangeKind`, `path_segments`, `subtree_change_counts` |

### Dependency signals
* **Cross‑file call edges**: 228 edges indicate tight coupling between Electron modules and the graph core.  
* **Resolved imports**: 43 edges, e.g.  
  * `electron/knowledge-graph-runner.cjs` imports `packages/graph-core/src/analyzer/graph-builder.ts`.  
  * `electron/compare-runner.cjs` calls the Rust binary via `resolveRustCli`.  
  * `electron/git-service.cjs` imports `electron/git-blame.cjs`.  
* **Symbol usage**:  
  * `GraphBuilder` is instantiated in `electron/knowledge-graph-runner.cjs` and in tests under `packages/graph-core/src/__tests__`.  
  * `classifyUpdate` is called by `electron/compare-runner.cjs`.  
  * `SemanticSearchEngine` is used in `electron/llm.cjs`.

These signals show that the Electron UI consumes the graph core and that the CLI provides diff analysis.

### Operational considerations
| Task | Command / Script | Notes |
|------|------------------|-------|
| Install dependencies | `npm install` (or `yarn`) | Installs TS, Electron, Rust toolchain, and LLM dependencies. |
| Build Electron app | `npm run build:electron` | Bundles main, preload, and renderer code. |
| Run Electron app | `npm start` | Launches the desktop UI. |
| Run CLI | `cargo run --bin compare` | Executes the compare engine; used by Electron. |
| Run tests | `npm test` | Executes Jest tests for graph core. |
| Generate alphabetical catalog | `node packages/graph-core/scripts/generate-alphabetical-catalog.mjs` | Produces a catalog of WASM modules. |
| Export snapshot | `electron/export-snapshot.cjs` | Creates a ZIP of the current project snapshot. |
| LLM integration | `electron/llm.cjs` | Requires an LLM backend (Ollama, LM Studio). |
| GitHub authentication | `electron/github-auth-flow.cjs` | Uses GitHub device flow. |

* The Electron process spawns child processes for the graph core and the Rust CLI; ensure `node` and `cargo` are in `PATH`.  
* LLM calls are optional; the app can operate with local analysis only.  
* The `.novadiff-graph/` directory holds snapshot data; it is regenerated on each run.

### Documentation gaps
* **CLI API** – The Rust binary’s command‑line options are not documented; only the `ChangeKind` enum is exposed.  
* **LLM configuration** – No README section explains how to set up Ollama or LM Studio endpoints.  
* **Electron IPC contracts** – The preload exposes many APIs, but the contract definitions are missing.  
* **Graph Core public API** – The exported functions (`GraphBuilder`, `normalizeNodeId`, etc.) lack usage examples.  
* **Testing strategy** – The test suite covers core logic but does not explain integration tests for Electron or CLI.  
* **Build scripts** – `package.json` scripts are present but not described in the README.

Adding these details would improve onboarding and reduce friction for contributors.

### Suggested onboarding and verification
1. **Clone and install**  
   ```bash
   git clone <repo>
   cd <repo>
   npm install
   cargo build
   ```
2. **Run the Electron app**  
   ```bash
   npm start
   ```  
   Verify that the window opens and the menu bar appears.
3. **Execute a sample compare**  
   ```bash
   npm run compare -- --repo <path>
   ```  
   Check that the CLI outputs a diff summary.
4. **Run tests**  
   ```bash
   npm test
   ```  
   All Jest tests in `packages/graph-core/src/__tests__` should pass.
5. **Generate catalog**  
   ```bash
   node packages/graph-core/scripts/generate-alphabetical-catalog.mjs
   ```  
   Confirm that `alphabetical-catalog.json` is created.
6. **Verify LLM flow** (optional)  
   * Start an Ollama server (`ollama serve`).  
   * Set `LLM_ENDPOINT=localhost:11434` in `.env`.  
   * Run the Electron app and trigger a LLM‑based analysis.
7. **Inspect IPC**  
   Open the renderer console (`Ctrl+Shift+I`) and check that IPC calls to `git-service`, `github-service`, and `llm` return expected data.
8. **Review snapshot export**  
   ```bash
   electron/export-snapshot.cjs
   ```  
   Ensure a ZIP file is produced and contains the expected files.