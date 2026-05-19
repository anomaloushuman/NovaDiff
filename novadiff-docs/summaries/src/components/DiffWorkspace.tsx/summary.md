### Overview
This diff represents a change to the `DiffWorkspace` component in the NovaDiff app. The changes are primarily related to improving the user experience and adding new features.

### Key changes
The following key changes were made:

* Added support for displaying a summary of the selected diff in a separate panel.
* Improved the layout and styling of the diff table.
* Added a new `onRequestSelectedDiffSummary` callback to request the summary of the selected diff.
* Changed the behavior of the `onSelectDiffRow` callback to allow selecting multiple rows with shift or meta keys.

### Impact
The changes should improve the maintainability and performance of the codebase by reducing the complexity of the diff table and adding a new feature that provides valuable information to users.

### Risks & follow-ups
There is a risk that the new feature may not be well-received by some users, but this can be mitigated by providing clear documentation and testing it thoroughly before releasing it. It is also important to verify that the new feature does not introduce any regression issues.
