export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "dir";
  children: FileTreeNode[];
}

function insertPath(root: FileTreeNode, relPath: string) {
  const parts = relPath.split("/").filter(Boolean);
  if (parts.length === 0) {
    return;
  }
  let node = root;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isFile = i === parts.length - 1;
    const childPath = parts.slice(0, i + 1).join("/");
    let child = node.children.find((c) => c.name === part && c.type === (isFile ? "file" : "dir"));
    if (!child) {
      child = {
        name: part,
        path: childPath,
        type: isFile ? "file" : "dir",
        children: [],
      };
      node.children.push(child);
    }
    node = child;
  }
}

function sortNodes(nodes: FileTreeNode[]): FileTreeNode[] {
  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "dir" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

function sortTree(node: FileTreeNode): FileTreeNode {
  return {
    ...node,
    children: sortNodes(node.children.map(sortTree)),
  };
}

export function buildFileTree(paths: string[]): FileTreeNode {
  const root: FileTreeNode = { name: "", path: "", type: "dir", children: [] };
  for (const p of paths) {
    insertPath(root, p);
  }
  return sortTree(root);
}

function cloneFiltered(node: FileTreeNode, query: string): FileTreeNode | null {
  if (node.type === "file") {
    return node.path.toLowerCase().includes(query) ? { ...node, children: [] } : null;
  }
  const children = node.children
    .map((c) => cloneFiltered(c, query))
    .filter((c): c is FileTreeNode => c !== null);
  if (children.length > 0 || node.path.toLowerCase().includes(query)) {
    return { ...node, children };
  }
  return null;
}

export function filterFileTree(root: FileTreeNode, query: string): FileTreeNode {
  const q = query.trim().toLowerCase();
  if (!q) {
    return root;
  }
  const filtered = cloneFiltered(root, q);
  return filtered ?? { name: "", path: "", type: "dir", children: [] };
}

export function collectFolderPaths(node: FileTreeNode): string[] {
  const paths: string[] = [];
  const walk = (n: FileTreeNode) => {
    if (n.type === "dir" && n.path) {
      paths.push(n.path);
    }
    for (const c of n.children) {
      walk(c);
    }
  };
  walk(node);
  return paths;
}
