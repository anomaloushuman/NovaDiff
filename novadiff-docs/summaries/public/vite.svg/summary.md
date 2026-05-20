### Overview  
A new SVG asset `public/vite.svg` was added. The file contains a single `<svg>` element with namespace declarations, `aria-hidden="true"`, `role="img"`, and class `iconify iconify--logos`. The root element starts with `width="31.88"`.

### Key changes  
- File added: `public/vite.svg` (line 1 added).  
- SVG markup: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--logos" width="31.88" …>`.

### Impact  
- Static assets: The file resides in the public directory and will be served as a static asset.  
- Accessibility: `aria-hidden="true"` marks the icon as decorative; screen readers will ignore it.  
- Usage: No evidence in the diff that the icon is referenced by any component; usage remains unknown.

### Risks & follow‑ups  
- Verify that components intended to use the icon import `public/vite.svg`; otherwise the file will be unused.  
- Run a build to confirm the file is copied to the output directory.  
- If the icon conveys information, remove `aria-hidden` and provide an accessible name.  
- Add a smoke test that renders the icon and checks for the class `iconify iconify--logos`.
