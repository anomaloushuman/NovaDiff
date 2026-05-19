### Overview

This is a folder diff between two trees on disk, with a focus on the `src/components/InsightsColumn.tsx` file. The change kind is modified, indicating that both sides exist but differ. The line changes are approximately +115/-12.

### Key changes

* Added imports for `isNovadiffDocsReservedPath`, `Check`, `LayoutList`, `Loader2`, and `Sparkles` from `lucide-react`.
* Added types for `FileChange`, `FileDiffPayload`, `LlmSettings`, and `InsightsColumnProps`.
* Modified the `InsightsColumn` function to include new props and changed import statements.
* Added a new section for generating summaries and displaying evidence anchors.

### Impact

* This change adds new functionality for generating summaries and displaying evidence anchors, which may impact performance or compatibility with certain models.
* The added imports and types may introduce regression risk if not properly tested or documented.

### Risks & follow-ups

* Verify that the new summary generation and display features work correctly with different models and input data.
* Ensure that the new types and imports are properly tested and documented to avoid future regressions.
