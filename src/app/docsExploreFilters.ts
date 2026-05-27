import type { CodeCityChangeState } from "./types";

/** Coarse structure filters shared by Code City and the knowledge graph. */
export type SymbolKindGroup = "file" | "class" | "function";

export const ALL_SYMBOL_KIND_GROUPS: readonly SymbolKindGroup[] = [
  "file",
  "class",
  "function",
] as const;

export const ALL_CHANGE_STATE_FILTERS: readonly CodeCityChangeState[] = [
  "added",
  "modified",
  "removed",
  "unchanged",
] as const;

const CLASS_KINDS = new Set([
  "class",
  "interface",
  "struct",
  "enum",
  "trait",
  "type",
  "record",
]);

const FUNCTION_KINDS = new Set(["function", "method"]);

export function defaultSymbolKindGroups(): SymbolKindGroup[] {
  return [...ALL_SYMBOL_KIND_GROUPS];
}

export function defaultChangeStateFilters(): CodeCityChangeState[] {
  return [...ALL_CHANGE_STATE_FILTERS];
}

export function symbolKindGroupForKind(kind: string): SymbolKindGroup | null {
  if (kind === "file") {
    return "file";
  }
  if (CLASS_KINDS.has(kind)) {
    return "class";
  }
  if (FUNCTION_KINDS.has(kind)) {
    return "function";
  }
  return null;
}

/** Empty `enabled` means all structure groups are shown. */
export function symbolMatchesKindGroups(
  kind: string,
  enabled: readonly SymbolKindGroup[],
): boolean {
  if (enabled.length === 0) {
    return true;
  }
  const group = symbolKindGroupForKind(kind);
  if (!group) {
    return enabled.includes("function");
  }
  return enabled.includes(group);
}

/** Empty `enabled` means all change states are shown. */
export function changeStateMatchesFilters(
  changeState: CodeCityChangeState,
  enabled: readonly CodeCityChangeState[],
): boolean {
  if (enabled.length === 0) {
    return true;
  }
  return enabled.includes(changeState);
}

export function toggleSymbolKindGroup(
  current: SymbolKindGroup[],
  group: SymbolKindGroup,
): SymbolKindGroup[] {
  const set = new Set(current.length ? current : ALL_SYMBOL_KIND_GROUPS);
  if (set.has(group)) {
    if (set.size <= 1) {
      return [...set];
    }
    set.delete(group);
  } else {
    set.add(group);
  }
  return ALL_SYMBOL_KIND_GROUPS.filter((g) => set.has(g));
}

export function toggleChangeStateFilter(
  current: CodeCityChangeState[],
  state: CodeCityChangeState,
): CodeCityChangeState[] {
  const set = new Set(current.length ? current : ALL_CHANGE_STATE_FILTERS);
  if (set.has(state)) {
    if (set.size <= 1) {
      return [...set];
    }
    set.delete(state);
  } else {
    set.add(state);
  }
  return ALL_CHANGE_STATE_FILTERS.filter((s) => set.has(s));
}

export function symbolKindsFilterActive(enabled: readonly SymbolKindGroup[]): boolean {
  return (
    enabled.length > 0 &&
    enabled.length < ALL_SYMBOL_KIND_GROUPS.length
  );
}

export function changeStatesFilterActive(
  enabled: readonly CodeCityChangeState[],
): boolean {
  return (
    enabled.length > 0 &&
    enabled.length < ALL_CHANGE_STATE_FILTERS.length
  );
}

/** Map shared structure toggles to graph embed detail level. */
export function graphDetailFromSymbolKinds(enabled: readonly SymbolKindGroup[]): {
  detailLevel: "file" | "class";
  showFunctionsInClassView: boolean;
} {
  const set = new Set(
    enabled.length === 0 ? ALL_SYMBOL_KIND_GROUPS : enabled,
  );
  const hasFile = set.has("file");
  const hasClass = set.has("class");
  const hasFn = set.has("function");

  if (hasFile && !hasClass && !hasFn) {
    return { detailLevel: "file", showFunctionsInClassView: false };
  }
  if (!hasFile && !hasClass && hasFn) {
    return { detailLevel: "class", showFunctionsInClassView: true };
  }
  if (!hasFile && hasClass && !hasFn) {
    return { detailLevel: "class", showFunctionsInClassView: false };
  }
  if (hasClass || hasFn) {
    return { detailLevel: "class", showFunctionsInClassView: hasFn };
  }
  return { detailLevel: "file", showFunctionsInClassView: false };
}

export function exploreFilterKey(parts: Record<string, string | boolean | number>): string {
  return Object.entries(parts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("|");
}
