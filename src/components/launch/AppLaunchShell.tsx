import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LAUNCH_REVEAL_MS,
  type LaunchPhase,
  markLaunchComplete,
  readLaunchSkipped,
} from "../../app/launchSequence";
import { usePrefersReducedMotion } from "../../app/usePrefersReducedMotion";
import { LaunchProvider } from "./LaunchContext";
import { LaunchBoot } from "./LaunchBoot";
import "./launch.css";

export interface AppLaunchShellProps {
  chrome?: React.ReactNode;
  children: React.ReactNode;
  onPhaseChange?: (phase: LaunchPhase) => void;
  /** Extra classes on `.app-shell` (e.g. sidebar overlay mode). */
  shellClassName?: string;
}

export function AppLaunchShell({
  chrome,
  children,
  onPhaseChange,
  shellClassName,
}: AppLaunchShellProps) {
  const reduced = usePrefersReducedMotion();
  const skipSequence = useMemo(
    () => reduced || readLaunchSkipped(),
    [reduced],
  );
  const [phase, setPhase] = useState<LaunchPhase>(skipSequence ? "ready" : "boot");
  const [bootVisible, setBootVisible] = useState(!skipSequence);

  const onBootExitComplete = useCallback(() => {
    setBootVisible(false);
    setPhase("reveal");
    markLaunchComplete();
  }, []);

  useEffect(() => {
    if (phase !== "reveal") {
      return;
    }
    const id = window.setTimeout(() => setPhase("ready"), LAUNCH_REVEAL_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  const contextValue = useMemo(
    () => ({
      phase,
      skipSequence,
      brandReveal: phase === "reveal" || phase === "ready",
    }),
    [phase, skipSequence],
  );

  const motionClass = [
    phase !== "boot" ? "is-launched" : "",
    phase === "reveal" ? "is-revealing" : "",
    phase === "ready" ? "is-ready" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const shellClass = ["app-shell", motionClass, shellClassName].filter(Boolean).join(" ");

  return (
    <LaunchProvider value={contextValue}>
      {bootVisible ? <LaunchBoot onExitComplete={onBootExitComplete} /> : null}
      {chrome ? (
        <div className={`launch-panel launch-panel--chrome ${motionClass}`.trim()}>
          {chrome}
        </div>
      ) : null}
      <div className={shellClass}>{children}</div>
    </LaunchProvider>
  );
}
