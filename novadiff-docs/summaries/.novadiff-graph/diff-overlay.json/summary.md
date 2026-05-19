### Overview
The `diff-overlay.json` was regenerated on **2026‑05‑19T22:18:08.136Z** (R4), replacing the previous timestamp (L4). The overlay now contains a leaner set of files, focusing on core runtime and diff‑visualization modules while removing legacy language, persistence, and UI components.

### Key changes
- **Timestamp** – `generatedAt` updated to 2026‑05‑19T22:18:08.136Z (R4).  
- **File list** – only core runtime modules (`electron`, `graph‑view`, `packages/graph‑core`) remain; test, config, build, and legacy UI files such as `README.md`, `THIRD_PARTY_NOTICES.md`, and `electron/compare-runner.cjs` were removed (L10‑22, L25‑26).  
- **Node pruning** – `changedNodeIds` now contains only essential runtime functions; most function‑level nodes were dropped (L183‑184 / R14).  
- **Affected nodes** – `affectedNodeIds` array is now empty, indicating no nodes are marked as affected by these removals (L187‑198).  
- **Build artifacts** – files like `vite-env.d.ts`, `tsconfig.json`, and `vite.config.ts` were removed (L10‑22).

### Impact
- **Smaller overlay** – fewer files and nodes reduce payload size.  
- **Focused feature set** – the overlay tracks only core workspace and diff visualization, omitting legacy language support, persistence logic, and many UI components.  
- **Build configuration** – removal of build artifacts requires updating build scripts to match the new structure.

### Risks & follow-ups
- **Legacy functionality** – removal of language, persistence, and UI modules may affect integrations that rely on those features.  
- **Placeholder handling** – empty entries were inserted for removed files; verify that downstream tooling can handle these placeholders (unknown from the available diff).  
- **Testing** – run targeted tests for the remaining runtime modules and perform a smoke test on the diff visualization to ensure no regressions.
