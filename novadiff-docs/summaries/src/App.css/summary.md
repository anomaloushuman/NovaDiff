### Overview
The `src/App.css` file now contains a new `:root` block that sets `color-scheme: dark` and defines several CSS custom properties for a dark theme. The change adds 4 331 lines (range R1‑4331) and introduces the following variables:
- `--bg-deep: #05070c`
- `--bg: #0a0d12`
- `--surface: #0e1219`
- `--surface-2: #121826`

No named symbol spans were detected for this file with the current heuristic scanner.

### Key changes
- Added `:root { color-scheme: dark; }` to enforce dark mode system‑wide.
- Introduced the four dark‑theme custom properties listed above.
- The change expands the stylesheet by 4 331 lines, adding global styles and component selectors that reference these variables.

### Impact
- Provides a single source of truth for dark‑theme colors, simplifying future theme updates.
- Enables system‑wide dark‑mode support via `color-scheme: dark`.
- Consistent palette across UI components improves visual cohesion.

### Risks & follow‑ups
- **Override conflicts**: Verify that component‑specific styles do not unintentionally override the new variables.
- **Performance**: The large number of added rules may affect rendering on low‑end devices; benchmark as needed.
- **Testing**: Run targeted tests covering dark‑mode rendering and perform a quick manual smoke test on key UI areas such as the sidebar, workspace, and modal components.
