### Overview
This diff introduces a new file `src/components/CodeCityLegend.tsx`, which is a React component used to display information about the current view and the selected building. The file was added in the `target` tree but not in the `baseline` tree.

### Key changes
The key changes in this diff are related to the addition of the new `CodeCityLegend` component. The following lines were added or modified:

* Line 121: The import statement for the `CodeCityRenderableBuilding` type was added.
* Line 38: The export statement for the `CodeCityLegend` function was added.
* Lines 40-67: The implementation of the `CodeCityLegend` function was added, including the rendering of the component.

### Impact
The impact of these changes is that the `CodeCityLegend` component is now available in the application, allowing users to see more information about the current view and the selected building. This change should be backwards compatible with existing code and should not cause any performance issues.

### Risks & follow-ups
There are no known risks associated with these changes, but it is important to verify that the new component works correctly and does not introduce any bugs or compatibility issues. To do this, we can run the JS/TS lint, test, and production build commands used by this repo.
