### Overview  
The preload script now exposes five new IPC‑invoked methods via `contextBridge`. These extend the Git and GitHub tooling API surface.

### Key changes  
- `gitStagePaths` (`ipcRenderer.invoke("git-stage-paths")`) added at line 129.  
- `gitStageDistrict` (`ipcRenderer.invoke("git-stage-district")`) added at line 130.  
- `exportProjectSnapshot` (`ipcRenderer.invoke("export-project-snapshot")`) added at line 131.  
- `gitCommitDetail` (`ipcRenderer.invoke("git-commit-detail")`) added at line 146.  
- `githubCommitContext` (`ipcRenderer.invoke("github-commit-context")`) added at line 147.  

These entries appear in the `electronAPI` object immediately after the existing workspace‑related methods.

### Impact  
- The API surface now includes calls for staging specific paths or districts, exporting project snapshots, and retrieving commit details from Git and GitHub.  
- No existing symbols were removed; the change is additive.  
- Consumers can invoke these methods via `window.electronAPI.<method>`.

### Risks & follow‑ups  
- Verify that the main process registers listeners for the channels `"git-stage-paths"`, `"git-stage-district"`, `"export-project-snapshot"`, `"git-commit-detail"`, and `"github-commit-context"`. Missing handlers will surface as IPC errors.  
- Add unit tests to confirm that the preload methods forward payloads correctly.  
- Run `npm run lint` and `npm run build` to ensure no syntax or type errors were introduced.
