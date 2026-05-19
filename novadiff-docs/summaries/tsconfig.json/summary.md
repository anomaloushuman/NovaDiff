### Overview  
The root `tsconfig.json` was modified to broaden the TypeScript compilation scope.  
At line 23 the `include` array was replaced with:

```json
"include": [
  "src",
  "packages/graph-view/src/NovaDiffGraphExplorer.tsx",
  "packages/graph-view/src/index.ts"
]
```

### Key changes  
- `include` changed from `["src"]` to the three‑item array above (diff line 23).  
- No other compiler options were altered.  
- The change is limited to the root configuration file.

### Impact  
- The two new files will now be type‑checked and bundled as part of the build.  
- The compiler will consider these files when resolving modules, potentially exposing new exports.  
- Incremental compilation will track them, but the effect on build time or artifact size is unknown from the diff.

### Risks & follow‑ups  
- **Type errors**: Verify that `NovaDiffGraphExplorer.tsx` and `index.ts` compile without errors (`tsc --noEmit`).  
- **Duplicate declarations**: Ensure these files do not re‑export symbols already exposed elsewhere.  
- **Build artifacts**: Confirm the new files appear in the final bundle (e.g., via Webpack/Vite).  
- **CI pipeline**: Check that the CI build passes with the expanded `include` set; potential OOM issues on limited‑memory runners are unknown from the available evidence.
