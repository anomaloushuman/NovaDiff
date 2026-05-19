### Overview  
A new component `PersonaSelector` is added at  
`packages/graph-view/src/components/PersonaSelector.tsx` (lines R1‑R46).  
It renders a button group that lets the user pick a persona, using the global
dashboard store and the i18n context.

### Key changes  
- **Imports** (R1‑R3)  
  ```ts
  import { useDashboardStore } from "../store";
  import { useI18n } from "../contexts/I18nContext";
  import type { Persona } from "../store";
  ```
- **Export** (R5)  
  `export default function PersonaSelector() { … }`
- **State hooks** (R6‑R7)  
  ```ts
  const persona = useDashboardStore((s) => s.persona);
  const setPersona = useDashboardStore((s) => s.setPersona);
  ```
- **i18n** (R8)  
  `const { t } = useI18n();`
- **Persona list** (R10‑R26) – an array of `{ id, label, description }` objects
  whose strings come from `t.personaSelector.*`.
- **Render** (R28‑R45) – a flex container of buttons that highlight the active
  persona and call `setPersona` on click.

### Impact  
- **UI**: Adds a persona selector bar to the graph view.  
- **State**: Depends on `persona` and `setPersona` in the dashboard store; if
  these keys are missing the component will error.  
- **Internationalization**: Requires the translation keys
  `personaSelector.overview`, `overviewDesc`, `learn`, `learnDesc`,
  `deepDive`, `deepDiveDesc`.  
- **Re‑rendering**: The component re‑renders on any store change; acceptable
  for a small UI element but should be monitored if store updates become
  frequent.  
- **Testing**: No tests exist yet; future tests should cover rendering,
  click behavior, and i18n integration.

### Risks & follow‑ups  
- **Store contract**: Verify that `useDashboardStore` exposes `persona` and
  `setPersona`. If not, the component will fail.  
- **Translation keys**: Ensure all referenced keys exist in the i18n bundles;
  otherwise fallback text will appear.  
- **Usage**: It is unknown from the diff whether the component is imported
  and rendered in a parent; if not, it remains unused.  
- **Lint & build**: Run `npm run lint`, `npm test`, and `npm run build` to
  catch any TypeScript or import errors introduced by this file.
