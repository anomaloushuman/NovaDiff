import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Search } from "lucide-react";
import type { GitBlameAtRefResult } from "../app/gitTypes";
import type { WorkspaceCommitSnapshot } from "../app/workspaceTypes";

export interface GitBlamePanelProps {
  repoRoot: string;
  commit: WorkspaceCommitSnapshot;
  onClose: () => void;
}

export function GitBlamePanel({ repoRoot, commit, onClose }: GitBlamePanelProps) {
  const api = window.electronAPI;
  const [files, setFiles] = useState<string[]>([]);
  const [fileQuery, setFileQuery] = useState("");
  const [relPath, setRelPath] = useState("");
  const [blame, setBlame] = useState<GitBlameAtRefResult | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingBlame, setLoadingBlame] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const filteredFiles = useMemo(() => {
    const q = fileQuery.trim().toLowerCase();
    if (!q) {
      return files.slice(0, 200);
    }
    return files.filter((f) => f.toLowerCase().includes(q)).slice(0, 200);
  }, [files, fileQuery]);

  const loadBlame = useCallback(
    async (path: string) => {
      if (!api?.gitBlameAtRef || !path) {
        return;
      }
      setRelPath(path);
      setLoadingBlame(true);
      setError(null);
      setBlame(null);
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

  const lines = fileContent.split(/\r?\n/);

  return (
    <section className="doc-workspace-panel git-blame-panel">
      <div className="git-blame-panel-head">
        <h2 className="doc-workspace-h2">
          <FileText size={18} aria-hidden />
          Blame · {commit.shortHash}
        </h2>
        <button type="button" className="doc-workspace-copy-btn" onClick={onClose}>
          Close
        </button>
      </div>

      <p className="doc-workspace-muted">{commit.subject}</p>
      {error ? <p className="doc-workspace-alert">{error}</p> : null}

      <div className="git-blame-layout">
        <div className="git-blame-files">
          <label className="doc-workspace-search git-blame-search">
            <Search size={14} aria-hidden />
            <input
              type="search"
              placeholder="Filter files…"
              value={fileQuery}
              onChange={(e) => setFileQuery(e.target.value)}
            />
          </label>
          {loadingFiles ? (
            <p className="doc-workspace-muted">
              <Loader2 size={14} className="spin-ic" aria-hidden /> Listing files…
            </p>
          ) : (
            <ul className="git-blame-file-list">
              {filteredFiles.map((f) => (
                <li key={f}>
                  <button
                    type="button"
                    className={`git-blame-file-btn${relPath === f ? " active" : ""}`}
                    onClick={() => void loadBlame(f)}
                  >
                    {f}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="git-blame-view">
          {loadingBlame ? (
            <p className="doc-workspace-muted">
              <Loader2 size={16} className="spin-ic" aria-hidden /> Loading blame…
            </p>
          ) : null}
          {blame?.owners && blame.owners.length > 0 ? (
            <div className="git-blame-owners">
              {blame.owners.map((o) => (
                <span key={o.author} className="doc-workspace-inline-badge">
                  {o.author} ({Math.round(o.ratio * 100)}%)
                </span>
              ))}
            </div>
          ) : null}
          {blame?.error ? <p className="doc-workspace-alert">{blame.error}</p> : null}
          {relPath && lines.length > 0 ? (
            <pre className="git-blame-code">
              {lines.map((line, i) => {
                const author = blame?.lineAuthors[i] ?? "";
                return (
                  <div key={`${i}-${author}`} className="git-blame-line">
                    <span className="git-blame-ln">{i + 1}</span>
                    <span className="git-blame-author" title={author}>
                      {(author || "?").slice(0, 12)}
                    </span>
                    <span className="git-blame-text">{line || " "}</span>
                  </div>
                );
              })}
            </pre>
          ) : (
            <p className="doc-workspace-muted">Select a file to view line-by-line blame.</p>
          )}
        </div>
      </div>
    </section>
  );
}
