### Overview  
A new CommonJS module `electron/export-snapshot.cjs` is added. It exposes a single function, `exportProjectSnapshotZip`, that zips a given bundle directory into a specified output path using the system `zip` utility.

### Key changes  
- **Imports added**: `node:fs`, `node:path`, and `node:child_process` (`spawnSync`).  
- **Function `exportProjectSnapshotZip(bundleDir, outZipPath)`**:  
  - Resolves and validates `bundleDir`.  
  - Ensures the output directory exists (`mkdirSync` with `recursive`).  
  - Removes any pre‑existing zip file at `outZipPath`.  
  - Executes `zip -r -q out .` with `cwd` set to the bundle directory.  
  - Throws detailed errors on missing directory or zip failure.  
  - Returns `{ zipPath: out, bytes: size }`.  
- **Export statement**: `module.exports = { exportProjectSnapshotZip };`.

### Impact  
- **Correctness**: Adds robust validation and error handling for snapshot creation.  
- **Maintainability**: Centralizes snapshot logic in a single module, simplifying future updates.  
- **Performance**: Uses synchronous I/O and `spawnSync`, blocking the event loop; acceptable for build scripts but not for long‑running processes.  
- **Compatibility**: Requires the external `zip` binary; absence will cause runtime errors.  
- **Observability**: Errors surface as thrown exceptions, making failures visible during CI or manual runs.

### Risks & follow‑ups  
- **Missing `zip` binary**: Verify availability on all target environments; consider bundling a fallback or documenting the requirement.  
- **Blocking I/O**: Ensure this module is only invoked in non‑interactive contexts; otherwise, refactor to async.  
- **Path resolution edge cases**: Test with relative, absolute, and empty `bundleDir`/`outZipPath` values to confirm correct behavior.  
- **Race conditions**: When multiple processes target the same `outZipPath`, concurrent unlink/mkdir may fail; add locking or unique temp names if needed.
