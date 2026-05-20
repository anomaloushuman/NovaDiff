### Overview  
`electron/git-publish.cjs` adds publish‑related utilities to the Electron app. It exports three functions—`buildFullCommitMessage`, `previewPublish`, and `executePublish`—and imports Git and GitHub helpers from `git-service.cjs` and `github-service.cjs` (see R3–R5).

### Key changes  
- **Imports** (R3–R5): `path`, `git-service` functions (`getRepoStatus`, `stageAll`, `commit`, `push`, `isGitRepo`), and `github-service` helpers (`createPullRequest`, `getAuthStatus`, `slugFromRepoRoot`).  
- **`buildFullCommitMessage`** (R7–R13): Trims `subject` and `body`; returns `subject` alone if `body` is empty, otherwise inserts a blank line between them.  
- **`previewPublish`** (R19–R42): Resolves `repoRoot`, verifies it is a Git repo, collects status, auth, and slug data, and returns a preview object containing repo details, branch, upstream, dirty files, remotes, GitHub auth status, and a flag indicating if a push is possible.  
- **`executePublish`** (R48–R101): Validates inputs, stages all changes (`stageAll`), commits with the built message, optionally pushes to a remote, and optionally creates a PR via the GitHub CLI. The returned result includes `commitHash`, `branch`, `pushed`, `pushRemote`, and `prUrl`.  
- **Exports** (R104–R108): All three functions are exported.

### Impact  
- **Correctness**: Provides a clear commit‑message builder and a publish workflow that respects `.gitignore`.  
- **Maintainability**: Centralizes publish logic; changes to Git or GitHub interactions can be made in the service modules.  
- **Performance**: `stageAll` may be costly on large repos; caching or incremental staging could be considered.  
- **Compatibility**: Requires a Git repo; PR creation requires a logged‑in `gh` CLI; errors are thrown explicitly.

### Risks & follow‑ups  
- Verify that `buildFullCommitMessage` omits the newline when the body is empty (tests for empty body).  
- Ensure `previewPublish` throws the expected error for non‑Git directories.  
- Test `executePublish` with `push` and `createPullRequest` flags separately to confirm error handling for missing remotes or unauthenticated GitHub sessions.  
- Confirm that the returned `result` object contains accurate `branch`, `pushed`, and `prUrl` fields across different repo states.
