import { useCallback, useEffect, useRef, useState, type FocusEvent } from "react";
import {
  SIDEBAR_ERASE_FALLBACK_MS,
  SIDEBAR_LEAVE_DELAY_MS,
  SIDEBAR_WIDTH_TRANSITION_MS,
} from "./sidebarTiming";

export type SidebarTextPhase = "hidden" | "typing" | "erasing";

export interface UseSidebarExpandResult {
  /** Panel is visually expanded (open width). */
  panelExpanded: boolean;
  textPhase: SidebarTextPhase;
  /** Forward typewriter should run while expanding. */
  typingActive: boolean;
  /** Reverse typewriter should run before width collapses. */
  erasingActive: boolean;
  /** Await full collapse (erase + width). Resolves immediately if already collapsed. */
  requestCollapse: () => Promise<void>;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onFocusCapture: () => void;
  onBlurCapture: (event: FocusEvent) => void;
}

export function useSidebarExpand(): UseSidebarExpandResult {
  const [pointerInside, setPointerInside] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [textPhase, setTextPhase] = useState<SidebarTextPhase>("hidden");

  const wantOpenRef = useRef(false);
  const leaveTimerRef = useRef<number | null>(null);
  const eraseTimerRef = useRef<number | null>(null);
  const widthTimerRef = useRef<number | null>(null);
  const forceCloseRef = useRef(false);
  const collapseWaitersRef = useRef<Array<() => void>>([]);

  const wantOpen = pointerInside || focusInside;
  wantOpenRef.current = wantOpen;

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current != null) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const clearEraseTimer = useCallback(() => {
    if (eraseTimerRef.current != null) {
      window.clearTimeout(eraseTimerRef.current);
      eraseTimerRef.current = null;
    }
  }, []);

  const clearWidthTimer = useCallback(() => {
    if (widthTimerRef.current != null) {
      window.clearTimeout(widthTimerRef.current);
      widthTimerRef.current = null;
    }
  }, []);

  const notifyCollapseDone = useCallback(() => {
    const waiters = collapseWaitersRef.current;
    collapseWaitersRef.current = [];
    for (const resolve of waiters) {
      resolve();
    }
  }, []);

  const finishCollapse = useCallback(() => {
    clearEraseTimer();
    if (wantOpenRef.current && !forceCloseRef.current) {
      return;
    }
    setPanelExpanded(false);
    setTextPhase("hidden");
    clearWidthTimer();
    widthTimerRef.current = window.setTimeout(() => {
      widthTimerRef.current = null;
      forceCloseRef.current = false;
      notifyCollapseDone();
    }, SIDEBAR_WIDTH_TRANSITION_MS);
  }, [clearEraseTimer, clearWidthTimer, notifyCollapseDone]);

  const startErase = useCallback(() => {
    setTextPhase("erasing");
    clearEraseTimer();
    eraseTimerRef.current = window.setTimeout(finishCollapse, SIDEBAR_ERASE_FALLBACK_MS);
  }, [clearEraseTimer, finishCollapse]);

  const requestCollapse = useCallback((): Promise<void> => {
    if (!panelExpanded && textPhase === "hidden") {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      collapseWaitersRef.current.push(resolve);
      forceCloseRef.current = true;
      setPointerInside(false);
      setFocusInside(false);
      clearLeaveTimer();
      clearEraseTimer();
      clearWidthTimer();

      if (textPhase === "erasing") {
        return;
      }
      if (panelExpanded) {
        startErase();
        return;
      }
      forceCloseRef.current = false;
      const waiters = collapseWaitersRef.current;
      collapseWaitersRef.current = [];
      resolve();
      for (const waiter of waiters) {
        if (waiter !== resolve) {
          waiter();
        }
      }
    });
  }, [
    panelExpanded,
    textPhase,
    clearLeaveTimer,
    clearEraseTimer,
    clearWidthTimer,
    startErase,
  ]);

  useEffect(() => {
    if (wantOpen && !forceCloseRef.current) {
      clearLeaveTimer();
      clearEraseTimer();
      clearWidthTimer();
      setPanelExpanded(true);
      setTextPhase((phase) => (phase === "erasing" ? "typing" : "typing"));
      return;
    }

    if (forceCloseRef.current) {
      return;
    }

    clearLeaveTimer();
    leaveTimerRef.current = window.setTimeout(() => {
      leaveTimerRef.current = null;
      if (!wantOpenRef.current && panelExpanded) {
        startErase();
      }
    }, SIDEBAR_LEAVE_DELAY_MS);

    return clearLeaveTimer;
  }, [
    wantOpen,
    panelExpanded,
    clearLeaveTimer,
    clearEraseTimer,
    clearWidthTimer,
    startErase,
  ]);

  useEffect(
    () => () => {
      clearLeaveTimer();
      clearEraseTimer();
      clearWidthTimer();
      collapseWaitersRef.current = [];
    },
    [clearLeaveTimer, clearEraseTimer, clearWidthTimer],
  );

  const onPointerEnter = useCallback(() => {
    if (forceCloseRef.current) {
      return;
    }
    setPointerInside(true);
  }, []);

  const onPointerLeave = useCallback(() => setPointerInside(false), []);
  const onFocusCapture = useCallback(() => {
    if (forceCloseRef.current) {
      return;
    }
    setFocusInside(true);
  }, []);

  const onBlurCapture = useCallback((event: FocusEvent) => {
    const next = event.currentTarget;
    if (!next.contains(event.relatedTarget as Node | null)) {
      setFocusInside(false);
    }
  }, []);

  const erasingActive = textPhase === "erasing";
  const typingActive =
    panelExpanded && textPhase === "typing" && wantOpen && !erasingActive;

  return {
    panelExpanded,
    textPhase,
    typingActive,
    erasingActive,
    requestCollapse,
    onPointerEnter,
    onPointerLeave,
    onFocusCapture,
    onBlurCapture,
  };
}
