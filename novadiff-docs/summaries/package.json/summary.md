### Overview  
The `package.json` of the NovaDiff monorepo now contains a new top‑level dependency:  

```json
"electron-liquid-glass": "^1.1.1"
```  

This line was added at line 30 of the manifest (see diff excerpt).

### Key changes  
- Line 30 of `package.json` was inserted with the dependency above.  
- No other fields or scripts were modified; the rest of the file remains unchanged.

### Impact  
- **Dependency resolution** – running `npm install` (or `yarn install`) will fetch `electron-liquid-glass`, adding its files to `node_modules`.  
- **Electron build** – the package will be bundled by `electron-builder` as part of the normal build process, but the diff shows no code imports it, so the build should succeed unchanged unless other parts of the repo reference it.  
- **Testing** – tests that mock or stub `electron-liquid-glass` may need updating; otherwise existing tests should continue to run.  
- **Bundle size** – the new dependency increases the node_modules size; the final Electron bundle will include it automatically.

### Risks & follow‑ups  
- **Peer dependencies** – verify that `electron-liquid-glass` does not require additional peer packages not present in the current manifest.  
- **Build integrity** – run `npm run build` and `npm run electron:build` to confirm that the added dependency does not break TypeScript compilation or Vite bundling.  
- **Test stability** – execute `vitest run` to ensure existing tests still pass.  
- **Bundle size** – check the final Electron artifact; if it grows noticeably, consider pruning unused exports from the new package.
