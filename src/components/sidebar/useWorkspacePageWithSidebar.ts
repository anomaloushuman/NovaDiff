import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkspacePage } from "../SidebarNav";
import type { UseSidebarExpandResult } from "./useSidebarExpand";

export function useWorkspacePageWithSidebar(
  sidebar: Pick<UseSidebarExpandResult, "panelExpanded" | "requestCollapse">,
) {
  const [workspacePage, setWorkspacePageState] = useState<WorkspacePage>("history");
  const [stagePage, setStagePage] = useState<WorkspacePage>("history");
  const pendingStageRef = useRef<WorkspacePage | null>(null);
  const collapseGenerationRef = useRef(0);

  const flushStage = useCallback((page: WorkspacePage) => {
    pendingStageRef.current = null;
    setStagePage(page);
  }, []);

  const scheduleStageLoad = useCallback(
    (page: WorkspacePage) => {
      if (page === stagePage && !sidebar.panelExpanded) {
        return;
      }
      if (!sidebar.panelExpanded) {
        flushStage(page);
        return;
      }

      pendingStageRef.current = page;
      const generation = ++collapseGenerationRef.current;

      void sidebar.requestCollapse().then(() => {
        if (
          collapseGenerationRef.current === generation &&
          pendingStageRef.current === page
        ) {
          flushStage(page);
        }
      });
    },
    [sidebar, flushStage],
  );

  const setWorkspacePage = useCallback(
    (page: WorkspacePage) => {
      setWorkspacePageState(page);
      scheduleStageLoad(page);
    },
    [scheduleStageLoad],
  );

  useEffect(() => {
    if (!sidebar.panelExpanded && pendingStageRef.current !== null) {
      flushStage(pendingStageRef.current);
    }
  }, [sidebar.panelExpanded, flushStage]);

  return {
    workspacePage,
    stagePage,
    setWorkspacePage,
  };
}
