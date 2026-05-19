### Overview

This diff represents a change between two trees on disk, with NovaDiff-main as the baseline (left) and NovaDiff as the target (right). The file in question is `src/app/docsQuality.ts`. This file contains functions related to generating documentation quality reports for the NovaDiff app.

### Key changes

The most significant implementation change in this diff is the addition of new functions to generate summary prompts and risk signals. These functions include `buildSummaryPromptContext`, `buildRiskPromptContext`, `deriveConfidenceBadges`, and `buildReleaseOverviewMarkdown`. Additionally, there are changes to existing functions, such as `uniqStrings` and `compactText`, which were refactored to improve their performance and readability.

### Impact

The impact of these changes should be minimal, as they primarily involve refactoring and code cleanup. However, the addition of new functionality may result in improved maintainability and performance for future updates.

### Risks & follow-ups

There is a potential risk that the added complexity may introduce bugs or compatibility issues with downstream dependencies. To mitigate this risk, it would be beneficial to thoroughly test the changes and ensure that they do not break any existing functionality. Additionally, it would be valuable to review the evidence supporting the added confidence badges and risk signals to ensure that they are accurate and relevant.
