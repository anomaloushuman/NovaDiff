### Overview  
A new file `packages/graph-view/src/components/MobileBottomNav.tsx` (lines 1‑71) introduces a mobile‑only bottom navigation component. It exports a `MobileTab` type, a `Props` interface, and a default function `MobileBottomNav`.

### Key changes  
- **Imports** – `ReactNode` from *react* and `useI18n` from `../contexts/I18nContext` are added (R1‑R2).  
- **Types** – `export type MobileTab = "graph" | "info" | "files"` (R4) and `interface Props` with `activeTab` and `onTabChange` (R6‑R8).  
- **Icon mapping** – `tabIcons` holds SVGs for each tab (R11‑R35).  
- **Order & labels** – `tabOrder` array and `labels` record use `t.mobile.*` keys (R37‑R45).  
- **Component** – `MobileBottomNav` renders a `<nav>` with three buttons, applying active styling and an underline indicator (R39‑R71).  
- **Accessibility** – `aria-current="page"` is set on the active button.

### Impact  
- **UI** – Adds a mobile‑specific navigation bar; must be imported where mobile routing is handled.  
- **Internationalization** – Requires `t.mobile.graph`, `t.mobile.info`, and `t.mobile.files`; missing keys will result in empty labels.  
- **Styling** – Uses Tailwind classes; ensure the theme provides `bg-surface`, `border-border-subtle`, `text-accent`, etc.

### Risks & follow‑ups  
- The component depends on the `I18nContext`; if the context is not provided, `useI18n()` will throw.  
- No tests are added for this component; consider adding unit tests for rendering and interaction.  
- Verify that the SVG icons render correctly on target devices; potential layout issues if the icon size changes.
