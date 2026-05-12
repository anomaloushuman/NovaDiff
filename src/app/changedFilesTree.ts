import type { ChangeKind, FileChange } from "./types";

export interface DirNode {
  type: "dir";
  name: string;
  fullPath: string;
  children: Map<string, TreeNode>;
}

export interface FileNode {
  type: "file";
  name: string;
  fullPath: string;
  kind: ChangeKind;
}

export type TreeNode = DirNode | FileNode;

export type FlatRow =
  | {
      rowKind: "dir";
      name: string;
      fullPath: string;
      depth: number;
    }
  | {
      rowKind: "file";
      name: string;
      fullPath: string;
      depth: number;
      changeKind: ChangeKind;
    };

export function normalizePathSegments(path: string): string[] {
  return path
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\//, "")
    .split("/")
    .filter(Boolean);
}

export function ancestorDirPaths(filePath: string): string[] {
  const segs = normalizePathSegments(filePath);
  if (segs.length <= 1) {
    return [];
  }
  const out: string[] = [];
  for (let i = 0; i < segs.length - 1; i++) {
    out.push(segs.slice(0, i + 1).join("/"));
  }
  return out;
}

function sortChildren(nodes: TreeNode[]): TreeNode[] {
  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "dir" ? -1 : 1;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

function ensureDir(
  parent: DirNode,
  segment: string,
  fullPathSoFar: string,
): DirNode {
  const existing = parent.children.get(segment);
  if (existing?.type === "dir") {
    return existing;
  }
  if (existing?.type === "file") {
    parent.children.delete(segment);
  }
  const created: DirNode = {
    type: "dir",
    name: segment,
    fullPath: fullPathSoFar,
    children: new Map(),
  };
  parent.children.set(segment, created);
  return created;
}

/** Insert a changed file path into the tree (dirs created as needed). */
export function addFilePathToTree(root: DirNode, rawPath: string, kind: ChangeKind): void {
  const segs = normalizePathSegments(rawPath);
  if (segs.length === 0) {
    return;
  }
  let node = root;
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    const isLast = i === segs.length - 1;
    const pathPrefix = segs.slice(0, i + 1).join("/");
    if (isLast) {
      const cur = node.children.get(seg);
      if (cur?.type === "dir") {
        return;
      }
      node.children.set(seg, {
        type: "file",
        name: seg,
        fullPath: pathPrefix,
        kind,
      });
    } else {
      node = ensureDir(node, seg, pathPrefix);
    }
  }
}

export function buildChangedFilesTreeRoot(rows: FileChange[]): DirNode {
  const root: DirNode = {
    type: "dir",
    name: "",
    fullPath: "",
    children: new Map(),
  };
  const sorted = [...rows].sort(
    (a, b) =>
      normalizePathSegments(b.path).length - normalizePathSegments(a.path).length,
  );
  for (const r of sorted) {
    addFilePathToTree(root, r.path, r.kind);
  }
  return root;
}

export function flattenVisibleRows(root: DirNode, expandedDirs: Set<string>): FlatRow[] {
  const out: FlatRow[] = [];

  function walk(node: DirNode, depth: number): void {
    for (const child of sortChildren([...node.children.values()])) {
      if (child.type === "file") {
        out.push({
          rowKind: "file",
          name: child.name,
          fullPath: child.fullPath,
          depth,
          changeKind: child.kind,
        });
      } else {
        out.push({
          rowKind: "dir",
          name: child.name,
          fullPath: child.fullPath,
          depth,
        });
        if (expandedDirs.has(child.fullPath)) {
          walk(child, depth + 1);
        }
      }
    }
  }

  walk(root, 0);
  return out;
}
