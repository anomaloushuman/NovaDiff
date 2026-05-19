import { useEffect, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { useDashboardStore } from "../store";
import { useNovaDiffEmbed } from "../contexts/NovaDiffEmbedContext";

const EXPAND_POLL_MS = 100;
const EXPAND_TIMEOUT_MS = 120_000;

export interface EmbedAutoExpandInput {
  navigationLevel: "overview" | "layer-detail";
  activeLayerId: string | null;
  layoutReady: boolean;
  containerIds: string[] | undefined;
  graphFingerprint: string | undefined;
}

function containersFullyLaidOut(containerIds: string[]): boolean {
  const { expandedContainers, containerLayoutCache } = useDashboardStore.getState();
  return containerIds.every(
    (id) => expandedContainers.has(id) && containerLayoutCache.has(id),
  );
}

function waitForContainerLayouts(containerIds: string[]): Promise<void> {
  return new Promise((resolve) => {
    const deadline = Date.now() + EXPAND_TIMEOUT_MS;
    const poll = () => {
      if (containersFullyLaidOut(containerIds) || Date.now() > deadline) {
        resolve();
        return;
      }
      window.setTimeout(poll, EXPAND_POLL_MS);
    };
    poll();
  });
}

/**
 * NovaDiff embed: open project-wide class depth, expand folder containers
 * once layouts exist, then fit the viewport at a readable zoom.
 */
export function useEmbedAutoExpand(input: EmbedAutoExpandInput): boolean {
  const { embedMode = false } = useNovaDiffEmbed();
  const { fitView } = useReactFlow();
  const expandManyContainers = useDashboardStore((s) => s.expandManyContainers);
  const [isExpanding, setIsExpanding] = useState(false);
  const runKeyRef = useRef<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!embedMode || input.navigationLevel !== "overview") {
      return;
    }
    useDashboardStore.getState().enterNovaDiffEmbedDepth();
  }, [embedMode, input.navigationLevel]);

  useEffect(() => {
    cancelledRef.current = false;

    if (!embedMode || input.navigationLevel !== "layer-detail") {
      setIsExpanding(false);
      return;
    }
    if (!input.layoutReady || !input.containerIds?.length || !input.graphFingerprint) {
      return;
    }

    const key = `${input.graphFingerprint}|${input.activeLayerId ?? ""}|${input.containerIds.length}`;
    if (runKeyRef.current === key) {
      return;
    }
    runKeyRef.current = key;

    const allIds = input.containerIds;
    const already = useDashboardStore.getState().expandedContainers;
    const toExpand = allIds.filter((id) => !already.has(id));

    const finishFit = () => {
      if (cancelledRef.current) return;
      setIsExpanding(false);
      requestAnimationFrame(() => {
        fitView({
          duration: 550,
          padding: 0.28,
          maxZoom: 1,
          minZoom: 0.2,
        });
      });
    };

    if (toExpand.length === 0) {
      if (allIds.every((id) => already.has(id) && containersFullyLaidOut([id]))) {
        finishFit();
      }
      return;
    }

    setIsExpanding(true);
    expandManyContainers(toExpand);

    void waitForContainerLayouts(toExpand).then(() => {
      if (!cancelledRef.current) {
        finishFit();
      }
    });

    return () => {
      cancelledRef.current = true;
    };
  }, [
    embedMode,
    input.navigationLevel,
    input.activeLayerId,
    input.layoutReady,
    input.containerIds,
    input.graphFingerprint,
    expandManyContainers,
    fitView,
  ]);

  useEffect(() => {
    if (!input.graphFingerprint || input.layoutReady) {
      return;
    }
    runKeyRef.current = null;
  }, [input.graphFingerprint, input.layoutReady]);

  return isExpanding;
}
