### Overview  
The `ElectronAPI` interface in `src/vite-env.d.ts` has been extended with five new methods that expose additional Git and snapshot functionality to the renderer process. The changes are located in the file’s latter section (lines 293‑301 and 347‑354).

### Key changes  
- **`gitStagePaths`** (lines 293‑294) – stages a list of file paths in a repository and returns the number of files staged.  
- **`gitStageDistrict`** (lines 295‑297) – stages all files under a specified directory subtree and reports the staged count.  
- **`exportProjectSnapshot`** (lines 298‑301) – creates a ZIP archive of a project snapshot, returning the ZIP path and byte size.  
- **`gitCommitDetail`** (lines 347‑350) – retrieves detailed commit information for a given hash.  
- **`githubCommitContext`** (lines 351‑354) – fetches GitHub commit context data for a repository and SHA.

### Impact  
These additions give the renderer process direct access to:
- Programmatic staging of files or directories, enabling UI‑driven Git workflows.  
- Exporting a project snapshot for backup or sharing.  
- Inspecting commit metadata and GitHub context without additional API calls.  
The interface changes are purely type declarations; actual implementation must exist in the main process to make the calls functional.

### Risks & follow‑ups  
- **Implementation gap** – the new methods are only declared; if the main process lacks corresponding handlers, calls will fail.  
- **Security** – exposing Git staging and snapshot export may require permission checks; review access controls.  
- **Testing** – add unit and integration tests to verify that the renderer can invoke these methods and that the returned data matches expectations.  
- **Documentation** – update API docs and example usage to reflect the new capabilities.  

Unknown from the available diff/scan evidence: whether the main process has been updated to support these calls.
