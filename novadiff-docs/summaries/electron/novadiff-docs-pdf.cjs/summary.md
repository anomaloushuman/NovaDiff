### Overview  
A new module `electron/novadiff-docs-pdf.cjs` is added. It generates PDF documentation and diagram packs for NovaDiff bundles by rendering HTML in a hidden Electron `BrowserWindow`.

### Key changes  
- **Imports** (lines 3‑8): `fs/promises`, `os`, `path`, `url`, `electron`, `marked`.  
- **Metadata helper** `bundleModeMeta(bundle)` (lines 25‑53) centralises labels, narrative titles, and diagram titles for baseline, target, and change‑report bundles.  
- **Table renderers** (`renderDetectedProjects`, `renderSymbolsTable`, `renderImportEdgesTable`, `renderCrossFileCallEdges`) (lines 69‑165) build HTML tables from outline data.  
- **HTML builders**  
  - `buildMainPdfHtml(bundle)` (lines 174‑271) creates a full‑page HTML document: Markdown parsed with `marked`, Mermaid blocks, a JSON excerpt, and the tables above.  
  - `buildDiagramsPdfHtml(bundle)` (lines 272‑314) produces a compact page with only Mermaid diagrams.  
- **PDF conversion** `htmlToPdfFile(html, outPdfPath, opts)` (lines 337‑378) writes a temporary HTML file, loads it in a hidden `BrowserWindow`, waits for `window.__PDF_READY`, then prints to PDF.  
- **Orchestration** `generateNovadiffDocsPdf(bundle, _appRoot)` (lines 384‑399) validates `bundle.targetRoot`, builds output paths, and calls the two PDF generators.  
- **Exports** (line 401): `{ generateNovadiffDocsPdf, htmlToPdfFile }`.

### Impact  
- PDF output mirrors the HTML view but requires Electron and network access for the Mermaid CDN; offline builds may fail.  
- Rendering each PDF launches a headless browser window, which can be slow for large bundles.  
- Temporary directories are cleaned in a `finally` block, but the cleanup must be verified under error conditions.  
- No retry logic is present; errors are logged to the console.

### Risks & follow‑ups  
- **Electron dependency**: Ensure the runtime includes Electron and the `BrowserWindow` API matches the used version.  
- **Network dependency**: The Mermaid CDN URL (`https://cdn.jsdelivr.net/...`) must be reachable; consider bundling a local copy for offline builds.  
- **Temp‑file cleanup**: Verify that the `finally` block reliably removes the temporary directory even on errors.  
- **Security**: `nodeIntegration` is disabled and `contextIsolation` is enabled, but `webSecurity` is turned off; review if this is acceptable.
