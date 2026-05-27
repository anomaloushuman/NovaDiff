### Overview  
The `electron/git-service.cjs` file was extended with new Git‑output parsing helpers and tooling detection. The changes add several functions (see line ranges R237‑248, R250‑269, R271‑311, R314‑330, R332‑335, R337‑344) and expose them via `module.exports` (R346‑365).

### Key changes  
- **`splitGitFormatLine`** (R237‑248): splits a string by `\x1f`, tab, or `%x1f`, falling back to the raw line.  
- **`parseLogLines`** (R250‑269): uses `splitGitFormatLine` to turn `git log` output into `{hash, shortHash, subject, authoredAt}` objects.  
- **`listBranches`** (R271‑311): parses `git for‑each‑ref` output, populating `upstream`, `isCurrent`, and `isRemote` flags.  
- **`listCommitsForRef`** (R314‑330): returns commits reachable from a ref, leveraging `parseLogLines`.  
- **`resolveRefHash`** (R332‑335): thin wrapper around `git rev‑parse`.  
- **`detectGitTooling`** (R337‑344): reports whether Git is available, its version, and any error.  
- `module.exports` (R346‑365) now includes the new helpers alongside existing ones.

### Impact  
- The new splitter centralizes line‑splitting logic, reducing duplication.  
- Branch and commit discovery now rely on a single, more robust parsing routine.  
- `detectGitTooling` provides a single source of truth for Git presence, useful for diagnostics.

### Risks & follow‑ups  
- **Branch listing regression**: verify that upstream names and remote flags match expectations on all supported Git versions.  
- **Log parsing edge cases**: ensure commit messages containing `\x1f` or tabs are handled correctly; run tests against repositories with such messages.  
- **Performance**: benchmark `listBranches` on large repositories to confirm no measurable slowdown.  
- **Tooling detection**: confirm that `detectGitTooling` reports errors when Git is missing or misconfigured, and that callers handle the `gitError` field.
