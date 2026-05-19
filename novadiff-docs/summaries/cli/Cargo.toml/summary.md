### Overview
The `cli/Cargo.toml` file is identical between the baseline commit `8e0dc031dcfc` and the current `NovaDiff` target. All 19 lines in the diff are marked as equal, indicating no modifications.

### Key changes
- No lines were added, removed, or altered; the file content is unchanged.

### Impact
- Dependency resolution, build, and test processes remain the same.
- The binary configuration (`[[bin]] name = "novadiff-cli" path = "src/main.rs"`) is unchanged, so the executable location is still `src/main.rs`.

### Risks & follow‑ups
- Since the file is unchanged, there is no regression risk from this diff.
- Verify that the `src/main.rs` path is still valid within the overall project structure, but no action is required based solely on this file.
