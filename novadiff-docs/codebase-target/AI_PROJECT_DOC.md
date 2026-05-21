### Repository overview  
NovaDiff is a cross‑platform code‑diff analysis tool.  
* **Electron UI** – `electron/main.cjs` bootstraps the application and manages windows.  
* **Rust CLI** – `cli/src/main.rs` orchestrates Git, GitHub, and LLM calls.  
* **Graph‑core library** – `packages/graph-core/src` builds and normalises a knowledge graph from repository metadata.  

The tool extracts semantic information from a Git repository, builds a graph, and renders visual summaries and documentation.

### Architectural layout  
```
┌───────────────────────┐
│ Electron UI (main)    │
│ ├─ renderer (preload) │
│ └─ services (cjs)     │
└───────┬────────────────┘
        │
┌───────▼────────────────┐
│ Graph‑Core Library     │
│ ├─ analyzer            │
│ ├─ embedding‑search    │
│ └─ fingerprint         │
└───────┬────────────────┘
        │
┌───────▼────────────────┐
│ Rust CLI (cli)          │
│ ├─ git helpers          │
│ ├─ github helpers       │
│ └─ LLM integration      │
└─────────────────────────┘
```

*Electron services* (e.g. `git-service.cjs`, `github-service.cjs`, `llm.cjs`) expose async APIs to the renderer via `preload.cjs`.  
The graph‑core library is pure TypeScript and is bundled into Electron; the CLI also invokes it through a Node child process.

### Key subsystems  

**Graph‑Core (`packages/graph-core`)**  
- **Analyzer** – builds a node graph from file metadata, detects layers, languages, and semantic concepts.  
- **LLM‑Analyzer** – crafts prompts, sends them to an LLM backend (Ollama or LM Studio), and parses JSON responses.  
- **Fingerprint** – generates content hashes and fingerprints for files, classes, and functions.  
- **Embedding‑Search** – provides a cosine‑similarity engine for semantic search over embeddings.  
- **Normalization** – cleans node IDs, infers types, and removes duplicate edges.  

**Electron UI**  
- **Main process** (`electron/main.cjs`) – window lifecycle, menu, and IPC handlers.  
- **Preload** (`electron/preload.cjs`) – exposes safe APIs to the renderer.  
- **Services** (`*.cjs`) – thin wrappers around Git, GitHub, LLM, and graph‑core logic.  
- **Docs generators** (`novadiff-docs-*.cjs`) – convert graph data into Markdown/HTML/PDF bundles.  
- **Prefetch** (`electron/prefetch-summaries.cjs`) – background worker that caches LLM summaries for quick UI display.  

**CLI (`cli/src/main.rs`)**  
- Implements `ChangeKind` enum, path utilities, and change filtering logic.  
- Uses `git-service` and `github-service` to gather repository state.  
- Calls the graph‑core library via a Node child process to build the graph.  
- Provides commands for diff comparison, snapshot export, and publishing.  

**Workspace & Snapshot**  
- **Workspace‑Store** (`electron/workspace-store.cjs`) – persists session state and snapshot metadata.  
- **Workspace‑History** (`electron/workspace-history.cjs`) – indexes Git commits into snapshot directories.  
- **Snapshot‑Export** (`electron/export-snapshot.cjs`) – zips a snapshot for sharing or archival.  

### Dependency signals  
- Cross‑file calls: ~228 edges, mainly between Electron services and the graph‑core library.  
- Resolved relative imports: 43 edges, indicating a modular structure.  
- External tools: Git, GitHub CLI (`gh`), Node, Rust compiler, LLM backends (Ollama, LM Studio).  
- `package.json` lists dependencies such as `electron`, `typescript`, `ts-node`, `@types/node`, `@types/electron`, `rustc`, `cargo`, `gh`, `ollama`, `lm-studio`.  

### Operational considerations  

| Area | Notes |
|------|-------|
| **Build** | `npm run build` compiles TypeScript, bundles Electron, and builds the Rust CLI (`cargo build --release`). |
| **Runtime** | Requires Node ≥ 18, Git, and `gh`. An LLM backend must be running locally (Ollama or LM Studio). |
| **Packaging** | `electron-builder` or `pkg` are used to create platform binaries. |
| **Testing** | Jest tests in `packages/graph-core/src/__tests__`. Rust tests in `cli/src`. |
| **Performance** | Graph building is CPU‑bound; LLM calls are async. Prefetch worker mitigates UI lag. |
| **Security** | Electron context isolation is enabled; preload exposes only whitelisted APIs. |
| **Extensibility** | New language lessons or LLM providers can be added via the analyzer plugin system. |

### Documentation gaps  
- No high‑level README for the Electron services; developers must read individual `*.cjs` files.  
- CLI documentation is minimal; only the `ChangeKind` enum is described.  
- LLM prompt templates are embedded in code; no external docs.  
- No diagram of the snapshot directory layout or the workspace history indexing algorithm.  
- TypeScript type definitions for the graph‑core public API are sparse; consumers rely on inferred types.  
- No CI configuration is visible; build scripts are present but not documented.  

### Suggested onboarding and verification  

1. **Clone & install**  
   ```bash
   git clone https://github.com/yourorg/NovaDiff
   cd NovaDiff
   npm ci
   cargo build --release
   ```  

2. **Verify core library**  
   ```bash
   npm run test:graph-core
   ```  

3. **Run Electron**  
   ```bash
   npm start
   ```  
   Check that the window opens and the menu appears.  

4. **Test CLI**  
   ```bash
   ./target/release/nova-diff --help
   ```  
   Run a sample diff command against a local repo.  

5. **Generate docs**  
   ```bash
   npm run docs:generate
   ```  
   Inspect the output in `docs/`.  

6. **Run snapshot export**  
   ```bash
   npm run export-snapshot
   ```  
   Verify the ZIP contains expected files.  

7. **Lint & format**  
   ```bash
   npm run lint
   npm run format
   ```  

8. **Explore tests** – Graph‑core tests in `packages/graph-core/src/__tests__`; Rust tests in `cli/src`. Run them to confirm no regressions.