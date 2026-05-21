### Overview
A new file `src/app/helpCopy.ts` (lines 1‑10) has been added. It exports a constant

```ts
export const HELP_COPY: Record<string, string> = {
  "link-views": "When enabled, selecting a node in the knowledge graph highlights the matching building in Code City (and vice versa).",
  "focus-mode": "Focus mode dims unrelated symbols and flies the camera to the linked selection in both views.",
  "stage-district": "Stages all changed files under the selected top-level folder (district) for the next commit.",
  "auto-commit": "Generates commit messages from structural classification, districts, and knowledge‑graph symbols."
};
```

The record maps feature identifiers to user‑facing help strings.

### Key changes
- **File addition**: `src/app/helpCopy.ts` now exists in the repository.
- **Exported constant**: `HELP_COPY` is defined as a `Record<string, string>`.
- **Help entries**: four keys (`link-views`, `focus-mode`, `stage-district`, `auto-commit`) with descriptive strings.

### Impact
- **Static data only**: No runtime logic is altered; the file only provides constants.
- **Centralization**: Help text is now in a single location, reducing duplication across the codebase.
- **Compatibility**: Adding a new export does not break existing modules unless they expect a different shape for `HELP_COPY`. Usage of the new constant is not evident from the diff.

### Risks & follow‑ups
- **Import usage**: Verify that components needing help text import `HELP_COPY` from `src/app/helpCopy.ts`.
- **Key consistency**: UI labels must reference the exact keys (`link-views`, `focus-mode`, etc.) to avoid undefined lookups.
- **Testing**: Add unit tests to confirm each key returns the expected string and that no extraneous keys exist.
- **Build validation**: Run `tsc`, lint, and test suites to ensure the new file passes all checks.
