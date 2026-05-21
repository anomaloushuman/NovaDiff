### Overview  
`src/components/ui/ui-transitions.css` replaces the hard‑coded `flex: 1` on `.workspace-stage` and `.workspace-stage-inner` with `flex: 1 1 0`. A new rule for `.launch-panel--main .workspace-stage` is added. The change is limited to layout properties; no animation or transition rules are modified.

### Key changes  
- **New selector**: `.launch-panel--main .workspace-stage` (lines 47‑50)  
  ```css
  .launch-panel--main .workspace-stage {
    flex: 1 1 0;
    min-height: 0;
  }
  ```  
- **Updated flex**:  
  - `.workspace-stage` (line 48) changed from `flex: 1;` to `flex: 1 1 0;` (diff: L48 removed, R48 added).  
  - `.workspace-stage-inner` (line 57) changed similarly (diff: L57 removed, R62 added).  
- **Additional flex**: `.workspace-stage-inner > .workspace` now has `flex: 1 1 0; min-height: 0;` (lines 70‑71).  
- No other CSS properties were altered.

### Impact  
- **Layout**: The workspace stages now grow and shrink with a basis of 0, allowing more flexible height distribution within the launch panel.  
- **Maintainability**: The new selector isolates the launch‑panel layout, reducing accidental style bleed.  
- **Compatibility**: No new CSS features or vendor prefixes were introduced; the change should work in all supported browsers.  
- **Performance**: unknown from the available diff/scan evidence.

### Risks & follow‑ups  
- **Regression**: Verify that the launch panel still occupies the intended space and that no content is clipped.  
- **Overflow**: Ensure that `overflow: hidden` on `.workspace-stage-inner` behaves correctly with the new flex basis.  
- **Test coverage**: Run the targeted UI tests for the launch panel and workspace stage; add a smoke test if none exist.  
- **Visual consistency**: Manually inspect the layout on different viewport sizes to confirm that the new flex values do not cause unintended stretching or shrinking.
