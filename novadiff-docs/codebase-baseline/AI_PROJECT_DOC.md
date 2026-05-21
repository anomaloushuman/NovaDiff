### Repository overview  
The repository contains a cross‑platform desktop application that analyzes codebases, builds a knowledge graph, and renders documentation.  
Key directories:  
- `electron/` – Electron runtime (renderer, main, IPC).  
- `cli/` – Rust crate (`src/main.rs`) that implements the diff engine.  
- `packages/graph-core/` – TypeScript core that builds the graph, runs LLM prompts, and generates docs.  
The application uses Electron (JS/TS), Rust, Node/TS, and an LLM backend (Ollama or LM Studio).

### Architectural layout  
```
┌───────────────────────┐
│ Electron (renderer)   │
│ ├─ index.html         │
│ ├─ preload.cjs        │
│ └─ renderer modules   │
└───────┬───────────────┘
        │ IPC
        ▼
┌───────────────────────┐
│ Electron (main)       │
│ ├─ main.cjs           │
│ ├─ menu.cjs           │
│ └─ window‑state.cjs   │
└───────┬───────────────┘
        │
        ▼
┌───────────────────────┐
│ Rust CLI (diff engine)│
│ └─ src/main.rs        │
└───────┬───────────────┘
        │
        ▼
┌───────────────────────┐
│ Node/TS core           │
│ ├─ packages/graph-core│
│ │  ├─ src/analyzer    │
│ │  ├─ src/embedding   │
│ │  └─ src/fingerprint │
│ └─ electron/llm.cjs   │
└───────────────────────┘
```

### Key subsystems  
| Subsystem | Location | Core functions / symbols |
|-----------|----------|---------------------------|
| Workspace & history | `electron/workspace-*` | `listSnapshotFiles`, `snapshotCommit`, `indexWorkspaceHistory` |
| Git integration | `electron/git-service.cjs` | `gitExecutable`, `runGit`, `parsePorcelainStatus` |
| GitHub integration | `electron/github-service.cjs` | `runGh`, `listRepos`, `createPullRequest` |
| LLM orchestration | `electron/llm.cjs` | `normalizeBase`, `sendAccumulated`, `sanitizeModelResponse` |
| Graph core | `packages/graph-core/src` | `GraphBuilder`, `normalizeNodeId`, `SemanticSearchEngine` |
| Docs generation | `electron/novadiff-docs-*` | `markdownToHtml`, `renderSymbolsTable`, `mermaidBlock` |
| Prefetch summaries | `electron/prefetch-summaries.cjs` | `runSummaryPrefetchLoop`, `getPrefetchedSummary` |
| Diff engine | `cli/src/main.rs` | `ChangeKind`, `subtree_change_counts`, `try_build_gitignore_for_root` |

The graph core contains a `__tests__` directory with many unit tests.

### Dependency signals  
- Resolved imports: 38 edges, mainly between `electron/*.cjs` and `packages/graph-core/src/*.ts`.  
- Cross‑file calls: 225 heuristic edges; notable clusters include `electron/main.cjs ↔ electron/llm.cjs` and `electron/git-service.cjs ↔ electron/github-service.cjs`.  
- External binaries: `git`, `gh`, `node`, `rustc`, `cargo`, `ollama` (or LM Studio).  
- Rust ↔ Node: `electron/compare-runner.cjs` calls `resolveRustCli` to spawn the Rust diff engine.

### Operational considerations  
| Area | Notes |
|------|-------|
| Build | `npm install` (Node deps) + `cargo build --release` (Rust CLI). The Rust binary is bundled into `electron/compare-runner.cjs`. |
| Packaging | Electron packager (`electron-builder`) uses `main.cjs` as entry; the Rust binary is copied into the app bundle. |
| LLM | Requires a local Ollama or LM Studio instance; `electron/llm.cjs` builds prompt strings. |
| GitHub | Uses `gh` CLI for authentication; device flow handled by `electron/github-auth-flow.cjs`. |
| Performance | Diff engine is Rust‑based; graph building is CPU‑bound TS; prefetch summaries run in a worker thread. |
| Security | IPC channels are typed; GitHub tokens are stored via `gh`. |

### Documentation gaps  
- README lacks a step‑by‑step build guide and minimal system requirements.  
- No JSDoc/TypeDoc output for the core TS modules.  
- CLI usage (`cli/src/main.rs`) is not documented beyond symbol hints.  
- LLM prompt templates are hard‑coded in `electron/llm.cjs`; no external config.  
- Testing coverage is limited to the graph core; other subsystems lack unit tests.  
- Error handling is not explicit; many functions return `any`.

### Suggested onboarding and verification  
1. **Prerequisites**  
   - Node ≥ 20, npm ≥ 10  
   - Rust ≥ 1.70, Cargo  
   - Git, `gh` CLI  
   - Ollama or LM Studio (for LLM)  

2. **Clone & install**  
   ```bash
   git clone <repo>
   cd <repo>
   npm install
   cargo build --release
   ```  

3. **Run locally**  
   ```bash
   npm run dev   # starts Electron in dev mode
   ```  

4. **Verify core functionality**  
   - Open the app, point it at a local Git repo.  
   - Trigger a diff; confirm Rust CLI output is parsed.  
   - Generate a docs bundle (`electron/novadiff-docs-html.cjs`) and inspect the HTML.  

5. **Run tests**  
   ```bash
   npm test   # focuses on packages/graph-core/src/__tests__
   ```  

6. **Lint & format**  
   ```bash
   npm run lint
   npm run format
   ```  

7. **Explore LLM integration**  
   - Start a local Ollama server (`ollama serve`).  
   - In the app, request a summary; verify prompt construction and response sanitisation.  

8. **Contribution checklist**  
   - Add JSDoc comments to new TS functions.  
   - Write unit tests for any new logic.  
   - Update README with build instructions if new dependencies are added.