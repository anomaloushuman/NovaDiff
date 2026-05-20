### Overview  
A new module `src/app/novadiffDocs.ts` was added. It defines metadata for NovaDiff documentation bundles and helper functions for UI labels and descriptions.

### Key changes  
- **Import** – `import type { NovadiffDocsBundleKey } from "./types";` (R1).  
- **Preview pages** – `export const DOC_PREVIEW_PAGES = [ "index.html", "narrative.html", "metrics.html", "diagrams.html", "release.html" ] as const;` (R3‑9).  
- **Page type** – `export type DocPreviewPage = (typeof DOC_PREVIEW_PAGES)[number];` (R11).  
- **Bundle keys** – `export const NOVADIFF_DOC_BUNDLES: NovadiffDocsBundleKey[] = [ "change-report", "codebase-baseline", "codebase-target" ];` (R13‑17).  
- **Label helper** – `export function bundleLabel(bundleKey: NovadiffDocsBundleKey): string { … }` (R19‑28).  
- **Description helper** – `export function bundleShortDescription(bundleKey: NovadiffDocsBundleKey): string { … }` (R30‑39).

### Impact  
- Adds a single source of truth for bundle keys and preview page names.  
- Exposes two new helper functions that can be used by UI components.  
- No existing public API is altered; the new exports are additive.

### Risks & follow‑ups  
- Verify that all current imports of bundle keys now reference `NovadiffDocsBundleKey` and that no hard‑coded strings remain.  
- Ensure `src/app/novadiffDocs.ts` is included in the build pipeline and that its exports are consumed where needed.  
- Add unit tests covering `bundleLabel` and `bundleShortDescription` for each key to guard against future regressions.  
- Confirm that the `DOC_PREVIEW_PAGES` array matches the actual HTML files distributed.
