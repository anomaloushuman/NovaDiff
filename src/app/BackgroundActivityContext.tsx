import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type BackgroundActivityKind =
  | "compare"
  | "prefetch"
  | "diff"
  | "outline"
  | "filter"
  | "graph"
  | "llm"
  | "docs"
  | "city"
  | "other";

export interface BackgroundActivity {
  id: string;
  kind: BackgroundActivityKind;
  label: string;
  detail?: string;
  /** 0–100 when known; null = indeterminate */
  progress: number | null;
  startedAt: number;
}

type UpsertPatch = Partial<Omit<BackgroundActivity, "id">> & {
  id: string;
  label?: string;
};

function sameActivity(a: BackgroundActivity, b: BackgroundActivity): boolean {
  return (
    a.id === b.id &&
    a.kind === b.kind &&
    a.label === b.label &&
    a.detail === b.detail &&
    a.progress === b.progress &&
    a.startedAt === b.startedAt
  );
}

interface BackgroundActivityActions {
  upsertActivity: (patch: UpsertPatch) => void;
  removeActivity: (id: string) => void;
  clearActivities: (kind?: BackgroundActivityKind) => void;
}

interface BackgroundActivityContextValue extends BackgroundActivityActions {
  activities: BackgroundActivity[];
}

const BackgroundActivityContext = createContext<BackgroundActivityContextValue | null>(
  null,
);

const BackgroundActivityActionsContext =
  createContext<BackgroundActivityActions | null>(null);

export function BackgroundActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<BackgroundActivity[]>([]);

  const upsertActivity = useCallback((patch: UpsertPatch) => {
    setActivities((prev) => {
      const idx = prev.findIndex((a) => a.id === patch.id);
      const base: BackgroundActivity =
        idx >= 0
          ? { ...prev[idx], ...patch, id: patch.id }
          : {
              id: patch.id,
              kind: patch.kind ?? "other",
              label: patch.label ?? "Working…",
              detail: patch.detail,
              progress: patch.progress ?? null,
              startedAt: patch.startedAt ?? Date.now(),
            };
      if (idx >= 0 && sameActivity(prev[idx], base)) {
        return prev;
      }
      const next =
        idx >= 0
          ? prev.map((a, i) => (i === idx ? base : a))
          : [...prev, base];
      const sorted = [...next].sort((a, b) => a.startedAt - b.startedAt);
      if (
        sorted.length === prev.length &&
        sorted.every((item, i) => sameActivity(item, prev[i] ?? item))
      ) {
        return prev;
      }
      return sorted;
    });
  }, []);

  const removeActivity = useCallback((id: string) => {
    setActivities((prev) => {
      if (!prev.some((a) => a.id === id)) {
        return prev;
      }
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const clearActivities = useCallback((kind?: BackgroundActivityKind) => {
    setActivities((prev) => {
      if (!kind) {
        return prev.length === 0 ? prev : [];
      }
      if (!prev.some((a) => a.kind === kind)) {
        return prev;
      }
      return prev.filter((a) => a.kind !== kind);
    });
  }, []);

  const actions = useMemo(
    () => ({ upsertActivity, removeActivity, clearActivities }),
    [upsertActivity, removeActivity, clearActivities],
  );

  const value = useMemo(
    () => ({ activities, ...actions }),
    [activities, actions],
  );

  return (
    <BackgroundActivityActionsContext.Provider value={actions}>
      <BackgroundActivityContext.Provider value={value}>
        {children}
      </BackgroundActivityContext.Provider>
    </BackgroundActivityActionsContext.Provider>
  );
}

export function useBackgroundActivity() {
  const ctx = useContext(BackgroundActivityContext);
  if (!ctx) {
    throw new Error("useBackgroundActivity must be used within BackgroundActivityProvider");
  }
  return ctx;
}

/** Safe no-op hook for optional embed paths */
export function useBackgroundActivityOptional() {
  return useContext(BackgroundActivityContext);
}

/** Stable action refs — safe in effect dependency arrays (unlike the full context value). */
export function useBackgroundActivityActions() {
  const ctx = useContext(BackgroundActivityActionsContext);
  if (!ctx) {
    throw new Error(
      "useBackgroundActivityActions must be used within BackgroundActivityProvider",
    );
  }
  return ctx;
}

export function useBackgroundActivityActionsOptional() {
  return useContext(BackgroundActivityActionsContext);
}
