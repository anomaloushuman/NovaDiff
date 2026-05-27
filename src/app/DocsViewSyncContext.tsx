import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CodeCityRenderableBuilding } from "./codeCityLayout";

export interface DocsViewSyncState {
  linkViews: boolean;
  focusMode: boolean;
  linkedNodeId: string | null;
  /** City building id when graph node id is unknown or not yet linked. */
  cityBuildingId: string | null;
  enteredFilePath: string | null;
  enteredBuilding: CodeCityRenderableBuilding | null;
  setLinkViews: (on: boolean) => void;
  setFocusMode: (on: boolean) => void;
  setSelectionFromGraph: (nodeId: string | null) => void;
  setSelectionFromCity: (nodeId: string | null, building?: CodeCityRenderableBuilding | null) => void;
  enterBuilding: (building: CodeCityRenderableBuilding, nodeId: string | null) => void;
  exitBuilding: () => void;
  clearSelection: () => void;
}

const DocsViewSyncContext = createContext<DocsViewSyncState | null>(null);

export function DocsViewSyncProvider({
  children,
  defaultLinkViews = true,
  defaultFocusMode = true,
}: {
  children: ReactNode;
  defaultLinkViews?: boolean;
  defaultFocusMode?: boolean;
}) {
  const [linkViews, setLinkViews] = useState(defaultLinkViews);
  const [focusMode, setFocusMode] = useState(defaultFocusMode);
  const [linkedNodeId, setLinkedNodeId] = useState<string | null>(null);
  const [cityBuildingId, setCityBuildingId] = useState<string | null>(null);
  const [enteredFilePath, setEnteredFilePath] = useState<string | null>(null);
  const [enteredBuilding, setEnteredBuilding] = useState<CodeCityRenderableBuilding | null>(
    null,
  );

  const setSelectionFromGraph = useCallback((nodeId: string | null) => {
    setLinkedNodeId(nodeId);
    setFocusMode(Boolean(nodeId));
    if (nodeId) {
      setCityBuildingId(null);
      return;
    }
    setCityBuildingId(null);
    setEnteredBuilding(null);
  }, []);

  const setSelectionFromCity = useCallback(
    (nodeId: string | null, building?: CodeCityRenderableBuilding | null) => {
      if (building) {
        setCityBuildingId(building.id);
        setEnteredBuilding(building);
        setFocusMode(true);
        if (nodeId) {
          setLinkedNodeId(nodeId);
        }
        return;
      }
      setLinkedNodeId(nodeId);
      setCityBuildingId(null);
      setFocusMode(Boolean(nodeId));
    },
    [],
  );

  const enterBuilding = useCallback(
    (building: CodeCityRenderableBuilding, nodeId: string | null) => {
      setLinkViews(true);
      setFocusMode(true);
      setEnteredFilePath(building.path);
      setEnteredBuilding(building);
      setCityBuildingId(building.id);
      setLinkedNodeId(nodeId);
    },
    [],
  );

  const exitBuilding = useCallback(() => {
    setEnteredFilePath(null);
    setEnteredBuilding(null);
    setLinkedNodeId(null);
    setCityBuildingId(null);
    setFocusMode(false);
  }, []);

  const clearSelection = useCallback(() => {
    setLinkedNodeId(null);
    setCityBuildingId(null);
    setEnteredBuilding(null);
    setFocusMode(false);
    if (enteredFilePath) {
      setEnteredFilePath(null);
    }
  }, [enteredFilePath]);

  const value = useMemo(
    () => ({
      linkViews,
      focusMode,
      linkedNodeId,
      cityBuildingId,
      enteredFilePath,
      enteredBuilding,
      setLinkViews,
      setFocusMode,
      setSelectionFromGraph,
      setSelectionFromCity,
      enterBuilding,
      exitBuilding,
      clearSelection,
    }),
    [
      linkViews,
      focusMode,
      linkedNodeId,
      cityBuildingId,
      enteredFilePath,
      enteredBuilding,
      setSelectionFromGraph,
      setSelectionFromCity,
      enterBuilding,
      exitBuilding,
      clearSelection,
    ],
  );

  return (
    <DocsViewSyncContext.Provider value={value}>{children}</DocsViewSyncContext.Provider>
  );
}

export function useDocsViewSync(): DocsViewSyncState {
  const ctx = useContext(DocsViewSyncContext);
  if (!ctx) {
    throw new Error("useDocsViewSync must be used within DocsViewSyncProvider");
  }
  return ctx;
}

export function useDocsViewSyncOptional(): DocsViewSyncState | null {
  return useContext(DocsViewSyncContext);
}

export function useDocsViewSyncExternalNode(
  nodeId: string | null | undefined,
  enabled: boolean,
) {
  const sync = useDocsViewSyncOptional();
  useEffect(() => {
    if (!enabled || !nodeId || !sync?.linkViews) {
      return;
    }
    sync.setSelectionFromGraph(nodeId);
  }, [enabled, nodeId, sync]);
}
