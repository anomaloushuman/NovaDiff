import { useCallback, useEffect, useMemo, useState } from "react";
import type { FileChange, FileDiffPayload } from "./app/types";
import { buildDiffExcerpt } from "./app/diffExcerpt";
import type { LlmSettings } from "./app/llmStorage";
import { loadLlmSettings } from "./app/llmStorage";
import { DiffWorkspace } from "./components/DiffWorkspace";
import { InsightsColumn } from "./components/InsightsColumn";
import { LlmSettingsModal } from "./components/LlmSettingsModal";
import { SidebarNav } from "./components/SidebarNav";
import "./App.css";

function isElectron(): boolean {
  return typeof window !== "undefined" && Boolean(window.electronAPI);
}

async function pickDirectory(): Promise<string | null> {
  if (window.electronAPI) {
    return window.electronAPI.pickDirectory();
  }
  return null;
}

function baseName(p: string): string {
  const s = p.replace(/\\/g, "/");
  const i = s.lastIndexOf("/");
  const seg = i >= 0 ? s.slice(i + 1) : s;
  return seg || s || "folder";
}

const INSIGHTS_WIDTH_KEY = "novadiff-insights-width";
const INSIGHTS_WIDTH_MIN = 220;
const INSIGHTS_WIDTH_MAX_ABS = 880;
const INSIGHTS_WIDTH_DEFAULT = 320;

function clampInsightsWidth(w: number): number {
  if (typeof window === "undefined") {
    return w;
  }
  const cap = Math.min(
    INSIGHTS_WIDTH_MAX_ABS,
    Math.floor(window.innerWidth * 0.65),
  );
  return Math.min(cap, Math.max(INSIGHTS_WIDTH_MIN, Math.round(w)));
}

function loadInsightsWidth(): number {
  try {
    const raw = localStorage.getItem(INSIGHTS_WIDTH_KEY);
    if (raw == null) {
      return INSIGHTS_WIDTH_DEFAULT;
    }
    const v = Number(raw);
    if (!Number.isFinite(v)) {
      return INSIGHTS_WIDTH_DEFAULT;
    }
    return clampInsightsWidth(v);
  } catch {
    return INSIGHTS_WIDTH_DEFAULT;
  }
}

