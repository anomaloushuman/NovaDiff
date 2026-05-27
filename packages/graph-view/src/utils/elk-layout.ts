import type { GraphIssue } from "@novadiff/graph-core/schema";
import { loadElk } from "./elk-bundled";
import { NODE_WIDTH, NODE_HEIGHT } from "./layout";
import {
  countElkLayoutNodes,
  shouldRunElkInWorker,
} from "./performance";
import type {
  ElkWorkerRequest,
  ElkWorkerResponse,
} from "./elk-layout.worker";

export interface ElkChild {
  id: string;
  width?: number;
  height?: number;
  /** Set by ELK after layout; absent on input. Downstream consumers must default. */
  x?: number;
  y?: number;
  children?: ElkChild[];
  parentId?: string;
}

export interface ElkEdge {
  id: string;
  sources: string[];
  targets: string[];
}

export interface ElkInput {
  id: string;
  children: ElkChild[];
  edges: ElkEdge[];
  layoutOptions?: Record<string, string>;
}

// Keep ELK fallback dimensions in lockstep with the dagre/force NODE
// dimensions in utils/layout.ts so layouts stay collision-consistent
// during the migration.
const DEFAULT_NODE_WIDTH = NODE_WIDTH;
const DEFAULT_NODE_HEIGHT = NODE_HEIGHT;

interface RepairOptions {
  strict?: boolean;
}

interface RepairResult {
  input: ElkInput;
  issues: GraphIssue[];
}

function makeIssue(
  level: GraphIssue["level"],
  category: string,
  message: string,
): GraphIssue {
  return { level, category, message };
}

function maybeThrow(strict: boolean | undefined, issue: GraphIssue): void {
  if (strict) throw new Error(`[ELK repair] ${issue.level}: ${issue.message}`);
}

export function repairElkInput(
  input: ElkInput,
  opts: RepairOptions = {},
): RepairResult {
  const issues: GraphIssue[] = [];
  const strict = opts.strict;

  // 1. ensureNodeDimensions
  let dimsAdded = 0;
  const fillDims = (children: ElkChild[]): ElkChild[] =>
    children.map((c) => {
      const next: ElkChild = { ...c };
      if (next.width == null || next.height == null) {
        next.width = next.width ?? DEFAULT_NODE_WIDTH;
        next.height = next.height ?? DEFAULT_NODE_HEIGHT;
        dimsAdded++;
      }
      if (next.children) next.children = fillDims(next.children);
      return next;
    });
  const childrenA = fillDims(input.children);
  if (dimsAdded > 0) {
    const issue = makeIssue(
      "auto-corrected",
      "elk-missing-dimensions",
      `Set default dimensions on ${dimsAdded} node(s) missing width/height.`,
    );
    issues.push(issue);
    maybeThrow(strict, issue);
  }

  // 2. dedupeNodeIds (per parent)
  let dupesRemoved = 0;
  const dedupe = (children: ElkChild[]): ElkChild[] => {
    const seen = new Set<string>();
    const out: ElkChild[] = [];
    for (const c of children) {
      if (seen.has(c.id)) {
        dupesRemoved++;
        continue;
      }
      seen.add(c.id);
      out.push({
        ...c,
        children: c.children ? dedupe(c.children) : undefined,
      });
    }
    return out;
  };
  const childrenB = dedupe(childrenA);
  if (dupesRemoved > 0) {
    const issue = makeIssue(
      "auto-corrected",
      "elk-duplicate-id",
      `Removed ${dupesRemoved} duplicate child id(s).`,
    );
    issues.push(issue);
    maybeThrow(strict, issue);
  }

  // 3. dropOrphanChildren — children whose parentId references nonexistent parent
  const allIds = new Set<string>();
  const walk = (children: ElkChild[]) => {
    for (const c of children) {
      allIds.add(c.id);
      if (c.children) walk(c.children);
    }
  };
  walk(childrenB);
  let orphanChildren = 0;
  const childrenC = childrenB.filter((c) => {
    if (c.parentId && !allIds.has(c.parentId)) {
      orphanChildren++;
      return false;
    }
    return true;
  });
  if (orphanChildren > 0) {
    const issue = makeIssue(
      "dropped",
      "elk-orphan-parent",
      `Dropped ${orphanChildren} child(ren) with missing parent reference.`,
    );
    issues.push(issue);
    maybeThrow(strict, issue);
  }

  // 4. dropOrphanEdges
  let orphanEdges = 0;
  const edges = input.edges.filter((e) => {
    const ok = e.sources.every((s) => allIds.has(s)) &&
      e.targets.every((t) => allIds.has(t));
    if (!ok) {
      orphanEdges++;
      return false;
    }
    return true;
  });
  if (orphanEdges > 0) {
    const issue = makeIssue(
      "dropped",
      "elk-orphan-edge",
      `Dropped ${orphanEdges} edge(s) referencing nonexistent nodes.`,
    );
    issues.push(issue);
    maybeThrow(strict, issue);
  }

  // 5. dropCircularContainment
  const parentOf = new Map<string, string>();
  const fillParents = (children: ElkChild[], parent?: string) => {
    for (const c of children) {
      if (parent) parentOf.set(c.id, parent);
      if (c.children) fillParents(c.children, c.id);
    }
  };
  fillParents(childrenC);
  let cyclesRemoved = 0;
  const isCyclic = (id: string): boolean => {
    const seen = new Set<string>();
    let cur = parentOf.get(id);
    while (cur) {
      if (cur === id || seen.has(cur)) return true;
      seen.add(cur);
      cur = parentOf.get(cur);
    }
    return false;
  };
  const stripCycles = (children: ElkChild[]): ElkChild[] =>
    children
      .filter((c) => {
        if (isCyclic(c.id)) {
          cyclesRemoved++;
          return false;
        }
        return true;
      })
      .map((c) => ({
        ...c,
        children: c.children ? stripCycles(c.children) : undefined,
      }));
  const childrenD = stripCycles(childrenC);
  if (cyclesRemoved > 0) {
    const issue = makeIssue(
      "dropped",
      "elk-containment-cycle",
      `Dropped ${cyclesRemoved} node(s) in containment cycles.`,
    );
    issues.push(issue);
    maybeThrow(strict, issue);
  }

  return {
    input: { ...input, children: childrenD, edges },
    issues,
  };
}

