### Overview
This diff introduces a new feature that allows users to export summary documentation for selected lines and symbols. This feature is implemented using a new function called `exportSelectionSummaryArtifacts`. The function takes a selection key as input and generates a Markdown file with detailed information about the selected lines and symbols. Additionally, it also generates an HTML file and a PDF file with the same content.

### Key changes
The following are some of the key changes in this diff:

* New function `exportSelectionSummaryArtifacts` that exports summary documentation for selected lines and symbols.
* New folder structure under `novadiff-docs/selections/` to store the generated artifacts.
* New functions `readSelectionSummaryMarkdowns`, `buildSelectionSummaryDocument`, and `resolveSelectionDirAbs` to read and generate the summary documentation for selected lines and symbols.
* New import statements for `fs`, `path`, and `crypto` to support the new functionality.

### Impact
This change has the potential to improve the maintainability and usability of NovaDiff by providing users with more detailed information about their selections. It also allows users to easily share their selections with others or save them for future reference. Additionally, the new functionality can help developers to identify potential issues and bugs in their codebase more efficiently.

### Risks & follow-ups
The main risk associated with this change is that it may introduce new bugs or compatibility issues with existing features. To mitigate this risk, we should thoroughly test the new functionality and ensure that it works as expected on various platforms and configurations. Additionally, we should provide clear instructions on how to use the new feature and ensure that users have a smooth experience when using it.
