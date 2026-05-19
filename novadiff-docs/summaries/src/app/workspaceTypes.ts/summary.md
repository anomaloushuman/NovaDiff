### Overview  
A new file `src/app/workspaceTypes.ts` is added to the repository. It contains only TypeScript interface declarations that model workspace state, commit snapshots, Git history options, and GitHub tooling status. No existing files are modified.

### Key changes  
- **`GitUserProfile`** (lines 1‑6): defines `login`, `name`, `avatarUrl`, `hostname`, and `authenticatedAt`.  
- **`WorkspaceCommitSnapshot`** (lines 9‑17): describes a commit’s `hash`, `shortHash`, `subject`, `authoredAt`, `snapshotPath`, optional `docsPath`, and optional `indexedAt`.  
- **`NovaWorkspace`** (lines 19‑33): models a workspace’s `id`, `name`, `repoRoot`, optional `githubSlug`, `dataDir`, timestamps, `historyStatus`, optional `historyError`, optional `historyProgress`, an array of `WorkspaceCommitSnapshot`, and an optional `liveDevRepoRoot`.  
- **`GitHistoryCompareOptions`** (lines 35‑38): optional `useLiveHead` flag and optional `liveRepoRoot`.  
- **`GhToolingStatus`** (lines 40‑51): indicates whether GitHub tooling is installed, its path, version, auto‑install capability, install method, command, label, manual URL, hint, and a reason string.  
- **`WorkspaceSessionState`** (lines 53‑58): ties together the user profile, active workspace ID, list of `NovaWorkspace`, and a `localOnlyMode` flag.

### Impact  
- **Type safety**: Consumers can import these interfaces to replace ad‑hoc shapes, reducing runtime type errors.  
- **Documentation**: The interfaces serve as a living specification for the workspace domain, aiding onboarding and code reviews.  
- **No runtime changes**: The file contains only type declarations; it does not affect compiled JavaScript output or performance.  
- **Future integration**: Services that previously used implicit shapes will need to import these interfaces for consistency.

### Risks & follow‑ups  
- **Missing imports**: Verify that modules expecting workspace shapes now import from `src/app/workspaceTypes.ts`.  
- **API surface expansion**: External consumers relying on old implicit shapes may need to update type references.  
- **Documentation sync**: Ensure README or API docs reflect the new interfaces.  
- **Linting**: Run `tsc` and lint to confirm no unused imports or circular dependencies were introduced.
