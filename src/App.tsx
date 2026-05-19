import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Copy, Expand, Minimize2, Minus, Square, X } from "lucide-react";
import type { FileChange, FileDiffPayload, SelectionDocMode } from "./app/types";
import { buildDiffExcerpt, buildDiffExcerptChunks, FILE_SUMMARY_DIFF_CHUNK_CHARS } from "./app/diffExcerpt";
import type { LlmSettings } from "./app/llmStorage";
import { loadLlmSettings } from "./app/llmStorage";
import { buildSelectedDiffDocContext, isChangedDiffRow } from "./app/selectedDiffDocs";
import { DiffWorkspace } from "./components/DiffWorkspace";
import { DocumentationWorkspace } from "./components/DocumentationWorkspace";
import { InsightsColumn } from "./components/InsightsColumn";
import { LlmSettingsModal } from "./components/LlmSettingsModal";
import { SidebarNav } from "./components/SidebarNav";
import { isNovadiffDocsReservedPath } from "./app/novadiffPaths";
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

const NON_TEXT_SUMMARY_ERROR =
  "Binary and non-text files are excluded from AI summaries.";

function isBinaryOrNonTextError(message: string | null | undefined): boolean {
  return typeof message === "string" && message.includes("Binary or non-text file");
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

const DOC_AUTO_KEY = "novadiff_workspace_doc_auto";

type DesktopPlatform = "darwin" | "win32" | "linux" | "web";

interface WindowChromeState {
  platform: DesktopPlatform;
  isMaximized: boolean;
  isFullScreen: boolean;
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
  const [fileSummaryChunk, setFileSummaryChunk] = useState<{
    index: number;
    total: number;
  } | null>(null);
  const [fileSummaryError, setFileSummaryError] = useState<string | null>(null);
  const [selectedDiffRows, setSelectedDiffRows] = useState<number[]>([]);
  const [selectionAnchorRow, setSelectionAnchorRow] = useState<number | null>(null);
  const [selectionDocMode, setSelectionDocMode] = useState<SelectionDocMode>("exact");
  const [selectedDiffSummary, setSelectedDiffSummary] = useState<string | null>(null);
  const [selectedDiffSummaryLoading, setSelectedDiffSummaryLoading] = useState(false);
  const [selectedDiffSummaryError, setSelectedDiffSummaryError] = useState<string | null>(
    null,
  );
  const [insightsWidth, setInsightsWidth] = useState(loadInsightsWidth);
  const [prefetchStatus, setPrefetchStatus] = useState<string | null>(null);
  const [workspacePage, setWorkspacePage] = useState<"compare" | "docs">(
    "compare",
  );
  const [workspaceDocAuto, setWorkspaceDocAuto] = useState(() => {
    try {
      return typeof localStorage !== "undefined" &&
        localStorage.getItem(DOC_AUTO_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [docGenTrigger, setDocGenTrigger] = useState(0);
  const [windowChrome, setWindowChrome] = useState<WindowChromeState>({
    platform: "web",
    isMaximized: false,
    isFullScreen: false,
  });

  const setWorkspaceDocAutoPersist = useCallback((v: boolean) => {
    setWorkspaceDocAuto(v);
    try {
      localStorage.setItem(DOC_AUTO_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const jumpToComparePath = useCallback((path: string) => {
    const relPath = String(path ?? "").trim();
    if (!relPath) {
      return;
    }
    setSelectedPath(relPath);
    setWorkspacePage("compare");
  }, []);

  const selectedPathRef = useRef<string | null>(null);
  const fileSummaryLoadingRef = useRef(false);
  selectedPathRef.current = selectedPath;
  fileSummaryLoadingRef.current = fileSummaryLoading;

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onSummaryPrefetchProgress) {
      return;
    }
    return api.onSummaryPrefetchProgress((msg) => {
      if (!msg || typeof msg !== "object") {
        return;
      }
      const state = msg.state;
      if (state === "started") {
        const jobs = typeof msg.jobs === "number" ? msg.jobs : 0;
        const input =
          typeof msg.inputChanges === "number" ? msg.inputChanges : 0;
        const skippedGi =
          typeof msg.skippedGitignore === "number" ? msg.skippedGitignore : 0;
        const skippedNd =
          typeof msg.skippedNovadiffDocs === "number"
            ? msg.skippedNovadiffDocs
            : 0;
        const skippedNonText =
          typeof msg.skippedNonText === "number" ? msg.skippedNonText : 0;
        const parts: string[] = [];
        if (skippedGi > 0) {
          parts.push(`${skippedGi} skipped (.gitignore)`);
        }
        if (skippedNd > 0) {
          parts.push(`${skippedNd} skipped (novadiff-docs)`);
        }
        if (skippedNonText > 0) {
          parts.push(`${skippedNonText} skipped (binary/non-text)`);
        }
        const detail =
          parts.length > 0 ? parts.join("; ") : `${input} changed`;
        setPrefetchStatus(
          `Auto-summarizing up to ${jobs} file(s) (${detail})…`,
        );
      } else if (state === "file-done") {
        const idx = typeof msg.index === "number" ? msg.index : 0;
        const tot = typeof msg.total === "number" ? msg.total : 0;
        setPrefetchStatus(`Prefetch ${idx}/${tot}`);
        const path = typeof msg.path === "string" ? msg.path : "";
        if (
          path &&
          path === selectedPathRef.current &&
          !fileSummaryLoadingRef.current
        ) {
          void api.getPrefetchedSummary?.(path).then((t) => {
            if (
              t &&
              path === selectedPathRef.current &&
              !fileSummaryLoadingRef.current
            ) {
              setFileSummary(t);
              setFileSummaryError(null);
            }
          });
        }
      } else if (state === "file-skipped") {
        const idx = typeof msg.index === "number" ? msg.index : 0;
        const tot = typeof msg.total === "number" ? msg.total : 0;
        setPrefetchStatus(`Prefetch ${idx}/${tot} · skipped non-text file`);
      } else if (state === "finished") {
        setPrefetchStatus(null);
      } else if (state === "fatal") {
        setPrefetchStatus(
          typeof msg.message === "string" ? msg.message : "Prefetch failed",
        );
      }
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    void window.electronAPI?.toggleFullscreen().catch((e) => {
      console.error(e);
    });
  }, []);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.getWindowState) {
      return;
    }
    let cancelled = false;
    void api.getWindowState().then((state) => {
      if (!cancelled && state) {
        setWindowChrome({
          platform:
            state.platform === "darwin" || state.platform === "win32" || state.platform === "linux"
              ? state.platform
              : "web",
          isMaximized: Boolean(state.isMaximized),
          isFullScreen: Boolean(state.isFullScreen),
        });
      }
    });
    const off = api.onWindowStateChanged?.((state) => {
      setWindowChrome({
        platform:
          state.platform === "darwin" || state.platform === "win32" || state.platform === "linux"
            ? state.platform
            : "web",
        isMaximized: Boolean(state.isMaximized),
        isFullScreen: Boolean(state.isFullScreen),
      });
    });
    return () => {
      cancelled = true;
      off?.();
    };
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
    void window.electronAPI.stopSummaryPrefetch?.();
    setWorkspacePage("compare");
    setError(null);
    setBusy(true);
    setCompared(false);
    setRows([]);
    setSelectedPath(null);
    setDiffPayload(null);
    setFileSummary(null);
    setFileSummaryError(null);
    setSelectedDiffRows([]);
    setSelectionAnchorRow(null);
    setSelectionDocMode("exact");
    setSelectedDiffSummary(null);
    setSelectedDiffSummaryLoading(false);
    setSelectedDiffSummaryError(null);
    setPrefetchStatus(null);
    try {
      const result = await window.electronAPI.compareFolders(
        left.trim(),
        right.trim(),
      );
      const lt = baseName(left.trim()) || "Baseline";
      const rt = baseName(right.trim()) || "Target";
      startTransition(() => {
        setRows(result);
        setCompared(true);
        setRightTab("summary");
        const first =
          result.find((r) => r.kind === "modified") ?? result[0] ?? null;
        setSelectedPath(first?.path ?? null);
      });
      if (result.length > 0 && window.electronAPI.startSummaryPrefetch) {
        void window.electronAPI
          .startSummaryPrefetch({
            leftRoot: left.trim(),
            rightRoot: right.trim(),
            leftLabel: lt,
            rightLabel: rt,
            changes: result,
            llmSettings,
          })
          .catch(() => {});
      }
      if (
        workspaceDocAuto &&
        result.length > 0 &&
        result.length <= 400
      ) {
        startTransition(() => {
          setWorkspacePage("docs");
        });
        setDocGenTrigger((n) => n + 1);
      }
    } catch (e) {
      setRows([]);
      setCompared(false);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [left, right, llmSettings, workspaceDocAuto]);

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
    setSelectedDiffRows([]);
    setSelectionAnchorRow(null);
    setSelectedDiffSummary(null);
    setSelectedDiffSummaryLoading(false);
    setSelectedDiffSummaryError(null);
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
  const selectedDiffContext = useMemo(
    () => buildSelectedDiffDocContext(diffPayload, selectedDiffRows, selectionDocMode),
    [diffPayload, selectedDiffRows, selectionDocMode],
  );
  const selectedDiffChangedCount = useMemo(
    () => selectedDiffContext?.selectedRows.filter((row) => isChangedDiffRow(row)).length ?? 0,
    [selectedDiffContext],
  );
  const selectedDiffDocNote = useMemo(() => {
    if (!selectedDiffContext) {
      return null;
    }
    if (selectionDocMode === "expanded") {
      if (selectedDiffContext.symbol) {
        return `Semantic expansion uses ${selectedDiffContext.symbol.side} ${selectedDiffContext.symbol.kind} \`${selectedDiffContext.symbol.name}\` (${selectedDiffContext.symbol.start_line}-${selectedDiffContext.symbol.end_line}).`;
      }
      return "No enclosing symbol was detected for this selection, so the summary will fall back to exact selected rows plus nearby context.";
    }
    return "Exact selection mode focuses on the selected rows with only minimal nearby diff context.";
  }, [selectedDiffContext, selectionDocMode]);
  const fileSummaryBlockedReason = useMemo(() => {
    if (!selectedPath) {
      return "Select a file to summarize.";
    }
    if (isNovadiffDocsReservedPath(selectedPath)) {
      return "Paths under novadiff-docs/ are reserved for generated documentation and are not summarized.";
    }
    if (diffLoading) {
      return "Loading the diff for this file before summary generation.";
    }
    if (isBinaryOrNonTextError(diffError)) {
      return NON_TEXT_SUMMARY_ERROR;
    }
    if (diffError) {
      return diffError;
    }
    if (!diffPayload) {
      return "Diff content is unavailable for this file.";
    }
    return null;
  }, [diffError, diffLoading, diffPayload, selectedPath]);

  const clearSelectedDiffSummary = useCallback(() => {
    setSelectedDiffSummary(null);
    setSelectedDiffSummaryError(null);
  }, []);

  const handleSelectionMode = useCallback(
    (mode: SelectionDocMode) => {
      if (selectedDiffSummaryLoading) {
        return;
      }
      setSelectionDocMode(mode);
      clearSelectedDiffSummary();
    },
    [clearSelectedDiffSummary, selectedDiffSummaryLoading],
  );

  const handleSelectDiffRow = useCallback(
    (
      rowIndex: number,
      modifiers: { shiftKey: boolean; toggleKey: boolean },
    ) => {
      if (selectedDiffSummaryLoading) {
        return;
      }
      if (!diffPayload?.rows[rowIndex] || diffPayload.rows[rowIndex].is_truncation_marker) {
        return;
      }
      const { shiftKey, toggleKey } = modifiers;
      clearSelectedDiffSummary();
      setSelectedDiffRows((prev) => {
        if (shiftKey && selectionAnchorRow != null) {
          const start = Math.min(selectionAnchorRow, rowIndex);
          const end = Math.max(selectionAnchorRow, rowIndex);
          const range: number[] = [];
          for (let i = start; i <= end; i++) {
            const row = diffPayload.rows[i];
            if (row && !row.is_truncation_marker) {
              range.push(i);
            }
          }
          if (toggleKey) {
            return Array.from(new Set([...prev, ...range])).sort((a, b) => a - b);
          }
          return range;
        }
        if (toggleKey) {
          return prev.includes(rowIndex)
            ? prev.filter((value) => value !== rowIndex)
            : [...prev, rowIndex].sort((a, b) => a - b);
        }
        return [rowIndex];
      });
      setSelectionAnchorRow(rowIndex);
    },
    [clearSelectedDiffSummary, diffPayload, selectedDiffSummaryLoading, selectionAnchorRow],
  );

  const clearDiffSelection = useCallback(() => {
    if (selectedDiffSummaryLoading) {
      return;
    }
    setSelectedDiffRows([]);
    setSelectionAnchorRow(null);
    clearSelectedDiffSummary();
  }, [clearSelectedDiffSummary, selectedDiffSummaryLoading]);

  const requestFileSummary = useCallback(async () => {
    const api = window.electronAPI;
    if ((!api?.llmSummarizeStream && !api?.llmSummarize) || !selectedPath) {
      return;
    }
    if (fileSummaryBlockedReason) {
      setFileSummaryError(fileSummaryBlockedReason);
      return;
    }
    const fc = rows.find((r) => r.path === selectedPath);
    if (!fc) {
      return;
    }
    setFileSummaryLoading(true);
    setFileSummaryChunk(null);
    setFileSummaryError(null);
    setFileSummary("");
    let streamed = "";
    let streamErr: unknown = null;
    try {
      const chunks =
        diffPayload?.rows?.length && diffPayload.rows.length > 0
          ? buildDiffExcerptChunks(diffPayload, FILE_SUMMARY_DIFF_CHUNK_CHARS)
          : [];

      if (chunks.length <= 1) {
        const excerpt =
          chunks.length === 1 ? chunks[0] : buildDiffExcerpt(diffPayload);
        const payload = {
          ...llmSettings,
          relPath: selectedPath,
          kind: fc.kind,
          leftLabel: leftTitle,
          rightLabel: rightTitle,
          lineAdditions: diffPayload?.line_additions,
          lineDeletions: diffPayload?.line_deletions,
          truncated: diffPayload?.truncated,
          diffExcerpt: excerpt,
          summaryEvidence: diffPayload?.summary_evidence,
        };
        if (api.llmSummarizeStream) {
          await api.llmSummarizeStream(payload, (text) => {
            streamed = text;
            setFileSummary(text);
          });
        } else if (api.llmSummarize) {
          const text = await api.llmSummarize(payload);
          streamed = text;
          setFileSummary(text);
        }
      } else {
        if (!api.llmSummarize) {
          throw new Error("Large-file summary support is unavailable in this build.");
        }
        const text = await api.llmSummarize({
          ...llmSettings,
          relPath: selectedPath,
          kind: fc.kind,
          leftLabel: leftTitle,
          rightLabel: rightTitle,
          lineAdditions: diffPayload?.line_additions,
          lineDeletions: diffPayload?.line_deletions,
          truncated: diffPayload?.truncated,
          diffChunkList: chunks,
          summaryEvidence: diffPayload?.summary_evidence,
        });
        streamed = text;
        setFileSummary(text);
      }
    } catch (e) {
      streamErr = e;
      setFileSummaryError(e instanceof Error ? e.message : String(e));
    } finally {
      setFileSummaryLoading(false);
      setFileSummaryChunk(null);
    }
    const tr = right.trim();
    if (
      !streamErr &&
      streamed.trim().length > 0 &&
      tr.length > 0 &&
      api.saveFileSummaryArtifacts &&
      !isNovadiffDocsReservedPath(selectedPath)
    ) {
      void api
        .saveFileSummaryArtifacts({
          targetRoot: tr,
          relPath: selectedPath,
          kind: fc.kind,
          leftTitle,
          rightTitle,
          markdown: streamed,
          summaryEvidence: diffPayload?.summary_evidence,
        })
        .catch(() => {});
    }
  }, [
    diffPayload,
    llmSettings,
    leftTitle,
    rightTitle,
    right,
    rows,
    selectedPath,
    fileSummaryBlockedReason,
  ]);

  const requestSelectedDiffSummary = useCallback(async () => {
    const api = window.electronAPI;
    if ((!api?.llmSummarizeStream && !api?.llmSummarize) || !selectedPath || !selectedDiffContext) {
      return;
    }
    if (isNovadiffDocsReservedPath(selectedPath)) {
      setSelectedDiffSummaryError(
        "Paths under novadiff-docs/ are reserved for generated documentation and are not summarized.",
      );
      return;
    }
    const fc = rows.find((r) => r.path === selectedPath);
    if (!fc) {
      return;
    }
    setSelectedDiffSummaryLoading(true);
    setSelectedDiffSummaryError(null);
    setSelectedDiffSummary("");
    let streamed = "";
    let streamErr: unknown = null;
    try {
      const payload = {
        ...llmSettings,
        relPath: selectedPath,
        kind: fc.kind,
        leftLabel: leftTitle,
        rightLabel: rightTitle,
        lineAdditions: diffPayload?.line_additions,
        lineDeletions: diffPayload?.line_deletions,
        truncated: diffPayload?.truncated,
        selectionDoc: true,
        selectionModeRequested: selectedDiffContext.requestedMode,
        selectionModeEffective: selectedDiffContext.effectiveMode,
        selectionLabel: selectedDiffContext.label,
        selectedRowCount: selectedDiffContext.selectedRows.length,
        selectedLineRanges: selectedDiffContext.lineRanges,
        selectedDiffExcerpt: selectedDiffContext.selectedExcerpt,
        focusDiffExcerpt: selectedDiffContext.focusExcerpt,
        selectionSymbol: selectedDiffContext.symbol,
      };
      if (api.llmSummarizeStream) {
        await api.llmSummarizeStream(payload, (text) => {
          streamed = text;
          setSelectedDiffSummary(text);
        });
      } else if (api.llmSummarize) {
        const text = await api.llmSummarize(payload);
        streamed = text;
        setSelectedDiffSummary(text);
      }
    } catch (e) {
      streamErr = e;
      setSelectedDiffSummaryError(e instanceof Error ? e.message : String(e));
    } finally {
      setSelectedDiffSummaryLoading(false);
    }
    const tr = right.trim();
    if (
      !streamErr &&
      streamed.trim().length > 0 &&
      tr.length > 0 &&
      api.saveSelectionSummaryArtifacts &&
      !isNovadiffDocsReservedPath(selectedPath)
    ) {
      void api
        .saveSelectionSummaryArtifacts({
          targetRoot: tr,
          relPath: selectedPath,
          kind: fc.kind,
          leftTitle,
          rightTitle,
          markdown: streamed,
          label: selectedDiffContext.label,
          selectionKey: selectedDiffContext.selectionKey,
          requestedMode: selectedDiffContext.requestedMode,
          effectiveMode: selectedDiffContext.effectiveMode,
          lineRanges: selectedDiffContext.lineRanges,
          symbol: selectedDiffContext.symbol,
        })
        .catch(() => {});
    }
  }, [
    diffPayload,
    leftTitle,
    llmSettings,
    right,
    rightTitle,
    rows,
    selectedDiffContext,
    selectedPath,
  ]);

  useEffect(() => {
    if (
      !selectedPath ||
      diffLoading ||
      !diffPayload ||
      fileSummaryLoading ||
      !window.electronAPI?.getPrefetchedSummary
    ) {
      return;
    }
    let cancelled = false;
    void window.electronAPI
      .getPrefetchedSummary(selectedPath)
      .then((text) => {
        if (!cancelled && text) {
          setFileSummary(text);
          setFileSummaryError(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPath, diffPayload, diffLoading, fileSummaryLoading]);

  return (
    <div className="app-root">
      {isElectron() ? (
        <WindowChrome
          state={windowChrome}
          onMinimize={() => void window.electronAPI?.minimizeWindow?.()}
          onToggleMaximize={() => void window.electronAPI?.toggleMaximizeWindow?.()}
          onToggleFullscreen={() => toggleFullscreen()}
          onClose={() => void window.electronAPI?.closeWindow?.()}
        />
      ) : null}
      <div className="app-shell">
      <LlmSettingsModal
        open={settingsOpen}
        initial={llmSettings}
        onClose={() => setSettingsOpen(false)}
        onSaved={(s) => setLlmSettings(s)}
      />
      <SidebarNav
        active={compared && rows.length > 0}
        workspacePage={workspacePage}
        onWorkspacePage={setWorkspacePage}
        leftFolderName={leftTitle}
        rightFolderName={rightTitle}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      {workspacePage === "compare" ? (
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
          onSwapRoots={() => {
            const l = left;
            setLeft(right);
            setRight(l);
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
          selectedDiffRows={selectedDiffRows}
          selectionMode={selectionDocMode}
          onSelectionMode={handleSelectionMode}
          onSelectDiffRow={handleSelectDiffRow}
          onClearDiffSelection={clearDiffSelection}
          onRequestSelectedDiffSummary={() => void requestSelectedDiffSummary()}
          selectedDiffDocLabel={selectedDiffContext?.label ?? null}
          selectedDiffDocNote={selectedDiffDocNote}
          selectedDiffChangedCount={selectedDiffChangedCount}
          selectedDiffSummary={selectedDiffSummary}
          selectedDiffSummaryLoading={selectedDiffSummaryLoading}
          selectedDiffSummaryError={selectedDiffSummaryError}
        />
      ) : (
        <DocumentationWorkspace
          compared={compared}
          leftRoot={left}
          rightRoot={right}
          leftTitle={leftTitle}
          rightTitle={rightTitle}
          rows={rows}
          fileStats={fileStats}
          llmSettings={llmSettings}
          docGenTrigger={docGenTrigger}
          workspaceDocAuto={workspaceDocAuto}
          onWorkspaceDocAutoChange={setWorkspaceDocAutoPersist}
          onJumpToCompare={jumpToComparePath}
        />
      )}
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
          fileSummaryChunk={fileSummaryChunk}
          fileSummaryError={fileSummaryError}
          fileSummaryDisabledReason={selectedPath ? fileSummaryBlockedReason : null}
          onRequestFileSummary={() => void requestFileSummary()}
          prefetchStatus={prefetchStatus}
        />
      </div>
    </div>
    </div>
  );
}

function WindowChrome({
  state,
  onMinimize,
  onToggleMaximize,
  onToggleFullscreen,
  onClose,
}: {
  state: WindowChromeState;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onToggleFullscreen: () => void;
  onClose: () => void;
}) {
  return (
    <header className="window-chrome">
      {state.platform === "darwin" ? (
        <div className="window-chrome-controls mac no-drag">
          <button
            type="button"
            className="window-control-dot close"
            aria-label="Close window"
            onClick={onClose}
          >
            <X size={10} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            className="window-control-dot minimize"
            aria-label="Minimize window"
            onClick={onMinimize}
          >
            <Minus size={10} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            className="window-control-dot maximize"
            aria-label={state.isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
            onClick={onToggleFullscreen}
          >
            {state.isFullScreen ? (
              <Minimize2 size={9} strokeWidth={2.2} />
            ) : (
              <Expand size={9} strokeWidth={2.2} />
            )}
          </button>
        </div>
      ) : (
        <div className="window-chrome-brand">
          <span className="window-chrome-brand-dot" aria-hidden />
          <span className="window-chrome-brand-label">NovaDiff</span>
        </div>
      )}

      <div className="window-chrome-title">NovaDiff</div>

      {state.platform !== "darwin" ? (
        <div className="window-chrome-controls win no-drag">
          <button
            type="button"
            className="window-control-btn"
            aria-label="Minimize window"
            onClick={onMinimize}
          >
            <Minus size={14} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="window-control-btn"
            aria-label={state.isMaximized ? "Restore window" : "Maximize window"}
            onClick={onToggleMaximize}
          >
            {state.isMaximized ? (
              <Copy size={13} strokeWidth={2.1} />
            ) : (
              <Square size={13} strokeWidth={2.1} />
            )}
          </button>
          <button
            type="button"
            className="window-control-btn close"
            aria-label="Close window"
            onClick={onClose}
          >
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>
      ) : (
        <div className="window-chrome-spacer" aria-hidden />
      )}
    </header>
  );
}
