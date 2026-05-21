import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FileText, Folder, Loader2, Search } from "lucide-react";
import type { GitBlameAtRefResult } from "../app/gitTypes";
import type { WorkspaceCommitSnapshot } from "../app/workspaceTypes";
import { buildFileTree, collectFolderPaths, filterFileTree, type FileTreeNode } from "../app/fileTree";
import { GitBlameLineModal } from "./GitBlameLineModal";

export interface GitBlamePanelProps {
  repoRoot: string;
  commit: WorkspaceCommitSnapshot;
  onClose: () => void;
}

function TreeRows({
  node,
  depth,
  expanded,
  selectedPath,
  onToggle,
  onSelectFile,
}: {
  node: FileTreeNode;
  depth: number;
  expanded: Set<string>;
  selectedPath: string;
  onToggle: (path: string) => void;
  onSelectFile: (path: string) => void;
}) {
  if (node.type === "file") {
    return (
      <li>
        <button
          type="button"
          className={`git-blame-tree-row git-blame-tree-row--file${selectedPath === node.path ? " active" : ""}`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => onSelectFile(node.path)}
        >
          <FileText size={14} className="git-blame-tree-icon" aria-hidden />
          <span className="git-blame-tree-label">{node.name}</span>
        </button>
      </li>
    );
  }

  const isRoot = !node.path;
  if (isRoot) {
    return (
      <>
        {node.children.map((child) => (
          <TreeRows
            key={child.path || child.name}
            node={child}
            depth={depth}
            expanded={expanded}
            selectedPath={selectedPath}
            onToggle={onToggle}
            onSelectFile={onSelectFile}
          />
        ))}
      </>
    );
  }

  const isOpen = expanded.has(node.path);
  return (
    <li>
      <button
        type="button"
        className="git-blame-tree-row git-blame-tree-row--dir"
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => onToggle(node.path)}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronDown size={14} className="git-blame-tree-chevron" aria-hidden />
        ) : (
          <ChevronRight size={14} className="git-blame-tree-chevron" aria-hidden />
        )}
        <Folder size={14} className="git-blame-tree-icon" aria-hidden />
        <span className="git-blame-tree-label">{node.name}</span>
      </button>
      {isOpen ? (
        <ul className="git-blame-tree-children">
          {node.children.map((child) => (
            <TreeRows
              key={child.path}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              selectedPath={selectedPath}
              onToggle={onToggle}
              onSelectFile={onSelectFile}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function GitBlamePanel({ repoRoot, commit, onClose }: GitBlamePanelProps) {
  const api = window.electronAPI;
  const [files, setFiles] = useState<string[]>([]);
  const [fileQuery, setFileQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [selectedPath, setSelectedPath] = useState("");
  const [blameModalOpen, setBlameModalOpen] = useState(false);
  const [blame, setBlame] = useState<GitBlameAtRefResult | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingBlame, setLoadingBlame] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !blameModalOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [blameModalOpen, onClose]);

  useEffect(() => {
    if (!api?.workspaceSnapshotListFiles || !commit.snapshotPath) {
      return;
    }
    setLoadingFiles(true);
    setError(null);
    void api
      .workspaceSnapshotListFiles({ snapshotPath: commit.snapshotPath })
      .then((r) => setFiles(r.files.filter((f) => !f.endsWith(".png") && !f.endsWith(".jpg"))))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoadingFiles(false));
  }, [api, commit.snapshotPath]);

  const fileTree = useMemo(() => buildFileTree(files), [files]);
  const filteredTree = useMemo(() => filterFileTree(fileTree, fileQuery), [fileTree, fileQuery]);

  useEffect(() => {
    if (!fileQuery.trim()) {
      return;
    }
    const folders = collectFolderPaths(filteredTree);
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const f of folders) {
        next.add(f);
      }
      return next;
    });
  }, [fileQuery, filteredTree]);

  const toggleFolder = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const loadBlame = useCallback(
    async (path: string) => {
      if (!api?.gitBlameAtRef || !path) {
        return;
      }
      setSelectedPath(path);
      setBlameModalOpen(true);
      setLoadingBlame(true);
      setError(null);
      setBlame(null);
      setFileContent("");
      try {
        const [blameRes, fileRes] = await Promise.all([
          api.gitBlameAtRef({ repoRoot, ref: commit.hash, relPath: path }),
          api.workspaceSnapshotReadFile?.({
            snapshotPath: commit.snapshotPath,
            relPath: path,
          }) ?? Promise.resolve({ content: "", truncated: false, size: 0 }),
        ]);
        setBlame(blameRes);
        setFileContent(fileRes?.content ?? "");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoadingBlame(false);
      }
    },
    [api, repoRoot, commit.hash, commit.snapshotPath],
  );

  const closeBlameModal = useCallback(() => {
    setBlameModalOpen(false);
    setSelectedPath("");
    setBlame(null);
    setFileContent("");
    setError(null);
    setLoadingBlame(false);
  }, []);

  return (
    <>
      <section className="git-blame-panel">
        <header className="git-blame-panel-head">
          <div className="git-blame-panel-head-copy">
            <h2 className="git-history-section-title">
              <FileText size={16} aria-hidden className="git-blame-title-icon" />
              Blame · <code className="git-history-hash">{commit.shortHash}</code>
            </h2>
            <p className="git-blame-panel-subject" title={commit.subject}>
              {commit.subject}
            </p>
          </div>
          <button type="button" className="git-history-copy-btn" onClick={onClose}>
            Close
          </button>
        </header>

        {error && !blameModalOpen ? <p className="doc-workspace-alert">{error}</p> : null}

        <div className="git-blame-files-card">
          <div className="git-blame-files-head">
            <span className="git-blame-files-title">Files ({files.length})</span>
            <label className="doc-workspace-search git-blame-search">
              <Search size={14} aria-hidden />
              <input
                type="search"
                placeholder="Filter files…"
                value={fileQuery}
                onChange={(e) => setFileQuery(e.target.value)}
              />
            </label>
          </div>

          <div className="git-blame-tree-scroll">
            {loadingFiles ? (
              <p className="doc-workspace-muted git-blame-tree-empty">
                <Loader2 size={14} className="spin-ic" aria-hidden /> Listing files…
              </p>
            ) : filteredTree.children.length === 0 ? (
              <p className="doc-workspace-muted git-blame-tree-empty">No files match your filter.</p>
            ) : (
              <ul className="git-blame-tree">
                <TreeRows
                  node={filteredTree}
                  depth={0}
                  expanded={expanded}
                  selectedPath={selectedPath}
                  onToggle={toggleFolder}
                  onSelectFile={(path) => void loadBlame(path)}
                />
              </ul>
            )}
          </div>

          <p className="git-blame-tree-hint doc-workspace-muted">
            Select a file to open line-by-line blame in a modal.
          </p>
        </div>
      </section>

      <GitBlameLineModal
        open={blameModalOpen}
        relPath={selectedPath}
        blame={blame}
        fileContent={fileContent}
        loading={loadingBlame}
        error={error}
        onClose={closeBlameModal}
      />
    </>
  );
}
