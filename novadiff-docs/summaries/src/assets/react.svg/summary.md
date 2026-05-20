### Overview
A new SVG asset `src/assets/react.svg` was added to the repository.

### Key changes
- File `src/assets/react.svg` was created (line range R1 added).  
- The file contains a `<svg>` element with the following attributes: `xmlns`, `xmlns:xlink`, `aria-hidden="true"`, `role="img"`, `class="iconify iconify--logos"`, and `width="35.93"`.  
- No other source files were modified.

### Impact
- The asset can be imported by components that render logos; the relative path is `src/assets/react.svg`.  
- No runtime logic changes were made, so existing functionality is unaffected.  
- Build tooling must include the new SVG in the assets bundle; this is not confirmed by the diff.

### Risks & follow‑ups
- Verify that the icon renders correctly on pages that use logos.  
- Ensure the asset path resolves in both development and production builds.  
- Confirm that the SVG meets accessibility expectations (e.g., `aria-hidden="true"`).  
- Run any tests that involve icon rendering to detect regressions.
