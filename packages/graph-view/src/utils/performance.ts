/** Shared thresholds for graph / explore performance modes. */

/** React Flow: skip off-screen node DOM when the graph is large. */
export const GRAPH_VISIBLE_ONLY_MIN_NODES = 100;

/**
 * ELK in a worker is disabled for now: Electron embed + large graphs can hang
 * without resolving, leaving the UI on "Computing layout…" with a blank graph.
 */
export const GRAPH_ELK_WORKER_MIN_NODES = Number.POSITIVE_INFINITY;

export function shouldOnlyRenderVisibleGraphElements(
  nodeCount: number,
  layoutReady: boolean,
): boolean {
  if (!layoutReady) {
    return false;
  }
  return nodeCount >= GRAPH_VISIBLE_ONLY_MIN_NODES;
}

export function shouldRunElkInWorker(_nodeCount: number): boolean {
  return false;
}

/** Count ELK layout nodes (containers + children). */
export function countElkLayoutNodes(children: Array<{ children?: unknown[] }>): number {
  let n = 0;
  const walk = (list: Array<{ children?: unknown[] }>) => {
    for (const ch of list) {
      n += 1;
      if (Array.isArray(ch.children) && ch.children.length > 0) {
        walk(ch.children as Array<{ children?: unknown[] }>);
      }
    }
  };
  walk(children);
  return n;
}
