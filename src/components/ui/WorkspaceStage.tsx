import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "../../app/usePrefersReducedMotion";

export interface WorkspaceStageProps {
  pageKey: string;
  children: ReactNode;
}

export function WorkspaceStage({ pageKey, children }: WorkspaceStageProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <div className="workspace-stage">
      <div
        key={pageKey}
        className={`workspace-stage-inner${reduced ? "" : " ui-view-enter"}`}
      >
        {children}
      </div>
    </div>
  );
}
