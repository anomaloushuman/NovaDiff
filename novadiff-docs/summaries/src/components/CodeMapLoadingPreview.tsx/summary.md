### Overview  
A new component `CodeMapLoadingPreview` is added at `src/components/CodeMapLoadingPreview.tsx` (lines 1‑109). It renders a visual loading state for the code‑map feature, consuming a `CodeMapLoadSnapshot` and an optional `exiting` flag.

### Key changes  
- **Imports** (R1‑R4): `useMemo` from React, `useBackgroundActivity` from `../app/BackgroundActivityContext`, the `CodeMapLoadSnapshot` type, and the local CSS file.  
- **Props interface** (R6‑R9): `snapshot: CodeMapLoadSnapshot; exiting?: boolean`.  
- **Component logic** (R18‑R50):  
  - `useBackgroundActivity` supplies background tasks.  
  - `rows` is memoized (useMemo) to combine the snapshot phase with other activities, capped at three entries.  
  - `primaryPct` is clamped between 2 % and 100 % from `snapshot.percent`.  
- **Render output** (R54‑R109): a viewport with stars, horizon, mesh, and a beam whose width reflects `primaryPct`; a console listing up to three status tracks, each showing label, percent, and detail. ARIA attributes (`role="status"`, `aria-live="polite"`, `aria-busy`) are present.

### Impact  
- **Correctness**: Adds a typed, isolated UI component; no existing code is modified.  
- **Maintainability**: Loading logic is encapsulated; future UI changes can be made here.  
- **Performance**: `useMemo` limits recomputation; rendering is lightweight.  
- **Compatibility**: Requires `BackgroundActivityContext` to be provided; otherwise `useBackgroundActivity` will throw.  
- **Observability**: Screen‑reader feedback is improved via `aria-live` and `aria-busy`.

### Risks & follow‑ups  
- **Context availability**: Verify that `BackgroundActivityContext` wraps the component tree where this preview is used.  
- **Snapshot shape**: Callers must supply a valid `CodeMapLoadSnapshot` (fields `phase`, `detail`, `percent`).  
- **CSS dependency**: Ensure `CodeMapLoadingPreview.css` exists and defines the referenced class names.  
- **Build & lint**: Run `npm run lint`, `npm test`, and `npm run build` to confirm TypeScript and style integration.
