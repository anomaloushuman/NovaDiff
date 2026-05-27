/** Debounce before erase starts after pointer/focus leaves. */
export const SIDEBAR_LEAVE_DELAY_MS = 160;

/** Max wait for label erase before panel width closes. */
export const SIDEBAR_ERASE_FALLBACK_MS = 580;

/** CSS width transition on `.launch-panel--side` / `.sidebar`. */
export const SIDEBAR_WIDTH_TRANSITION_MS = 320;

/** Full collapse: leave delay + erase + width (used when forcing close on navigation). */
export const SIDEBAR_FORCE_COLLAPSE_MS =
  SIDEBAR_ERASE_FALLBACK_MS + SIDEBAR_WIDTH_TRANSITION_MS;
