### Overview  
`SidebarNav.tsx` was refactored to add a richer workspace experience.  
Key additions include a local‑only mode flag, expanded navigation targets, and a conditional brand‑reveal animation.

### Key changes  
- **Imports** – `useLaunch` and `TypewriterText` added at lines 2‑3.  
- **Props** – `SidebarNavProps` now contains `localOnlyMode?`, `gitUser?`, `workspaceName?`, and `workspaceRepoLabel?` (lines 26‑29).  
- **WorkspacePage** – type expanded to `"compare" | "history" | "docs" | "prs" | "publish"` (line 18).  
- **Brand reveal** – `useLaunch` drives `showLaunchBrand`; when true, a typewriter animation renders the brand (lines 47‑50, 56‑77).  
- **Navigation** – new buttons for `"history"`, `"prs"`, and `"publish"` added with Git‑locked logic; placeholder “Coming soon” buttons removed (lines 149‑156, 171‑179).  
- **User section** – avatar now renders `gitUser.avatarUrl` if present, otherwise a fallback icon; name/email logic respects `localOnlyMode` (lines 210‑233).  
- **Removed** – static brand title, tagline, product line (lines 41‑44), placeholder buttons (lines 119‑120, 123‑124, 127‑128), and static avatar (lines 146‑148).

### Impact  
- Callers must supply the new props or accept `undefined`; the expanded `WorkspacePage` may break type checks if not updated.  
- The brand animation mounts only when `showLaunchBrand` is true, adding negligible runtime cost.  
- Git‑dependent navigation items are disabled when `localOnlyMode` is true, preventing accidental use of unavailable features.

### Risks & follow‑ups  
- Verify that `useLaunch` correctly sets `brandReveal` and `skipSequence`; otherwise the brand will not appear.  
- Ensure `onWorkspacePage` handles the new `"history"`, `"prs"`, and `"publish"` values to avoid navigation failures.  
- Confirm that `gitLocked` logic correctly disables Git‑dependent buttons when `localOnlyMode` is true.  
- Run unit tests for components consuming `SidebarNav` to catch any missing prop errors.
