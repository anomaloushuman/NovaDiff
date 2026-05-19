### Overview
The `.gitignore` file was modified to add ignore rules for legacy clone artifacts and graph‑engine build output. The changes appear in lines 34–38 of the file.

### Key changes
- **Line 34** – added comment `# Optional legacy clone (not used by NovaDiff)`.
- **Line 35** – added pattern `understandanything/` to ignore that directory.
- **Line 37** – added comment `# Graph engine build output`.
- **Line 38** – added pattern `packages/graph-core/dist` to ignore the build‑output directory.

### Impact
- Only affects version‑control behavior; no code or runtime changes are introduced.
- The added ignore patterns prevent accidental commits of the specified directories.

### Risks & follow‑ups
- Verify that `understandanything/` and `packages/graph-core/dist` are not required by CI or deployment scripts; otherwise, missing files could cause failures.
- Update any scripts that previously expected these directories in the repository to generate them locally.
- Run a quick lint or `.gitignore` parser check to ensure the new comments do not interfere with tooling.
