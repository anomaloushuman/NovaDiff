### Overview  
A new UI component `WorkspaceStage` has been added under `src/components/ui/WorkspaceStage.tsx`. It introduces a lightweight wrapper that conditionally applies a CSS transition class based on the user's reduced‑motion preference.

### Key changes  
- **New file** `src/components/ui/WorkspaceStage.tsx` with imports for `ReactNode` and `usePrefersReducedMotion`.  
- **Interface** `WorkspaceStageProps` declares `pageKey: string` and `children: ReactNode`.  
- **Component** `WorkspaceStage` renders a `<div>` hierarchy, applying the class `ui-view-enter` when motion is not reduced.  
- **Key usage**: the inner `<div>` receives `key={pageKey}` to force remounts on page changes.  
- **Export**: both the interface and the component are exported for external use.

### Impact  
- **UI behavior**: Adds a fade‑in transition to workspace stages unless the user prefers reduced motion, improving accessibility.  
- **Reusability**: The component can be dropped into any page that needs a consistent stage wrapper.  
- **Performance**: Minimal overhead; only a single hook call and a conditional class name.  
- **Compatibility**: No changes to existing components; purely additive.

### Risks & follow‑ups  
- Verify that the CSS class `ui-view-enter` exists and behaves as intended.  
- Ensure `pageKey` is unique per stage to avoid React key warnings.  
- Test the reduced‑motion toggle to confirm the transition is correctly suppressed.  
- Confirm that the component is imported and used in the relevant pages; otherwise the new file remains unused.
