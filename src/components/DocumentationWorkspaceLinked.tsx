import { useCallback, useMemo, type ReactNode } from "react";
import type { GraphPayload } from "./KnowledgeGraphPanel";
import {
  buildBuildingIdByGraphNode,
  cityBuildingIdsForHighlight,
  cityBuildingToGraphNodeId,
  graphEdgesToCityPairs,
} from "../app/graphCityBridge";
import {
  DocsViewSyncProvider,
  useDocsViewSync,
  useDocsViewSyncExternalNode,
} from "../app/DocsViewSyncContext";
import type { CodeCityLayoutResult, CodeCityRenderableBuilding } from "../app/codeCityLayout";

export interface InitialDocsFocus {
  paths?: string[];
  openCity?: boolean;
  linkViews?: boolean;
  changedOnly?: boolean;
  nodeId?: string | null;
}

export function DocumentationWorkspaceSyncRoot({
  children,
  initialDocsFocus,
}: {
  children: ReactNode;
  initialDocsFocus?: InitialDocsFocus;
}) {
  return (
    <DocsViewSyncProvider defaultLinkViews={initialDocsFocus?.linkViews !== false}>
      <DocsFocusBootstrap initialDocsFocus={initialDocsFocus} />
      {children}
    </DocsViewSyncProvider>
  );
}

function DocsFocusBootstrap({ initialDocsFocus }: { initialDocsFocus?: InitialDocsFocus }) {
  useDocsViewSyncExternalNode(initialDocsFocus?.nodeId ?? null, Boolean(initialDocsFocus));
  return null;
}

export function useLinkedCityState(
  graphPayload: GraphPayload | null,
  cityLayout: CodeCityLayoutResult,
  cityRootSide: "baseline" | "target",
) {
  const sync = useDocsViewSync();

  const filteredLayout = useMemo((): CodeCityLayoutResult => {
    if (!sync.enteredFilePath) {
      return cityLayout;
    }
    const buildings = cityLayout.buildings.filter((b) => b.path === sync.enteredFilePath);
    const districts = cityLayout.districts.filter((d) =>
      buildings.some(
        (b) =>
          b.x >= d.x - d.width / 2 - 6 &&
          b.x <= d.x + d.width / 2 + 6 &&
          b.z >= d.z - d.depth / 2 - 6 &&
          b.z <= d.z + d.depth / 2 + 6,
      ),
    );
    return {
      ...cityLayout,
      buildings,
      districts: districts.length > 0 ? districts : cityLayout.districts.slice(0, 1),
    };
  }, [cityLayout, sync.enteredFilePath]);

  const buildingByNode = useMemo(
    () =>
      buildBuildingIdByGraphNode(
        graphPayload?.graph ?? null,
        filteredLayout,
        cityRootSide,
      ),
    [graphPayload?.graph, filteredLayout, cityRootSide],
  );

  const inFileMode = Boolean(sync.enteredFilePath);

  const selectionActive = Boolean(sync.linkedNodeId);

  const { primary, highlightIds } = useMemo(
    () =>
      cityBuildingIdsForHighlight(
        graphPayload?.graph ?? null,
        filteredLayout,
        cityRootSide,
        sync.linkedNodeId,
        selectionActive,
      ),
    [
      graphPayload?.graph,
      filteredLayout,
      cityRootSide,
      sync.linkedNodeId,
      selectionActive,
    ],
  );

  const edgeOverlays = useMemo(
    () =>
      graphEdgesToCityPairs(
        graphPayload?.graph ?? null,
        sync.linkedNodeId,
        buildingByNode,
        50,
      ),
    [graphPayload?.graph, sync.linkedNodeId, buildingByNode],
  );

  const selectedBuilding = useMemo(() => {
    if (!primary) {
      return sync.enteredBuilding;
    }
    return filteredLayout.buildings.find((b) => b.id === primary) ?? sync.enteredBuilding;
  }, [primary, filteredLayout.buildings, sync.enteredBuilding]);

  const onGraphSelectionChange = useCallback(
    (nodeId: string | null) => {
      sync.setSelectionFromGraph(nodeId);
      if (!nodeId && sync.enteredFilePath) {
        sync.exitBuilding();
      }
    },
    [sync],
  );

  const onCitySelect = useCallback(
    (building: CodeCityRenderableBuilding | null) => {
      if (!building) {
        if (sync.enteredFilePath) {
          sync.exitBuilding();
        } else {
          sync.clearSelection();
        }
        return;
      }
      const nodeId = cityBuildingToGraphNodeId(building, graphPayload?.graph ?? null);
      sync.setSelectionFromCity(nodeId, building);
    },
    [sync, graphPayload?.graph],
  );

  const onCityEnter = useCallback(
    (building: CodeCityRenderableBuilding) => {
      const nodeId = cityBuildingToGraphNodeId(building, graphPayload?.graph ?? null);
      sync.enterBuilding(building, nodeId);
    },
    [sync, graphPayload?.graph],
  );

  const onCityExit = useCallback(() => {
    sync.exitBuilding();
  }, [sync]);

  return {
    sync,
    filteredLayout,
    selectedBuilding,
    primaryBuildingId: primary,
    highlightBuildingIds: highlightIds,
    focusBuildingId: primary,
    edgeOverlays,
    onGraphSelectionChange,
    onCitySelect,
    onCityEnter,
    onCityExit,
    inFileMode,
  };
}

export function CodeCityGraphToolbar({
  inFileMode,
  enteredLabel,
  onExit,
}: {
  inFileMode: boolean;
  enteredLabel: string | null;
  onExit: () => void;
}) {
  return (
    <div className="code-city-graph-toolbar" role="toolbar" aria-label="Code city and graph">
      <span className="code-city-graph-toolbar-hint">
        Click a building to highlight its symbol on the map. Double-click to enter the file layer.
      </span>
      {inFileMode && enteredLabel ? (
        <>
          <span className="code-city-graph-breadcrumb">
            <button type="button" className="code-city-graph-breadcrumb-btn" onClick={onExit}>
              City
            </button>
            <span aria-hidden> › </span>
            <code>{enteredLabel}</code>
          </span>
          <button type="button" className="doc-workspace-copy-btn" onClick={onExit}>
            Exit building
          </button>
        </>
      ) : null}
    </div>
  );
}

export function DocsLinkToolbar() {
  return (
    <p className="doc-workspace-muted docs-link-hint">
      City and knowledge graph stay linked. Selecting a symbol highlights its file cluster and
      graph neighborhood; clearing selection returns the camera to all filtered buildings.
    </p>
  );
}