export default function App() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [rows, setRows] = useState<FileChange[]>([]);
  const [compared, setCompared] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<"summary" | "files">("summary");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [diffPayload, setDiffPayload] = useState<FileDiffPayload | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [llmSettings, setLlmSettings] = useState<LlmSettings>(() => loadLlmSettings());
  const [fileSummary, setFileSummary] = useState<string | null>(null);
  const [fileSummaryLoading, setFileSummaryLoading] = useState(false);
  const [fileSummaryError, setFileSummaryError] = useState<string | null>(null);
  const [insightsWidth, setInsightsWidth] = useState(loadInsightsWidth);

  const toggleFullscreen = useCallback(() => {
    void window.electronAPI?.toggleFullscreen().catch((e) => {
      console.error(e);
    });
  }, []);

  useEffect(() => {
    if (!isElectron()) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F11") {
        e.preventDefault();
        toggleFullscreen();
        return;
      }
      if (e.metaKey && e.ctrlKey && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleFullscreen]);

  useEffect(() => {
    try {
      localStorage.setItem(INSIGHTS_WIDTH_KEY, String(insightsWidth));
    } catch {
      /* ignore quota / private mode */
    }
  }, [insightsWidth]);

  useEffect(() => {
    const onResize = () => {
      setInsightsWidth((w) => clampInsightsWidth(w));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const fileStats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let modified = 0;
    for (const r of rows) {
      if (r.kind === "added") {
        added += 1;
      } else if (r.kind === "removed") {
        removed += 1;
      } else {
        modified += 1;
      }
    }
    return { added, removed, modified, total: rows.length };
  }, [rows]);

  const compare = useCallback(async () => {
    if (!window.electronAPI) {
      setError("Run the desktop app (npm run electron:dev) to compare folders.");
      return;
    }
    setError(null);
    setBusy(true);
    setCompared(false);
    setRows([]);
    setSelectedPath(null);
    setDiffPayload(null);
    setFileSummary(null);
    setFileSummaryError(null);
    try {
      const result = await window.electronAPI.compareFolders(
        left.trim(),
        right.trim(),
      );
      setRows(result);
      setCompared(true);
      setRightTab("summary");
      const first =
        result.find((r) => r.kind === "modified") ?? result[0] ?? null;
      setSelectedPath(first?.path ?? null);
    } catch (e) {
      setRows([]);
      setCompared(false);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [left, right]);

  useEffect(() => {
    if (!selectedPath || !left.trim() || !right.trim() || rows.length === 0) {
      setDiffPayload(null);
      setDiffError(null);
      setDiffLoading(false);
      return;
    }
    const fc = rows.find((r) => r.path === selectedPath);
    if (!fc) {
      setDiffPayload(null);
      return;
    }
    if (!window.electronAPI) {
      return;
    }
    let cancelled = false;
    setDiffLoading(true);
    setDiffError(null);
    setDiffPayload(null);
    setFileSummary(null);
    setFileSummaryError(null);
    window.electronAPI
      .getFileDiff(left.trim(), right.trim(), selectedPath, fc.kind)
      .then((p) => {
        if (!cancelled) {
          setDiffPayload(p);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setDiffPayload(null);
          setDiffError(e instanceof Error ? e.message : String(e));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDiffLoading(false);
        }
      });
    return () => {
      cancelled = true;
      void window.electronAPI?.llmAbortStream?.();
    };
  }, [selectedPath, left, right, rows]);

  const leftTitle = useMemo(() => baseName(left.trim()) || "Baseline", [left]);
  const rightTitle = useMemo(() => baseName(right.trim()) || "Target", [right]);

  const requestFileSummary = useCallback(async () => {
    const api = window.electronAPI;
    if (!api?.llmSummarizeStream || !selectedPath) {
      return;
    }
    const fc = rows.find((r) => r.path === selectedPath);
    if (!fc) {
      return;
    }
    setFileSummaryLoading(true);
    setFileSummaryError(null);
    setFileSummary("");
    try {
      const excerpt = buildDiffExcerpt(diffPayload);
      await api.llmSummarizeStream(
        {
          ...llmSettings,
          relPath: selectedPath,
          kind: fc.kind,
          leftLabel: leftTitle,
          rightLabel: rightTitle,
          lineAdditions: diffPayload?.line_additions,
          lineDeletions: diffPayload?.line_deletions,
          truncated: diffPayload?.truncated,
          diffExcerpt: excerpt,
        },
        (text) => {
          setFileSummary(text);
        },
      );
    } catch (e) {
      setFileSummaryError(e instanceof Error ? e.message : String(e));
    } finally {
      setFileSummaryLoading(false);
    }
  }, [
    diffPayload,
    llmSettings,
    leftTitle,
    rightTitle,
    rows,
    selectedPath,
  ]);

  return (
    <div className="app-shell">
      <LlmSettingsModal
        open={settingsOpen}
        initial={llmSettings}
        onClose={() => setSettingsOpen(false)}
        onSaved={(s) => setLlmSettings(s)}
      />
      <SidebarNav
        active={compared && rows.length > 0}
        leftFolderName={leftTitle}
        rightFolderName={rightTitle}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <DiffWorkspace
        leftRoot={left}
        rightRoot={right}
        onLeft={setLeft}
        onRight={setRight}
        onBrowseLeft={async () => {
          const p = await pickDirectory();
          if (p) {
            setLeft(p);
          }
        }}
        onBrowseRight={async () => {
          const p = await pickDirectory();
          if (p) {
            setRight(p);
          }
        }}
        onCompare={() => void compare()}
        busy={busy}
        error={error}
        compared={compared}
        leftTitle={leftTitle}
        rightTitle={rightTitle}
        fileCount={fileStats.total}
        addedFiles={fileStats.added}
        removedFiles={fileStats.removed}
        modifiedFiles={fileStats.modified}
        selectedPath={selectedPath}
        diffPayload={diffPayload}
        diffLoading={diffLoading}
        diffError={diffError}
        onToggleFullscreen={isElectron() ? toggleFullscreen : undefined}
      />
      <div className="insights-dock" style={{ width: insightsWidth }}>
        <div
          className="insights-resize-handle"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize file summary panel"
          tabIndex={0}
          onDoubleClick={() => setInsightsWidth(INSIGHTS_WIDTH_DEFAULT)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              setInsightsWidth((w) => clampInsightsWidth(w + 12));
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              setInsightsWidth((w) => clampInsightsWidth(w - 12));
            } else if (e.key === "Home") {
              e.preventDefault();
              setInsightsWidth(clampInsightsWidth(INSIGHTS_WIDTH_MAX_ABS));
            } else if (e.key === "End") {
              e.preventDefault();
              setInsightsWidth(INSIGHTS_WIDTH_MIN);
            }
          }}
          onMouseDown={(e) => {
            if (e.button !== 0) {
              return;
            }
            e.preventDefault();
            const startX = e.clientX;
            const startW = insightsWidth;
            const onMove = (me: MouseEvent) => {
              const delta = startX - me.clientX;
              setInsightsWidth(clampInsightsWidth(startW + delta));
            };
            const onUp = () => {
              window.removeEventListener("mousemove", onMove);
              window.removeEventListener("mouseup", onUp);
              document.body.style.removeProperty("cursor");
              document.body.style.removeProperty("user-select");
            };
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
          }}
        />
        <InsightsColumn
          tab={rightTab}
          onTab={setRightTab}
          rows={rows}
          selectedPath={selectedPath}
          onSelectFile={(path) => {
            setSelectedPath(path);
          }}
          diffPayload={diffPayload}
          diffLoading={diffLoading}
          diffError={diffError}
          fileCount={fileStats.total}
          llmSettings={llmSettings}
          fileSummary={fileSummary}
          fileSummaryLoading={fileSummaryLoading}
          fileSummaryError={fileSummaryError}
          onRequestFileSummary={() => void requestFileSummary()}
        />
      </div>
    </div>
  );
}
