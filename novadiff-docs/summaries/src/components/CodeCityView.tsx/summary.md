### Overview
This diff introduces a new file `src/components/CodeCityView.tsx`, which is a React component that renders a 3D visualization of the code city layout. The component uses the Three.js library to create a scene with buildings and districts, and it also includes an orbit controls for user interaction.

### Key changes
The following are some of the key changes in this commit:

* New file `src/components/CodeCityView.tsx` added.
* Import statements for `useEffect`, `useRef`, `THREE`, `OrbitControls`, and other dependencies added.
* Function definitions for `attachSelectable`, `CodeCityView`, and other related functions added.
* Changes to the `CodeCityLayoutResult` type definition to include additional properties.
* Changes to the `CodeCityRenderableBuilding` type definition to include additional properties.
* Changes to the `CodeCityView` function to handle new parameters and return values.
* Changes to the `onSelect` callback function to handle new parameters and return values.

### Impact
This change introduces a new component that allows users to visualize the code city layout in 3D. The component uses Three.js to create a scene with buildings and districts, and it also includes an orbit controls for user interaction. This change should improve the maintainability and performance of the application by providing a more intuitive way for users to explore the code city layout.

### Risks & follow-ups
There are no known risks associated with this change, but there may be some performance or compatibility issues that need to be verified. It would be good to verify that the component works correctly on different browsers and devices, and that it does not cause any unexpected side effects. Additionally, it would be helpful to test the component with different layouts and building configurations to ensure that it handles them correctly.
