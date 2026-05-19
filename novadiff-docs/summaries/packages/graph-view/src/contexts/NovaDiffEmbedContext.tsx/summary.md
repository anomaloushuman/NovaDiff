### Overview  
A new context module `packages/graph-view/src/contexts/NovaDiffEmbedContext.tsx` is added to expose typed APIs for NovaDiff embeds.

### Key changes  
- **Imports** – `createContext, useContext` from React added at line 1 (R1).  
- **Interfaces** –  
  - `NovaDiffSourceFile` (R3‑9) defines `path`, `language`, `content`, `sizeBytes`, `lineCount`.  
  - `ExplainCodeRequest` (R11‑17) specifies `filePath`, `startLine`, `endLine`, `snippet`, optional `symbolName`.  
  - `NovaDiffEmbedContextValue` (R19‑27) declares optional `readFile`, `embedMode`, and `explainCode`.  
- **Context** – `NovaDiffEmbedContext` created with an empty default at line 30 (R30).  
- **Hook** – `useNovaDiffEmbed` returns the context value (R32‑34).

### Impact  
- Provides a typed contract for embed consumers, improving compile‑time safety.  
- Introduces a new public API `useNovaDiffEmbed`; components must use this hook to access the context.  
- The default context is empty; consumers must guard against `undefined` properties, and missing providers can cause runtime errors.

### Risks & follow‑ups  
- **Provider coverage** – ensure all embed consumers are wrapped by a provider that supplies `readFile` and `explainCode`; otherwise the functions will be `undefined`.  
- **Runtime safety** – consider defensive checks or default no‑op implementations to avoid crashes.  
- **Linting** – run `npm run lint` to catch unused imports or type errors.  
- **Compatibility** – update any stale imports of `NovaDiffEmbedContext` to use the new hook or context.
