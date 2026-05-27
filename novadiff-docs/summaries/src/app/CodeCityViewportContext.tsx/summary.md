### Overview  
A new file `src/app/CodeCityViewportContext.tsx` (added) introduces a React context for the CodeCity viewport state. It exports an interface, a provider component, and a hook to consume the `expanded` flag.

### Key changes  
- **Imports** – `createContext` and `useContext` from React (R1).  
- **State interface** – `export interface CodeCityViewportState { expanded: boolean; }` (R3‑R6).  
- **Context creation** – `const CodeCityViewportContext = createContext<CodeCityViewportState>({ expanded: false });` (R8‑R10).  
- **Provider** – `export function CodeCityViewportProvider({ expanded, children })` wraps children with the context value (R12‑R23).  
- **Hook** – `export function useCodeCityViewport(): CodeCityViewportState` returns `useContext(CodeCityViewportContext)` (R26‑R28).

### Impact  
- Components can read the `expanded` flag without prop drilling.  
- The default value `{ expanded: false }` is used when the provider is omitted.  
- The API is additive; no existing files are modified.

### Risks & follow‑ups  
- **Provider omission** – `useCodeCityViewport` will return the default state if called outside a provider; verify if this is acceptable.  
- **Naming collisions** – Ensure no other context or hook named `CodeCityViewportProvider`/`useCodeCityViewport` exists.  
- **Testing** – Add tests to confirm provider propagation and hook consumption.  
- **Documentation** – Update component docs to reference the new context API.
