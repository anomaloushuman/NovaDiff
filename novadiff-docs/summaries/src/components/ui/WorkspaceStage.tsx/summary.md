### Overview
A new component `WorkspaceStage` is added at `src/components/ui/WorkspaceStage.tsx` (lines 1‑22). It wraps page content and conditionally applies an enter animation based on the user’s reduced‑motion preference.

### Key changes
- **Imports**: `ReactNode` from `"react"` (R1) and `usePrefersReducedMotion` from `"../../app/usePrefersReducedMotion"` (R2).  
- **Props interface** `WorkspaceStageProps` (R4‑R7) with `pageKey: string` and `children: ReactNode`.  
- **Component** `WorkspaceStage` (R9‑R22) that:
  - Calls `const reduced = usePrefersReducedMotion();` (R10).  
  - Renders `<div className="workspace-stage">` containing an inner `<div>` keyed by `pageKey` with class `workspace-stage-inner` and, unless `reduced` is true, the additional class `ui-view-enter` (R14‑R17).

### Impact
- **Additive**: no existing files are modified; the component can be used independently.  
- **Runtime**: adds one extra DOM node per render and a conditional class check; negligible performance cost.  
- **Dependencies**: requires the `usePrefersReducedMotion` hook to be exported and the CSS class `.ui-view-enter` to be defined; missing either will affect animation or cause runtime errors.

### Risks & follow‑ups
- **Hook availability**: confirm `usePrefersReducedMotion` is exported and works in all target environments; otherwise the build will fail.  
- **CSS presence**: verify that `.ui-view-enter` is defined;
