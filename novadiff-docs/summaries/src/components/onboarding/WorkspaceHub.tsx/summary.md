### Overview  
`WorkspaceHub` now accepts optional `activeWorkspaceId` and `onContinueLast` props (see `src/components/onboarding/WorkspaceHub.tsx` lines 9‑12). When both are supplied, a “Continue with {workspace name}” button is rendered above the workspace list (lines 177‑192). Local workspaces no longer show their repo path; the placeholder “Local repository” is used instead (line 214).

### Key changes  
- **Props API** – `WorkspaceHubProps` gains `activeWorkspaceId?: string | null` and `onContinueLast?: () => void`.  
- **Component signature** updated to destructure the new props (lines 20‑23).  
- **Continue button** – an IIFE finds the workspace matching `activeWorkspaceId` and renders a button wired to `onContinueLast`.  
- **Workspace list display** – `ws.githubSlug ?? ws.repoRoot` replaced with `ws.githubSlug ?? "Local repository"`.

### Impact  
- The continue button appears only when a matching workspace exists, preventing orphaned actions.  
- Local repositories are now labeled consistently, improving readability.  
- Existing callers remain unaffected; the new props are optional.

### Risks & follow‑ups  
- **Regression** – Verify that `activeWorkspaceId` is correctly passed; missing IDs should not crash.  
- **UI consistency** – Ensure the “Local repository” placeholder matches design tokens.  
- **Accessibility** – The new button should have an accessible label; run accessibility checks.  
- **Testing** – Add unit tests for the continue‑button rendering path and for the updated list item display.
