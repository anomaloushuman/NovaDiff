### Overview  
A new export `getGithubCommitContext` has been added to `electron/github-service.cjs`.  
The export forwards all arguments to the helper defined in `./github-commit-context.cjs`:

```js
getGithubCommitContext: (...args) =>
  require("./github-commit-context.cjs").getGithubCommitContext(...args)
```

This change appears in the diff at lines 224‑225 of the file.

### Key changes  
- **Export addition** – `module.exports` now contains the `getGithubCommitContext` property (lines 224‑225).  
- **No other functional changes** – All existing functions (`slugFromRepoRoot`, `listRepos`, etc.) remain unchanged.  
- **Import path** – The helper is required from `./github-commit-context.cjs`, preserving the original runtime behavior.

### Impact  
- **API surface** – Callers can now invoke `githubService.getGithubCommitContext(...)` directly, without importing the helper module.  
- **Maintainability** – The commit‑context logic stays in a single module; updates to `github-commit-context.cjs` automatically affect this export.  
- **Performance** – The function simply forwards arguments; no measurable change is expected.  
- **Compatibility** – Existing code continues to work unchanged; the new export is additive.

### Risks & follow‑ups  
- **Missing module** – Verify that `github-commit-context.cjs` exists and exports `getGithubCommitContext`; otherwise the new export will fail.  
- **Circular dependency** – Ensure that requiring `github-commit-context.cjs` from this module does not create a cycle that could delay initialization.  
- **Documentation** – Update README/API docs to expose the new helper; otherwise callers may be unaware.  
- **Testing** – Add unit tests to confirm that `getGithubCommitContext` forwards arguments correctly and handles edge cases.
