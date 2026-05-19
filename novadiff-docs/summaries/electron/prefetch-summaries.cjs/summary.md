### Overview
This diff introduces a new file `electron/prefetch-summaries.cjs`, which contains a module that prefetches summaries for files in the background. This change adds a new function `startSummaryPrefetchWorker` that starts the prefetch process, and a new function `stopSummaryPrefetchWorker` that stops it. The module also exports a new function `clearSummaryPrefetchCache` to clear the cache.

### Key changes
The key changes in this diff are the addition of the new file `electron/prefetch-summaries.cjs`, which contains the implementation of the prefetching logic. The module also exports several functions: `startSummaryPrefetchWorker`, `stopSummaryPrefetchWorker`, and `clearSummaryPrefetchCache`. These functions are used to start, stop, and clear the prefetch cache, respectively.

### Impact
The impact of this change is that it introduces a new feature that allows NovaDiff to prefetch summaries for files in the background, which can improve the performance of the app. This feature is implemented using a new module that runs in the Electron main process, which means that it can run independently of the webContents. This change also adds a new function to the module that allows the user to clear the prefetch cache, which can be useful if the user wants to free up memory or if they want to re-run the prefetching process with different settings.

### Risks & follow-ups
There are no obvious risks to this change, but there are some areas where further testing and verification may be necessary:

* The new module may have unintended side effects or interactions with other parts of the app.
* The new functions may not work as expected or may cause unexpected errors.
* The new module may introduce new dependencies or require additional maintenance.

To verify these risks, we should test the new module thoroughly and ensure that it works correctly in various scenarios. We should also check for any potential side effects or interactions with other parts of the app. Additionally, we should consider whether the new module requires additional maintenance or whether it is possible to simplify it or remove unnecessary code.
