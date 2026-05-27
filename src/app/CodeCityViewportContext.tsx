import { createContext, useContext } from "react";

export interface CodeCityViewportState {
  /** Centered modal with filters (not the docked minimap). */
  expanded: boolean;
}

const CodeCityViewportContext = createContext<CodeCityViewportState>({
  expanded: false,
});

export function CodeCityViewportProvider({
  expanded,
  children,
}: {
  expanded: boolean;
  children: React.ReactNode;
}) {
  return (
    <CodeCityViewportContext.Provider value={{ expanded }}>
      {children}
    </CodeCityViewportContext.Provider>
  );
}

export function useCodeCityViewport(): CodeCityViewportState {
  return useContext(CodeCityViewportContext);
}
