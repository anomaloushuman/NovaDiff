### Overview  
The dev launcher now attempts to install the Electron binary automatically when it is missing. A synchronous `spawnSync` call runs `node_modules/electron/install.js` before launching the binary.

### Key changes  
- **Import update** – `spawnSync` added to `node:child_process` (L11).  
- **`resolveElectronBinary` (L24‑41)**  
  - Checks for `install.js` under `node_modules/electron`.  
  - If the binary path file (`path.txt`) is absent, it runs `install.js` via `spawnSync` with `cwd: root` and `env: cleanEnv()`.  
  - Throws a detailed error if the installer is missing or the install fails, referencing the auto‑install failure path (L38‑41).  
  - The original missing‑file error (L26‑28) is now only used when the installer itself is missing.  
- **Binary resolution** remains unchanged after the install step (L43‑53).

### Impact  
- **Correctness** – The launcher now attempts to ensure the binary exists before launch, reducing the need for a manual `npm install`.  
- **Performance** – A synchronous spawn occurs only on the first run when the binary is absent; subsequent runs skip this step.  
- **Observability** – New error messages provide clearer guidance when auto‑install fails.

### Risks & follow‑ups  
- **Startup latency** – The synchronous install may delay launch; verify acceptable timing in CI and local dev.  
- **Node compatibility** – `spawnSync` is available on recent Node versions; confirm support on older LTS releases (unknown from the diff).  
- **Installer presence** – The code assumes `electronPkg/install.js` exists; add a guard if it disappears in future Electron releases.  
- **Error handling** – Ensure the new error messages surface correctly in logs and do not mask underlying install failures.
