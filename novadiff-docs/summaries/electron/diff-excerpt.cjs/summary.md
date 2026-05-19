### Overview
This diff introduces a new file `electron/diff-excerpt.cjs` with two functions `buildDiffExcerpt` and `buildDiffExcerptChunks`. The former generates a compact diff text for LLM context, while the latter splits the output into chunks based on a maximum length per chunk.

### Key changes
The most significant implementation change is the addition of the `buildDiffExcerptChunks` function, which allows for more efficient rendering of large diffs by breaking them down into smaller chunks. Additionally, the `buildDiffExcerpt` function now includes a `maxLenPerChunk` parameter to allow for customization of the chunk size.

### Impact
The impact of these changes should be minimal, as they primarily serve to improve the performance and scalability of the diff rendering process. However, it's worth noting that the `buildDiffExcerptChunks` function may introduce some regression risk if it is not properly tested or integrated with existing code.

### Risks & follow-ups
1. **Regression risk**: The new `buildDiffExcerptChunks` function may introduce unexpected behavior or bugs if it is not thoroughly tested or integrated with existing code. To mitigate this risk, we recommend running the JS/TS lint, test, and production build commands used by this repo to ensure that the changes do not introduce any new issues. Additionally, we suggest verifying that the `buildDiffExcerptChunks` function behaves correctly for a variety of input scenarios.
2. **Verification**: We recommend verifying that the `buildDiffExcerptChunks` function behaves correctly for a variety of input scenarios to mitigate the regression risk.
