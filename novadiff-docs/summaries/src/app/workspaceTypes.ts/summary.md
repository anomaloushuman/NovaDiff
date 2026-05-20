### Overview  
`src/app/workspaceTypes.ts` now exports several TypeScript interfaces that describe Git user profiles, workspace snapshots, and tooling status. The file contains only type declarations, so it does not alter runtime behavior.

### Key changes  
- **`GitUserProfile`** – added at R1 (lines 1‑6).  
- **`WorkspaceCommitSnapshot`** – added at R9 (lines 9‑17).  
- **`NovaWorkspace`** – added at R19 (lines 19‑35).  
- **`WorkspaceUiState`** – added at R37 (lines 37‑42).  
- **`GitHistoryCompareOptions`** – added at R44 (lines 44‑47).  
- **`GhToolingStatus`** – added at R49 (lines 49‑60).  
- **`WorkspaceSessionState`** – added at R62 (lines 62‑67).  

Each interface is exported and can be imported by other modules.

### Impact  
- **Type safety** – the new interfaces enforce stricter typing for workspace‑related data.  
- **Imports** – any module that previously used raw objects for these concepts must now import the corresponding interface; missing imports will cause compile‑time errors.  
- **Runtime** – the file contains only type definitions, so the bundle size and execution performance are unchanged.  
- **Documentation** – existing docs should reference these interfaces to clarify data contracts.

### Risks & follow‑ups  
- **Unused exports** – verify that all new interfaces are referenced; otherwise linting may flag them.  
- **Naming collisions** – ensure no other module exports identically named interfaces that could cause import ambiguity.  
- **Data consistency** – confirm that objects constructed elsewhere match the new shapes, especially optional fields such as `uiState`.  
- **Future refactors** – if workspace structures evolve, these interfaces may need updates; track changes in the `src/app` module.
