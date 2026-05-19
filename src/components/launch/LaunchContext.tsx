import { createContext, useContext } from "react";
import type { LaunchPhase } from "../../app/launchSequence";

export interface LaunchContextValue {
  phase: LaunchPhase;
  skipSequence: boolean;
  brandReveal: boolean;
}

const LaunchContext = createContext<LaunchContextValue>({
  phase: "ready",
  skipSequence: true,
  brandReveal: true,
});

export function LaunchProvider({
  value,
  children,
}: {
  value: LaunchContextValue;
  children: React.ReactNode;
}) {
  return <LaunchContext.Provider value={value}>{children}</LaunchContext.Provider>;
}

export function useLaunch(): LaunchContextValue {
  return useContext(LaunchContext);
}
