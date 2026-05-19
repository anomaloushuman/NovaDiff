### Overview
This diff represents a folder comparison between two trees on disk, with NovaDiff as the target and NovaDiff-main as the baseline. The file being analyzed is src/app/types.ts. The change kind is modified, indicating that both sides exist but differ.

### Key changes
The following changes were detected in this file:

* Added export type NovadiffDocsBundleKey =
* Added export type NovadiffDocsPage =
* Added interface DiffSymbolSpan {
* Added interface DiffSelectionLineRange {
* Added type SelectionDocMode = "exact" | "expanded";

These changes are significant because they introduce new exports, interfaces, and types to the codebase.

### Impact
The impact of these changes is likely to be positive, as they add new functionality and improve the maintainability and readability of the code. However, it's important to verify that these changes do not introduce any regressions or compatibility issues with existing features.

### Risks & follow-ups
Based on the evidence provided, there does not appear to be any risk associated with these changes. Additionally, it would be beneficial to run the JS/TS lint, test, and production build commands used by this repo to ensure that the changes do not break anything.
