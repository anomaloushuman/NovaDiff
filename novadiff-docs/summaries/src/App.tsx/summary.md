### Overview
This PR introduces several significant changes to the `src/App.tsx` file, including the addition of a new `insightsWidth` state variable, which controls the width of the insights dock. The `loadInsightsWidth` function is also introduced, which loads the initial value for the `insightsWidth` state variable from local storage. Additionally, the `WindowChrome` component is introduced, which provides a customizable window chrome for the app.

### Key Changes
* The `leftTitle`, `rightTitle`, `rows`, `fileStats`, `llmSettings`, `docGenTrigger`, `workspaceDocAuto`, and `onWorkspaceDocAutoChange` props are now passed down to the `FileDiff` component.
* The `insightsWidth` state variable is introduced, which controls the width of the insights dock.
* The `setInsightsWidth` function is used to update the `insightsWidth` state variable based on user input.
* The `clampInsightsWidth` function is used to ensure that the `insightsWidth` state variable does not exceed the maximum allowed value.
* The `baseName` function is imported from the `app/utils` module and used to extract the base name of a file path.
* The `loadInsightsWidth` function is introduced, which loads the initial value for the `insightsWidth` state variable from local storage.
* The `WindowChrome` component is introduced, which provides a customizable window chrome for the app.
* The `fileSummary` prop is added to the `FileDiff` component, which displays a summary of the file's changes.
* The `fileSummaryLoading`, `fileSummaryError`, and `fileSummaryDisabledReason` props are introduced, which control the loading state, error handling, and disabled reason for the file summary.
* The `onRequestFileSummary` function is introduced, which requests the file summary data when it is needed.
* The `prefetchStatus` prop is added to the `FileDiff` component, which controls the prefetch status of the file diff.

### Impact
The addition of the `insightsWidth` state variable and the `loadInsightsWidth` function allows users to customize the width of the insights dock. The introduction of the `WindowChrome` component provides a more customizable window chrome for the app. The addition of the `fileSummary` prop and the `onRequestFileSummary` function allows users to view a summary of the file's changes.

### Risks & Follow-ups
None
