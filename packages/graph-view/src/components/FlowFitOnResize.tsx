import { useEffect, useRef } from "react";
import { useReactFlow } from "@xyflow/react";

/** Re-fit the viewport when the pane size changes (e.g. embedded in a tab that was hidden). */
export function FlowFitOnResize({ padding = 0.15 }: { padding?: number }) {
  const { fitView } = useReactFlow();
  const fitRef = useRef(fitView);
  fitRef.current = fitView;

  useEffect(() => {
    const pane = document.querySelector(".react-flow");
    if (!pane) {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | null = null;
    const scheduleFit = () => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        try {
          void fitRef.current({ padding, duration: 200 });
        } catch {
          /* pane not ready */
        }
      }, 80);
    };
    const ro = new ResizeObserver(scheduleFit);
    ro.observe(pane);
    scheduleFit();
    return () => {
      ro.disconnect();
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [padding]);

  return null;
}
