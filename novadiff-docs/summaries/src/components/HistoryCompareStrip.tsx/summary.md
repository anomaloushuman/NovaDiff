### Overview  
`HistoryCompareStrip` now displays the live repository path in a read‑only field and uses `pathDisplayLabel` to format that path. The component no longer accepts user edits to the live repo root.

### Key changes  
- **Import added**: `import { pathDisplayLabel } from "../app/pathDisplay";` (line 9).  
- **Prop renamed**: `onLiveRepoRoot` → `_onLiveRepoRoot` in the signature (lines 53‑54); the prop is no longer referenced.  
- **Input updated**:  
  - `value={pathDisplayLabel(liveRepoRoot)}` (lines 140‑141).  
  - `readOnly` attribute added (line 141).  
  - `onChange` handler removed (lines 139‑140).  
  - Placeholder changed to `"Browse for live clone…"` (lines 142‑143).  
  - `title` attribute removed (line 144).  

### Impact  
- **UI**: The live‑repo path is now immutable; users must click the browse button to change it.  
- **API**: The component still declares an `_onLiveRepoRoot` prop but does not use it, which may confuse callers.  
- **Formatting**: `pathDisplayLabel` ensures a consistent, user‑friendly display of the repo path.  
- **Tests**: Any tests expecting the live‑repo input to be editable will need updating.  
- **Lint**: The unused `_onLiveRepoRoot` may trigger a warning; consider removing it if no longer needed.

### Risks & follow‑ups  
- **Regression**: Callers that rely on `onLiveRepoRoot` being invoked will silently fail. Verify that such callbacks are no longer required.  
- **Unused prop**: Decide whether to keep `_onLiveRepoRoot` for backward compatibility or remove it to avoid lint noise.  
- **Localization**: The placeholder text change may need to be reflected in i18n resources.  
- **Testing**: Update unit tests for `HistoryCompareStrip` to assert the read‑only behavior and new placeholder.
