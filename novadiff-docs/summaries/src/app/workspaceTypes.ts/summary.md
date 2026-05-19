### Overview  
`src/app/workspaceTypes.ts` now exports a new `WorkspaceUiState` interface and adds an optional `uiState` property to `NovaWorkspace`. The comment at R33 notes that this UI state is restored and not shown verbatim in the main app.

### Key changes  
- **Exported `WorkspaceUiState` (R37‑R41)** – defines  
  - `workspacePage?: "compare" | "history" | "docs" | "prs" | "publish"`  
  - `leftRoot?: string`  
  - `rightRoot?: string`  
  - `compared?: boolean`  
- **Extended `NovaWorkspace` (R34)** – `uiState?: WorkspaceUiState | null;`  
- **Documentation comment (R33)** – indicates restoration of UI state.

### Impact  
- **Serialization** – any code that writes or reads `NovaWorkspace` must accommodate the optional `uiState` field.  
- **Type safety** – consumers can now type‑check UI state via the exported interface.  
- **Backward compatibility** – the field is optional, so existing workspace data remains valid.  
- **UI logic** – components can read `workspacePage` and root paths directly from the workspace model.

### Risks & follow‑ups  
- **Data migration** – ensure older workspace JSON files deserialize correctly when `uiState` is absent.  
- **Test coverage** – update unit tests that construct `NovaWorkspace` objects to include or ignore `uiState`.  
- **Documentation** – expose the new `WorkspaceUiState` interface in API docs.  
- **Linting & build** – run `tsc`, lint, and build to confirm no type errors introduced by the new export.
