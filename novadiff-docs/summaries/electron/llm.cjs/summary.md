### Overview
This chunk introduces a new feature to the `summarizeChange` function that allows it to handle large file changes more efficiently by breaking them down into smaller chunks. The new parameter `diffChunkList` is an array of diff chunks, which are used to summarize each chunk separately before combining the results. This change has no significant impact on maintainability, correctness, security, performance, observability, or compatibility.

### Key changes
* Introduce a new parameter called `diffChunkList`, which is an array of diff chunks.
* Modify the behavior of the `summarizeChange` function to handle file changes with multiple diff chunks. It now calls the `summarizeFileChangeChunked` function instead of the original implementation.
* Introduce a new function called `summarizeFileChangeChunked`. This function takes in the payload and the list of diff chunks, and it summarizes each chunk separately before combining the results.

### Impact
The new feature introduced in this chunk allows the `summarizeChange` function to handle large file changes more efficiently by breaking them down into smaller chunks.

### Risks & follow-ups
There are no potential risks or concerns related to the changes made in this chunk, as the evidence is insufficient to determine any potential issues. Additionally, there are no follow-up tasks or actions that need to be taken to ensure the stability or effectiveness of the changes.