export interface ElkLayoutOptions {
  strict?: boolean;
}

export interface ElkLayoutResult {
  positioned: ElkInput;
  issues: GraphIssue[];
}

let layoutWorker: Worker | null = null;
let layoutWorkerSeq = 0;
const layoutWorkerPending = new Map<
  number,
  { resolve: (value: unknown) => void; reject: (reason: Error) => void }
>();

function ensureLayoutWorker(): Worker {
  if (!layoutWorker) {
    layoutWorker = new Worker(
      new URL("./elk-layout.worker.ts", import.meta.url),
      { type: "module" },
    );
    layoutWorker.onmessage = (event: MessageEvent<ElkWorkerResponse>) => {
      const data = event.data;
      const pending = layoutWorkerPending.get(data.requestId);
      if (!pending) {
        return;
      }
      layoutWorkerPending.delete(data.requestId);
      if (data.ok) {
        pending.resolve(data.positioned);
      } else {
        pending.reject(new Error(data.error));
      }
    };
    layoutWorker.onerror = (event) => {
      const err = new Error(event.message || "ELK layout worker failed");
      for (const [, pending] of layoutWorkerPending) {
        pending.reject(err);
      }
      layoutWorkerPending.clear();
      layoutWorker = null;
    };
  }
  return layoutWorker;
}

function runElkLayoutInWorker(input: ElkInput): Promise<unknown> {
  const worker = ensureLayoutWorker();
  const requestId = ++layoutWorkerSeq;
  return new Promise((resolve, reject) => {
    layoutWorkerPending.set(requestId, { resolve, reject });
    const msg: ElkWorkerRequest = { requestId, input };
    worker.postMessage(msg);
  });
}

async function runElkLayoutOnMainThread(input: ElkInput): Promise<ElkInput> {
  const elk = await loadElk();
  return (await elk.layout(input as never)) as ElkInput;
}

/** Simple grid when ELK fails so nodes are not stacked at (0,0). */
export function applyElkGridFallback(input: ElkInput): ElkInput {
  const gapX = 72;
  const gapY = 88;
  const cols = Math.max(1, Math.ceil(Math.sqrt(input.children.length)));
  const children = input.children.map((child, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const w = child.width ?? DEFAULT_NODE_WIDTH;
    const h = child.height ?? DEFAULT_NODE_HEIGHT;
    return {
      ...child,
      x: col * (w + gapX),
      y: row * (h + gapY),
    };
  });
  return { ...input, children };
}

export async function applyElkLayout(
  input: ElkInput,
  opts: ElkLayoutOptions = {},
): Promise<ElkLayoutResult> {
  const { input: repaired, issues } = repairElkInput(input, opts);
  const nodeCount = countElkLayoutNodes(repaired.children);
  try {
    const positioned = shouldRunElkInWorker(nodeCount)
      ? ((await runElkLayoutInWorker(repaired)) as ElkInput)
      : await runElkLayoutOnMainThread(repaired);
    return { positioned, issues };
  } catch (err) {
    const fatal: GraphIssue = {
      level: "fatal",
      category: "elk-layout-failed",
      message:
        `ELK layout failed: ${err instanceof Error ? err.message : String(err)}. ` +
        `This looks like a dashboard rendering bug — please file an issue with the copied error.`,
    };
    if (opts.strict) throw err;
    return {
      positioned: applyElkGridFallback(repaired),
      issues: [...issues, fatal],
    };
  }
}
