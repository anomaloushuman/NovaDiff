### Overview
A new `SidebarNav` component is added at `src/components/SidebarNav.tsx` (lines 1‑238). It renders a navigation sidebar that reacts to launch state, local‑only mode, and GitHub user data.

### Key changes
- **Imports**: `appMark` image, `useLaunch` hook, `TypewriterText`, and several `lucide-react` icons (e.g., `BookOpen`, `Brain`, `Columns2`) are added at lines 1‑16.  
- **Exported type**: `WorkspacePage = "compare" | "history" | "docs" | "prs" | "publish"` (line 18).  
- **Props interface**: `SidebarNavProps` defined lines 20‑31; component signature at line 35.  
- **Launch branding**: `useLaunch` provides `brandReveal` and `skipSequence` (line 48); a typewriter animation is rendered conditionally (lines 47‑79).  
- **Navigation links**: buttons (lines 133‑190) use `workspacePage` to set an active class and disable themselves when `active` is false or `gitLocked` (derived from `localOnlyMode`).  
- **User avatar**: shows `gitUser.avatarUrl` if present, otherwise a default icon (lines 210‑222).  
- **Settings button**: enabled only when `onOpenSettings` is supplied (lines 196‑204).

### Impact
- The sidebar now displays a launch brand animation and disables Git‑dependent actions when `localOnlyMode` is true, altering user flow.  
- Parent components must provide `workspacePage`, `onWorkspacePage`, and optionally `onOpenSettings`; missing props will break rendering.  
- Adding an image and several icon imports increases the client bundle, but tree‑shaking will remove unused icons.

### Risks & follow‑ups
- **`useLaunch` contract**: if its API changes, the brand reveal logic may fail; verify `brandReveal` and `skipSequence`.  
- **Local‑only mode gating**: test scenarios where `localOnlyMode` is true to confirm button disabling.  
- **Icon imports**: any missing or renamed lucide icons will cause build errors; run `npm run build` to confirm.  
- **`onOpenSettings`**: ensure a handler is passed or the UI degrades gracefully.
