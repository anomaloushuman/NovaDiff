### Overview
A new file `packages/graph-view/public/favicon.svg` has been added. It contains a 32 × 32 SVG that defines a dark rectangle with a gold “U” centered inside.

### Key changes
- File added: `packages/graph-view/public/favicon.svg`  
- SVG markup (lines R1‑R4):  
  - `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">`  
  - `<rect width="32" height="32" rx="6" fill="#0a0a0a"/>`  
  - `<text x="16" y="23" font-family="Georgia, serif" font-size="20" fill="#d4a574" text-anchor="middle" font-weight="bold">U</text>`  
  - `</svg>`  
- No other files were modified.

### Impact
- The graph view now has a custom favicon asset.  
- Build tooling should copy this SVG into the public assets so it can be served.  
- Browser caching may need to be considered if the favicon changes; versioning or cache busting can be used.

### Risks & follow‑ups
- Verify that the build process includes `packages/graph-view/public/favicon.svg` in the output; run `npm run build` and inspect the public folder.  
- Run UI tests to confirm the favicon appears correctly in the browser tab.  
- Ensure the path is unique and does not conflict with other favicons in the repository.  
- If the favicon is not referenced in the HTML, confirm that the correct file path is used.
