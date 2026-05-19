### Overview  
`DiffWorkspace` now displays the selected folder paths in a read‑only, formatted form and no longer accepts user edits. The component internally renames the `onLeft`/`onRight` callbacks to `_onLeft`/`_onRight` and removes the `title` attributes that previously showed the raw paths.

### Key changes  
- **Import added**: `pathDisplayLabel` from `../app/pathDisplay` (line 7).  
- **Prop destructuring**: `onLeft` and `onRight` are captured as `_onLeft`/`_onRight` (lines 63‑64).  
- **Input values**: `value={pathDisplayLabel(leftRoot)}` and `value={pathDisplayLabel(rightRoot)}` replace the raw `leftRoot`/`rightRoot` (lines 125‑126, 160‑161).  
- **Read‑only inputs**: `readOnly` flag added to both path selectors (lines 126, 161).  
- **Removed handlers**: `onChange` callbacks and `title` attributes are gone (lines 124‑129, 160‑165).  
- **External API unchanged**: `DiffWorkspaceProps` still exposes `onLeft`/`onRight`; the component forwards them via the renamed internal variables.

### Impact  
- **UI behavior**: Users can no longer edit the path fields; they must use the browse buttons.  
- **Accessibility**: Removing `title` attributes may reduce tooltip help, but the formatted label is now clearer.  
- **Maintainability**: Centralizing path formatting in `pathDisplayLabel` reduces duplication and eases future styling changes.  
- **Performance**: Minor; the component now performs a single formatting call per render instead of handling change events.  
- **Compatibility**: Existing callers remain unaffected because the public prop names are unchanged.

### Risks & follow‑ups  
- **Regression**: Verify that the browse buttons still correctly update the parent state via `_onLeft`/`_onRight`.  
- **Accessibility**: Ensure screen readers still announce the path values; consider adding `aria-label` if needed.  
- **Testing**: Update unit tests that previously expected editable inputs or `title` attributes.  
- **Documentation**: Update any docs or README sections that mention editable path fields.
