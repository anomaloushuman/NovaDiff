### Overview
The `src/vite-env.d.ts` file now imports `SecurityInsightReport` from `./app/types` (line 13) and extends the `ElectronAPI` interface with a new `scanSecurityInsights` method (lines 186‑190). This expands the renderer‑to‑main API surface to support security‑insight scanning.

### Key changes
- **Import added**: `SecurityInsightReport` from `./app/types` (line 13).  
- **API method added**:  
  ```ts
  scanSecurityInsights: (payload: {
    projectRoot: string;
    changes: FileChange[];
    advisoryEnabled?: boolean;
  }) => Promise<SecurityInsightReport>;
  ```
  (lines 186‑190).  
- No other interface members were modified.

### Impact
- **Compile‑time**: Code that imports `ElectronAPI` will now require the new method; missing implementation will cause type errors.  
- **Runtime**: The main process must expose `scanSecurityInsights` via the preload script; otherwise renderer calls will fail.  
- **Testing**: Mocks of `ElectronAPI` need to include the new method to avoid undefined errors.  
- **Documentation**: API docs and README snippets should be updated to reflect the new capability.

### Risks & follow‑ups
- **Missing implementation**: If the main process or preload script does not expose `scanSecurityInsights`, renderer calls will throw at runtime.  
- **Type leakage**: Ensure `SecurityInsightReport` is exported from its module; otherwise imports will fail.  
- **Backward compatibility**: Existing code that accesses `electronAPI` without checking for the new method may compile but fail if the method is absent. Add optional chaining or guard checks where appropriate.  
- **Test coverage**: Update unit tests that mock `ElectronAPI` to include the new method; otherwise tests may pass locally but fail in CI where the mock is stricter.
