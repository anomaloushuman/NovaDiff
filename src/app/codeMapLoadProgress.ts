export type CodeMapGraphProgress = {
  message?: string;
  current?: number;
  total?: number;
  phase?: string;
};

export interface CodeMapLoadState {
  graphBuilding: boolean;
  graphProgress: CodeMapGraphProgress | null;
  graphReady: boolean;
  explorerMounted: boolean;
  cityLoading: boolean;
  cityReady: boolean;
  spawnTarget: number;
}

export interface CodeMapLoadSnapshot {
  percent: number;
  phase: string;
  detail: string | null;
  spawnCount: number;
  spawnTarget: number;
}

const GRAPH_END = 52;
const CITY_END = 88;
const MOUNT_END = 100;

function graphPercent(progress: CodeMapGraphProgress | null, building: boolean): number {
  if (progress?.phase === "done") {
    return GRAPH_END;
  }
  if (progress?.phase === "assemble") {
    return 48;
  }
  if (progress?.phase === "scan") {
    return 10;
  }
  if (
    progress?.current != null &&
    progress.total != null &&
    progress.total > 0
  ) {
    const ratio = progress.current / progress.total;
    return Math.round(12 + ratio * (GRAPH_END - 14));
  }
  if (building) {
    return 18;
  }
  return 8;
}

export function computeCodeMapLoadSnapshot(state: CodeMapLoadState): CodeMapLoadSnapshot {
  const target = Math.max(8, Math.min(72, state.spawnTarget || 32));

  if (!state.graphReady) {
    const percent = graphPercent(state.graphProgress, state.graphBuilding);
    const spawnCount = Math.max(
      2,
      Math.min(target, Math.floor((percent / GRAPH_END) * target * 0.55)),
    );
    return {
      percent,
      phase: "Knowledge graph",
      detail: state.graphProgress?.message ?? (state.graphBuilding ? "Building graph…" : "Preparing explorer…"),
      spawnCount,
      spawnTarget: target,
    };
  }

  if (!state.cityReady) {
    const base = state.cityLoading ? 56 : 72;
    const percent = state.cityLoading
      ? Math.min(CITY_END - 6, base + 4)
      : CITY_END - 2;
    const spawnCount = Math.min(
      target,
      Math.floor(target * (0.45 + (percent / 100) * 0.5)),
    );
    return {
      percent,
      phase: "Code city",
      detail: state.cityLoading ? "Spawning districts and buildings…" : "Finalizing city layout…",
      spawnCount,
      spawnTarget: target,
    };
  }

  if (!state.explorerMounted) {
    return {
      percent: 94,
      phase: "Explorer",
      detail: "Wiring graph and city views…",
      spawnCount: target,
      spawnTarget: target,
    };
  }

  return {
    percent: MOUNT_END,
    phase: "Ready",
    detail: null,
    spawnCount: target,
    spawnTarget: target,
  };
}

export function isCodeMapExperienceReady(state: {
  graphReady: boolean;
  explorerMounted: boolean;
  cityReady: boolean;
  graphBuilding: boolean;
}): boolean {
  return (
    state.graphReady &&
    state.explorerMounted &&
    state.cityReady &&
    !state.graphBuilding
  );
}

/** Crossfade from loading preview to live graph + city. */
export const CODE_MAP_HANDOFF_MS = 520;
