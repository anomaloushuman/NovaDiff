export const LAUNCH_SESSION_KEY = "novadiff-launch-done-v1";

/** Minimum time on the finished boot screen before transitioning to the app. */
export const LAUNCH_HOLD_MS = 2400;
/** Earliest moment the user can skip the hold (click / Enter). */
export const LAUNCH_HOLD_SKIP_AFTER_MS = 900;
export const LAUNCH_EXIT_FADE_MS = 580;
export const LAUNCH_REVEAL_MS = 1200;

export type LaunchPhase = "boot" | "reveal" | "ready";

export function readLaunchSkipped(): boolean {
  try {
    return sessionStorage.getItem(LAUNCH_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markLaunchComplete(): void {
  try {
    sessionStorage.setItem(LAUNCH_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}
