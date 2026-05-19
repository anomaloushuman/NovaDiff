### Overview
This diff represents a folder comparison between two trees on disk, with the baseline being "NovaDiff-main" and the target being "NovaDiff". The file in question is "src/app/generatedMarkdown.ts", which has been modified.

### Key changes
The most significant implementation change in this diff is the addition of several functions related to normalizing Markdown content, including `normalizeGeneratedMarkdown`, `promoteKnownHeadings`, `splitDenseParagraphs`, and `normalizeFenceChunk`. These functions are used to clean up and format Markdown content, particularly in the context of generating summaries from large codebases.

Additionally, there are some changes to the `js-ts-source` file roles and path heuristics, as well as some modifications to the `right function` touching symbols.

### Impact
The impact of these changes will be felt primarily in the areas of correctness, maintainability, performance, compatibility, and observability. By normalizing Markdown content and promoting known section headings, we can improve the readability and structure of generated summaries, making it easier for users to understand and navigate the information. Additionally, by splitting dense paragraphs and removing malformed code fences, we can reduce the risk of errors and improve the overall quality of the generated summaries.

### Risks & follow-ups
There is a potential risk that the changes made to the `normalizeGeneratedMarkdown` function could introduce bugs or regressions, particularly if they are not thoroughly tested. To mitigate this risk, we recommend running the JS/TS lint, test, and production build commands used by this repo to ensure that the changes do not break any existing functionality. We also recommend reviewing the diff carefully to ensure that all changes are intentional and well-tested.

Overall, these changes aim to improve the quality and consistency of generated summaries, making them more useful and accessible for users.
