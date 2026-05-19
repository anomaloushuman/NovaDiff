### Overview  
The launcher script `scripts/run-electron.cjs` now builds its environment by calling `augmentPathForCli` instead of a plain clone of `process.env`. The helper is imported from `electron/gh-path.cjs` (diff lines R18‑R19). The removal of `ELECTRON_OVERRIDE_DIST_PATH` is unchanged.

### Key changes  
- In `cleanEnv` (lines 17‑23) the original `const env = { …process.env };` (L18) was replaced with:  
  ```js
  const { augmentPathForCli } = require(path.join(root, "electron", "gh-path.cjs"));
  const env = augmentPathForCli({ …process.env });
  ```  
  (R18‑R19).  
- The `delete env.ELECTRON_OVERRIDE_DIST_PATH;` line remains at L20.  
- No other parts of the script were modified.

### Impact  
- The environment passed to `spawn` now contains any modifications performed by `augmentPathForCli`, which may adjust PATH or related variables.  
- Existing behaviour that relied on a shallow clone of `process.env` is preserved except for the potential PATH changes.  
- The change centralises path handling in `gh-path.cjs`, reducing duplication.

### Risks & follow‑ups  
- **Missing module**: `electron/gh-path.cjs` must exist and export `augmentPathForCli`.  
- **Path side‑effects**: Verify that the augmented PATH does not interfere with other tooling.  
- **Regression**: Ensure that deleting `ELECTRON_OVERRIDE_DIST_PATH` still behaves as intended after augmentation.  
- **Documentation**: Update any references to the old `process.env` clone.
