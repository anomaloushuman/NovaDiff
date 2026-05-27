### Overview  
`AppLaunchShell` now accepts an optional `shellClassName` prop that appends custom CSS classes to the root `.app-shell` element. The public API and internal class composition have been updated accordingly.

### Key changes  
- **Interface** (`src/components/launch/AppLaunchShell.tsx`, lines 13‑20): added `shellClassName?: string` with a JSDoc comment (R17‑18).  
- **Function signature** (`AppLaunchShell` lines 21‑26): now includes `shellClassName` in the destructured props.  
- **Class name construction** (`shellClass` line 70): the array now contains `shellClassName` before joining, replacing the previous two‑line definition (L63).  
- **Export surface**: the old export (`L19`) was removed; the new export (`R21`) reflects the updated signature.

### Impact  
- **Backward compatibility**: `shellClassName` is optional, so existing callers remain unaffected.  
- **Styling flexibility**: consumers can inject additional classes without modifying the component’s source.  
- **No runtime logic change**: the launch sequence and phase handling remain identical; only the rendered class list differs.  
- **TypeScript enforcement**: the new prop is now typed, and the JSDoc comment aids IDE tooling.

### Risks & follow‑ups  
- **Regression in tests**: snapshot or class‑name assertions may need updating.  
- **Documentation**: update the component’s README/API docs to expose the new prop.  
- **Prop collision**: callers should avoid passing a `shellClassName` that conflicts with internal classes.  
- **Lint rule**: verify that the added JSDoc comment does not trigger any linting issues.
