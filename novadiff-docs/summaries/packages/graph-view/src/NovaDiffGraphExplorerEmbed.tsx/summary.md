### Overview  
`NovaDiffGraphExplorerEmbed` now imports and renders `GraphEmbedSyncBridge` to expose embed‑specific controls. The component’s props interface has been extended with optional fields for node selection, file path, focus mode, and a selection‑change callback.

### Key changes  
- **Import added**: `GraphEmbedSyncBridge` from `./GraphEmbedSyncBridge` (line 12).  
- **Props extended**: `controlledNodeId`, `enteredFilePath`, `focusMode`, `onSelectionChange` (lines 22‑25).  
- **Signature updated** to accept the new props (lines 46‑49).  
- **Bridge rendered** inside the provider, passing the new props (lines 118‑123).  

### Impact  
- **Backward compatibility**: All new props are optional; existing consumers compile unchanged.  
- **Build requirement**: `GraphEmbedSyncBridge` must be exported from its module; otherwise the import fails.  
- **Testing**: Existing tests that render the embed without the new props should still pass; new tests should verify bridge interaction.  

### Risks & follow‑ups  
- **Missing export**: Verify `GraphEmbedSyncBridge` is correctly exported.  
- **Prop misuse**: Clarify whether `controlledNodeId` and `enteredFilePath` are mutually exclusive or how they are handled by the bridge.  
- **Bridge side‑effects**: Ensure the bridge does not unintentionally alter global state or interfere with other components.  
- **Lint & build**: Run `npm run lint`, `npm test`, and `npm run build` to catch any type or runtime errors introduced by the new imports and props.
