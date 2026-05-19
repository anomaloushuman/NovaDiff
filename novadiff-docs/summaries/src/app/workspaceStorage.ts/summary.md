### Overview  
`src/app/workspaceStorage.ts` now adds two boolean options to `resolveOnboardingGate`: `launchAuthConfirmed` and `launchWorkspaceConfirmed` (added at lines 71‑74). The function signature still lists `hasUser` and `hasActiveWorkspace`, but the logic no longer references them. The gating now depends only on `skipBoot`, `localOnlyMode`, and the new flags.

### Key changes  
- **New option fields** (`launchAuthConfirmed`, `launchWorkspaceConfirmed`) added with comments at R71‑R74.  
- **Local‑only mode logic** updated at R81‑R82: if `!opts.launchWorkspaceConfirmed` return `"welcome"`.  
- **Legacy gating removed**: blocks that returned `"welcome"` or `"hub"` based on `hasUser`/`hasActiveWorkspace` (originally lines 79‑91) are deleted.  
- **Return path**: after the local‑only check, the function always returns `"app"` if no earlier return occurs.  
- **Signature unchanged**: `hasUser` and `hasActiveWorkspace` remain in the parameter list but are unused.

### Impact  
- The function now yields only `"boot"`, `"welcome"` (in local‑only mode), or `"app"`. The `"hub"` gate is no longer reachable.  
- Callers that previously relied on `hasUser` or `hasActiveWorkspace` must now provide `launchAuthConfirmed` and `launchWorkspaceConfirmed` to control the flow.  
- Existing telemetry or logs that referenced the removed gates should be reviewed.  
- The change is O(1) and has negligible runtime impact.

### Risks & follow‑ups  
- **Regression in onboarding**: tests or UI paths expecting a `"hub"` gate may fail; run end‑to‑end tests to confirm the new flow.  
- **Flag misuse**: if `launchAuthConfirmed` or `launchWorkspaceConfirmed` are not set correctly, users may skip the welcome screen unintentionally.  
- **Legacy references**: search the codebase for `hasUser` and `hasActiveWorkspace` to ensure no remaining dependencies.  
- **Documentation**: update any docs that mention the old gating logic.
