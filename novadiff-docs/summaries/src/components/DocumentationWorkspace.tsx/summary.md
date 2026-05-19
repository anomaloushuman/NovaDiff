### Overview
This release introduces several new features and improvements to the NovaDiff workspace, including a new "Open in default browser" button, a 3D code city visualization, and a "Search file or symbol" input field. These features make it easier for users to explore and understand the repository structure in 3D and quickly find specific files or symbols within the city layout.

### Key Changes
* The "Open in default browser" button has been added to the documentation workspace, allowing users to quickly open the target root in their default web browser.
* A new "3D code city" section has been added to the workspace, which visualizes the repository structure in 3D using a city layout algorithm. This feature allows users to explore the repository structure in a more intuitive way and identify patterns and trends.
* The city layout now includes a "Changed only" filter, which shows only buildings that have changes between the baseline and target roots.
* The city layout now includes a "Git blame overlay" option, which tints buildings by dominant author for the bounded set of files the backend sampled.
* The city layout now includes a "Compare overlay" option, which compares the target root with the baseline root and highlights differences in color.
* The city layout now includes a "Search file or symbol" input field, which allows users to quickly find specific files or symbols within the city layout.

### Impact
The new features and improvements to the NovaDiff workspace make it easier for users to explore and understand the repository structure in 3D and quickly find specific files or symbols within the city layout. These features also provide valuable insights into the codebase and can help developers identify patterns and trends in the codebase.

### Risks & Follow-ups
There are no known risks associated with these changes. However, users should note that the "Open in default browser" button may not work as expected if the user's default web browser is not compatible with the NovaDiff workspace. Additionally, users should ensure that their browser has access to the necessary permissions and resources to display the 3D code city visualization correctly.
