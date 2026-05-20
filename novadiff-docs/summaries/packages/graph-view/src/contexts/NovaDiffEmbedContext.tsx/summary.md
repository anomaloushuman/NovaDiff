### Overview
A new file `packages/graph-view/src/contexts/NovaDiffEmbedContext.tsx` has been added. It introduces a React context that exposes NovaDiff embed functionality to the graph‑view package.

### Key changes
- **Imports** – `createContext` and `useContext` from React are imported (line 1).  
- **`NovaDiffSourceFile`** (lines 3‑9) declares file metadata: `path`, `language`, `content`, `sizeBytes`, `lineCount`.  
- **`ExplainCodeRequest`** (lines 11‑17) defines the payload for LLM‑based code explanations.  
- **`NovaDiffEmbedContextValue`** (lines 19‑27) lists optional members: `readFile`, `embedMode`, and `explainCode`.  
- **Context creation** – `NovaDiffEmbedContext` is created with a default empty object (line 30).  
- **Hook** – `useNovaDiffEmbed` (lines 32‑34) returns `useContext(NovaDiffEmbedContext)`.

No other files were modified; the change is purely additive.

### Impact
The new context provides a public API for embedding NovaDiff features. Because the default value is `{}`, any consumer that does not wrap its component tree with `NovaDiffEmbedContext.Provider` will receive `undefined` for the optional members. This can lead to runtime errors if callers attempt to invoke `readFile` or `explainCode` without checking for existence.

### Risks & follow‑ups
- **Provider requirement** – The diff does not show any existing consumers; verify that components using `useNovaDiffEmbed` are wrapped in a provider to avoid `undefined` values.  
- **Runtime safety** – Guard against `undefined` callbacks; consider adding defensive checks or default no‑op implementations.  
- **Type coverage** – The empty default satisfies the TypeScript type but may mask missing properties during development; run linting to confirm no required fields are omitted.  
- **Testing** – Add unit tests that supply a provider and assert that `readFile` and `explainCode` are called correctly.
