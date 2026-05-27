### Overview
The `CodeViewer` component in `packages/graph-view/src/components/CodeViewer.tsx` now obtains the current theme via the `useTheme` hook and applies it to the Prism‑React‑Renderer theme instead of the hard‑coded `vsDark`. This change is reflected in the import, state extraction, and the `Highlight` component.

### Key changes
- Added import: `import { useTheme } from "../themes/index";` (line 8).  
- Extracted theme preset: `const { preset } = useTheme();` (line 103).  
- Introduced `prismTheme` selector: `const prismTheme = preset.isDark ? themes.vsDark : themes.vsLight;` (line 259).  
- Updated `Highlight` usage: `theme={prismTheme}` replaces `theme={themes.vsDark}` (lines 394‑397).  
- `lineRangeForNode` logic unchanged; only line numbers shifted (original lines 64‑472 → 65‑475).

### Impact
- The component now reflects the global dark/light mode, improving visual consistency.  
- Centralizes theme logic, reducing duplication across the codebase.  
- Requires that `CodeViewer` be rendered within a `useTheme` provider; otherwise `preset` will be undefined.

### Risks & follow‑ups
- **Missing provider** – Verify all mounts of `CodeViewer` are wrapped in the theme context.  
- **Theme switch latency** – Ensure that toggling the theme updates `prismTheme` immediately; test that highlight colors change on mode switch.  
- **Legacy hard‑coded theme** – Search for remaining `themes.vsDark` imports in other components and update them to use `useTheme` if necessary.
