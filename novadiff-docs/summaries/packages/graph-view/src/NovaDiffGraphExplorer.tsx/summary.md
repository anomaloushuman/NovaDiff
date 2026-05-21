### Overview  
In `packages/graph-view/src/NovaDiffGraphExplorer.tsx` the `NovaDiffGraphExplorerProps` interface was extended with four optional fields: `controlledNodeId`, `focusMode`, `enteredFilePath`, and `onSelectionChange`. These additions appear in the diff at lines 31‑37 and are purely declarative; the component’s rendering logic remains unchanged.

### Key changes  
- **Interface augmentation** – the new props are declared in lines 31‑37 of the interface.  
- **Documentation comments** – JSDoc comments describe each prop’s intent.  
- **Prop propagation** – the spread `...props` in the component’s signature passes the new fields unchanged to either `NovaDiffGraphExplorerEmbed` or `NovaDiffGraphExplorerFull`.  
- **No runtime changes** – the component’s effect hooks, state handling, and JSX output are identical to the pre‑change version.

### Impact  
- **Non‑breaking** – all existing consumers compile without modification because the new props are optional.  
- **Extensibility** – downstream code can now supply node‑selection or focus‑mode hints without altering the explorer internals.  
- **No performance change** – the diff adds only type information and comments.  
- **Documentation** – the added comments improve developer understanding but require no code changes elsewhere.

### Risks & follow‑ups  
- **Type‑checking regressions** – any code that destructures `NovaDiffGraphExplorerProps` must still satisfy the updated type; run `tsc` to confirm.  
- **Test coverage** – existing tests may need to be updated or new tests added to verify that the new props can be passed without breaking the component (unknown from the available diff).  
- **Build validation** – run lint, `tsc`, and the production build to ensure no type errors.  
- **Documentation sync** – update public API docs to reflect the new optional props.
