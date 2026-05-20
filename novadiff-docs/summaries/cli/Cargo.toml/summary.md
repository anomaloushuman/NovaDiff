### Overview
A new crate `cli` is added with its Cargo.toml at `cli/Cargo.toml`. It defines a binary named `novadiff-cli` that points to `src/main.rs`.

### Key changes
- `[package]` section added (lines 1‑5): name, version, edition, description.  
- Binary target declared via `[[bin]]` (lines 7‑9) pointing to `src/main.rs`.  
- Dependencies listed (lines 11‑19): `regex`, `ignore`, `rayon`, `serde`, `serde_json`, `sha2`, `similar`, `walkdir`.

### Impact
- Builds a new executable `novadiff-cli`; the workspace must now include the `cli` crate.  
- Provides a command‑line interface for folder comparison, as described in the package description.  
- Adds runtime dependencies that the binary will link against.

### Risks & follow‑ups
- Ensure the Cargo workspace includes `cli` so `cargo build` compiles the binary.  
- Run `cargo test` to confirm that the new dependencies do not break existing tests.  
- Verify that `src/main.rs` compiles against the added crates.  
- Monitor binary size and startup performance compared to previous releases.
