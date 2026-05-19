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
import {
  BackgroundActivityProvider,
  useBackgroundActivity,
  type BackgroundActivityKind,
} from "./app/BackgroundActivityContext";
import { BackgroundActivityBar } from "./components/BackgroundActivityBar";
import { DiffWorkspace } from "./components/DiffWorkspace";
import { DocumentationWorkspace } from "./components/DocumentationWorkspace";
import { InsightsColumn } from "./components/InsightsColumn";
import { LlmSettingsModal } from "./components/LlmSettingsModal";
import { AppLaunchShell } from "./components/launch/AppLaunchShell";
import { readLaunchSkipped, type LaunchPhase } from "./app/launchSequence";
import type {
  GitHistoryCompareOptions,
  GitUserProfile,
  NovaWorkspace,
  WorkspaceCommitSnapshot,
  WorkspaceSessionState,
} from "./app/workspaceTypes";
import {
  findWorkspace,
  loadCachedGitUser,
  resolveOnboardingGate,
  saveCachedActiveWorkspaceId,
  saveCachedGitUser,
  saveCachedLocalOnly,
  loadCachedLocalOnly,
  type OnboardingGate,
} from "./app/workspaceStorage";
import { AutoCommitWorkspace } from "./components/AutoCommitWorkspace";
import { GitHistoryWorkspace } from "./components/GitHistoryWorkspace";
import { PullRequestsWorkspace } from "./components/PullRequestsWorkspace";
import { WelcomeScreen } from "./components/onboarding/WelcomeScreen";
import { WorkspaceHub } from "./components/onboarding/WorkspaceHub";
import { SidebarNav, type WorkspacePage } from "./components/SidebarNav";
import { isNovadiffDocsReservedPath } from "./app/novadiffPaths";
import "./App.css";
import "./components/onboarding/onboarding.css";
import "./components/ui/ui-transitions.css";
import { WorkspaceStage } from "./components/ui/WorkspaceStage";

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

function AppMain() {
  const { upsertActivity, removeActivity } = useBackgroundActivity();
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
  const [selectedDiffSummaryModalOpen, setSelectedDiffSummaryModalOpen] = useState(false);
  const [insightsWidth, setInsightsWidth] = useState(loadInsightsWidth);
  const [prefetchStatus, setPrefetchStatus] = useState<string | null>(null);
  const [prefetchProgress, setPrefetchProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [compareEngineMessage, setCompareEngineMessage] = useState<string | null>(null);
  const [workspacePage, setWorkspacePage] = useState<WorkspacePage>("compare");
  const [docsInsightsOpen, setDocsInsightsOpen] = useState(false);
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
  const [session, setSession] = useState<WorkspaceSessionState | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [launchPhase, setLaunchPhase] = useState<LaunchPhase>("boot");

  const setWorkspaceDocAutoPersist = useCallback((v: boolean) => {
    setWorkspaceDocAuto(v);
    try {
      localStorage.setItem(DOC_AUTO_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (workspacePage !== "docs") {
      setDocsInsightsOpen(false);
    }
  }, [workspacePage]);

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
    if (!api?.onEngineProgress) {
      return;
    }
    return api.onEngineProgress((msg) => {
      if (!msg || typeof msg !== "object") {
        return;
      }
      const cmd = typeof msg.cmd === "string" ? msg.cmd : "engine";
      const message = typeof msg.message === "string" ? msg.message : "Working…";
      const phase = typeof msg.phase === "string" ? msg.phase : "running";
      const id =
        cmd === "compare-folders"
          ? "compare"
          : cmd === "codebase-outline"
            ? "outline"
            : cmd === "filter-changes-gitignore"
              ? "filter"
              : cmd === "risk-signals"
                ? "risk"
                : `engine:${cmd}`;
      const kind =
        cmd === "compare-folders"
          ? "compare"
          : cmd === "codebase-outline"
            ? "outline"
            : cmd === "filter-changes-gitignore"
              ? "filter"
              : "other";
      const label =
        cmd === "compare-folders"
          ? "Comparing folders"
          : cmd === "codebase-outline"
            ? "Scanning codebase"
            : cmd === "filter-changes-gitignore"
              ? "Filtering changes"
              : cmd === "risk-signals"
                ? "Analyzing risk signals"
                : "Running engine";
      const progress =
        phase === "parsing" ? 92 : phase === "done" ? 100 : phase === "spawn" ? 8 : null;
      upsertActivity({
        id,
        kind: kind as BackgroundActivityKind,
        label,
        detail: message,
        progress,
      });
      if (cmd === "compare-folders") {
        setCompareEngineMessage(message);
      }
      if (phase === "done") {
        window.setTimeout(() => removeActivity(id), 700);
      }
    });
  }, [removeActivity, upsertActivity]);

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
        setPrefetchProgress(jobs > 0 ? { current: 0, total: jobs } : null);
        upsertActivity({
          id: "prefetch",
          kind: "prefetch",
          label: "Prefetching file summaries",
          detail: `Queued ${jobs} file(s) · ${detail}`,
          progress: 0,
        });
      } else if (state === "file-done") {
        const idx = typeof msg.index === "number" ? msg.index : 0;
        const tot = typeof msg.total === "number" ? msg.total : 0;
        setPrefetchStatus(`Prefetch ${idx}/${tot}`);
        setPrefetchProgress(tot > 0 ? { current: idx, total: tot } : null);
        upsertActivity({
          id: "prefetch",
          kind: "prefetch",
          label: "Prefetching file summaries",
          detail: `${idx}/${tot} complete`,
          progress: tot > 0 ? (idx / tot) * 100 : null,
        });
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
        setPrefetchProgress(tot > 0 ? { current: idx, total: tot } : null);
      } else if (state === "finished") {
        setPrefetchStatus(null);
        setPrefetchProgress(null);
        removeActivity("prefetch");
      } else if (state === "fatal") {
        setPrefetchStatus(
          typeof msg.message === "string" ? msg.message : "Prefetch failed",
        );
        setPrefetchProgress(null);
        removeActivity("prefetch");
      }
    });
  }, [removeActivity, upsertActivity]);

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

  const runCompare = useCallback(
    async (leftPath: string, rightPath: string, opts?: { navigate?: boolean }) => {
    if (!window.electronAPI) {
      setError("Run the desktop app (npm run electron:dev) to compare folders.");
      return;
    }
    const l = leftPath.trim();
    const r = rightPath.trim();
    if (!l || !r) {
      setError("Pick baseline and target folders first.");
      return;
    }
    void window.electronAPI.stopSummaryPrefetch?.();
    if (opts?.navigate !== false) {
      setWorkspacePage("compare");
    }
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
    setPrefetchProgress(null);
    setCompareEngineMessage("Starting folder compare…");
    upsertActivity({
      id: "compare",
      kind: "compare",
      label: "Comparing folders",
      detail: "Preparing Rust compare engine…",
      progress: 5,
    });
    try {
      const result = await window.electronAPI.compareFolders(l, r);
      const lt = baseName(l) || "Baseline";
      const rt = baseName(r) || "Target";
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
            leftRoot: l,
            rightRoot: r,
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
      setCompareEngineMessage(null);
      removeActivity("compare");
    }
    },
    [llmSettings, removeActivity, upsertActivity, workspaceDocAuto],
  );

  const compare = useCallback(() => {
    void runCompare(left, right);
  }, [runCompare, left, right]);

  const openPrCompare = useCallback(
    (payload: {
      leftRoot: string;
      rightRoot: string;
      leftTitle: string;
      rightTitle: string;
    }) => {
      setLeft(payload.leftRoot);
      setRight(payload.rightRoot);
      void runCompare(payload.leftRoot, payload.rightRoot);
    },
    [runCompare],
  );

  const useRepoAsTarget = useCallback((repoPath: string) => {
    setRight(repoPath);
    setWorkspacePage("compare");
  }, []);

  useEffect(() => {
    if (!isElectron() || !window.electronAPI?.workspaceSessionLoad) {
      const cached = loadCachedGitUser();
      setSession({
        gitUser: cached,
        activeWorkspaceId: null,
        workspaces: [],
        localOnlyMode: loadCachedLocalOnly(),
      });
      setSessionReady(true);
      return;
    }
    let cancelled = false;
    void window.electronAPI.workspaceSessionLoad().then((s) => {
      if (cancelled) {
        return;
      }
      if (s.gitUser) {
        saveCachedGitUser(s.gitUser);
      }
      setSession(s);
      setSessionReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeWorkspace = useMemo(
    () => findWorkspace(session?.workspaces ?? [], session?.activeWorkspaceId),
    [session],
  );

  const onboardingGate: OnboardingGate | null = useMemo(() => {
    if (!sessionReady) {
      return null;
    }
    if (!isElectron()) {
      return "app";
    }
    const skipBoot = launchPhase === "ready" || readLaunchSkipped();
    return resolveOnboardingGate({
      skipBoot,
      localOnlyMode: Boolean(session?.localOnlyMode),
      hasUser: Boolean(session?.gitUser),
      hasActiveWorkspace: Boolean(activeWorkspace),
    });
  }, [sessionReady, launchPhase, session?.localOnlyMode, session?.gitUser, activeWorkspace]);

  const showMainApp = onboardingGate === "app";
  const localOnlyMode = Boolean(session?.localOnlyMode);

  useEffect(() => {
    if (!localOnlyMode) {
      return;
    }
    if (workspacePage === "history" || workspacePage === "prs" || workspacePage === "publish") {
      setWorkspacePage("compare");
    }
  }, [localOnlyMode, workspacePage]);

  const applyWorkspacePaths = useCallback((ws: NovaWorkspace) => {
    const commits = ws.commits ?? [];
    if (commits.length >= 2) {
      const head = commits[commits.length - 1];
      const base = commits[commits.length - 2];
      setLeft(base.snapshotPath);
      setRight(head.snapshotPath);
    } else {
      setRight(ws.repoRoot);
      setLeft(ws.repoRoot);
    }
  }, []);

  const activateWorkspace = useCallback(
    async (ws: NovaWorkspace, sessionFromServer?: WorkspaceSessionState | null) => {
      saveCachedActiveWorkspaceId(ws.id);
      saveCachedLocalOnly(false);
      if (sessionFromServer) {
        setSession(sessionFromServer);
      } else if (window.electronAPI?.workspaceSetActive) {
        const s = await window.electronAPI.workspaceSetActive({ workspaceId: ws.id });
        setSession(s);
      } else {
        setSession((prev) => {
          const base = prev ?? {
            gitUser: null,
            activeWorkspaceId: null,
            workspaces: [],
            localOnlyMode: false,
          };
          const workspaces = [...base.workspaces];
          const idx = workspaces.findIndex((w) => w.id === ws.id);
          if (idx >= 0) {
            workspaces[idx] = ws;
          } else {
            workspaces.push(ws);
          }
          return { ...base, activeWorkspaceId: ws.id, workspaces, localOnlyMode: false };
        });
      }
      applyWorkspacePaths(ws);
    },
    [applyWorkspacePaths],
  );

  const handleGitUserSelected = useCallback((user: GitUserProfile) => {
    saveCachedGitUser(user);
    saveCachedLocalOnly(false);
    setSession((prev) => ({
      gitUser: user,
      activeWorkspaceId: prev?.activeWorkspaceId ?? null,
      workspaces: prev?.workspaces ?? [],
      localOnlyMode: false,
    }));
  }, []);

  const handleLocalOnly = useCallback(async () => {
    saveCachedLocalOnly(true);
    if (window.electronAPI?.workspaceSetLocalOnly) {
      const s = await window.electronAPI.workspaceSetLocalOnly({ enabled: true });
      setSession(s);
      return;
    }
    setSession({
      gitUser: null,
      activeWorkspaceId: null,
      workspaces: [],
      localOnlyMode: true,
    });
  }, []);

  useEffect(() => {
    if (!showMainApp || !isElectron() || !window.electronAPI?.onWorkspaceHistoryProgress) {
      return;
    }
    return window.electronAPI.onWorkspaceHistoryProgress((msg) => {
      if (msg.done) {
        void window.electronAPI?.workspaceSessionLoad?.().then((s) => {
          setSession(s);
        });
        return;
      }
      const workspaceId = typeof msg.workspaceId === "string" ? msg.workspaceId : null;
      if (!workspaceId) {
        return;
      }
      setSession((prev) => {
        if (!prev) {
          return prev;
        }
        const workspaces = prev.workspaces.map((w) => {
          if (w.id !== workspaceId) {
            return w;
          }
          return {
            ...w,
            historyStatus: "indexing" as const,
            historyProgress: {
              current: typeof msg.current === "number" ? msg.current : w.historyProgress?.current ?? 0,
              total: typeof msg.total === "number" ? msg.total : w.historyProgress?.total ?? 0,
              message: typeof msg.message === "string" ? msg.message : w.historyProgress?.message ?? "",
            },
          };
        });
        return { ...prev, workspaces };
      });
    });
  }, [showMainApp]);

  useEffect(() => {
    if (!sessionReady || onboardingGate !== "app" || !activeWorkspace) {
      return;
    }
    const commits = activeWorkspace.commits ?? [];
    if (commits.length >= 2 && !left && !right) {
      const head = commits[commits.length - 1];
      const base = commits[commits.length - 2];
      setLeft(base.snapshotPath);
      setRight(head.snapshotPath);
    } else if (!left && !right) {
      setLeft(activeWorkspace.repoRoot);
      setRight(activeWorkspace.repoRoot);
    }
  }, [sessionReady, onboardingGate, activeWorkspace, left, right]);

  const ensureSnapshot = useCallback(
    async (commit: WorkspaceCommitSnapshot) => {
      if (!activeWorkspace?.id || !window.electronAPI?.workspaceEnsureCommitSnapshot) {
        return commit.snapshotPath;
      }
      const result = await window.electronAPI.workspaceEnsureCommitSnapshot({
        workspaceId: activeWorkspace.id,
        hash: commit.hash,
        snapshotPath: commit.snapshotPath,
      });
      return result.snapshotPath;
    },
    [activeWorkspace?.id],
  );

  const compareHistoryCommits = useCallback(
    async (
      base: WorkspaceCommitSnapshot,
      head: WorkspaceCommitSnapshot | null,
      options?: GitHistoryCompareOptions,
    ) => {
      setError(null);
      try {
        const leftPath = await ensureSnapshot(base);
        let rightPath = "";
        if (options?.useLiveHead && options.liveRepoRoot?.trim()) {
          rightPath = options.liveRepoRoot.trim();
        } else if (head) {
          rightPath = await ensureSnapshot(head);
        }
        if (!rightPath) {
          throw new Error("Select a head revision or enable live dev folder compare.");
        }
        setLeft(leftPath);
        setRight(rightPath);
        setWorkspacePage("compare");
        await runCompare(leftPath, rightPath);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [ensureSnapshot, runCompare],
  );

  const documentHistoryCommits = useCallback(
    async (baseCommit: WorkspaceCommitSnapshot, headCommit: WorkspaceCommitSnapshot) => {
      setError(null);
      try {
        const leftPath = await ensureSnapshot(baseCommit);
        const rightPath = await ensureSnapshot(headCommit);
        setLeft(leftPath);
        setRight(rightPath);
        setWorkspacePage("docs");
        await runCompare(leftPath, rightPath);
        setDocGenTrigger((n) => n + 1);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [ensureSnapshot, runCompare],
  );

  const persistLiveDevRepo = useCallback(
    async (liveDevRepoRoot: string) => {
      if (!activeWorkspace?.id || !window.electronAPI?.workspaceUpdateLiveRepo) {
        return;
      }
      const s = await window.electronAPI.workspaceUpdateLiveRepo({
        workspaceId: activeWorkspace.id,
        liveDevRepoRoot,
      });
      setSession(s);
    },
    [activeWorkspace?.id],
  );

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
    upsertActivity({
      id: "diff",
      kind: "diff",
      label: "Loading file diff",
      detail: selectedPath,
      progress: null,
    });
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
          removeActivity("diff");
        }
      });
    return () => {
      cancelled = true;
      removeActivity("diff");
      void window.electronAPI?.llmAbortStream?.();
    };
  }, [removeActivity, selectedPath, left, right, rows, upsertActivity]);

  useEffect(() => {
    if (fileSummaryLoading) {
      upsertActivity({
        id: "file-summary",
        kind: "llm",
        label: "Generating file summary",
        detail: selectedPath ?? undefined,
        progress: fileSummaryChunk
          ? ((fileSummaryChunk.index + 1) / fileSummaryChunk.total) * 100
          : null,
      });
      return;
    }
    removeActivity("file-summary");
  }, [
    fileSummaryChunk,
    fileSummaryLoading,
    removeActivity,
    selectedPath,
    upsertActivity,
  ]);

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
      setSelectedDiffSummaryModalOpen(true);
      setSelectedDiffSummaryError(
        "Paths under novadiff-docs/ are reserved for generated documentation and are not summarized.",
      );
      return;
    }
    const fc = rows.find((r) => r.path === selectedPath);
    if (!fc) {
      return;
    }
    setSelectedDiffSummaryModalOpen(true);
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
      <AppLaunchShell
        onPhaseChange={setLaunchPhase}
        chrome={
          isElectron() ? (
            <WindowChrome
              state={windowChrome}
              onMinimize={() => void window.electronAPI?.minimizeWindow?.()}
              onToggleMaximize={() => void window.electronAPI?.toggleMaximizeWindow?.()}
              onToggleFullscreen={() => toggleFullscreen()}
              onClose={() => void window.electronAPI?.closeWindow?.()}
            />
          ) : null
        }
      >
      {!showMainApp && onboardingGate === "welcome" ? (
        <div className="onboarding-overlay">
          <WelcomeScreen onComplete={handleGitUserSelected} onLocalOnly={() => void handleLocalOnly()} />
        </div>
      ) : null}
      {!showMainApp && onboardingGate === "hub" && session?.gitUser ? (
        <div className="onboarding-overlay">
          <WorkspaceHub
            gitUser={session.gitUser}
            workspaces={session.workspaces}
            onSessionChange={(workspaces) => {
              setSession((prev) => {
                if (!prev) {
                  return prev;
                }
                return {
                  ...prev,
                  workspaces,
                };
              });
            }}
            onOpenWorkspace={(ws, serverSession) => void activateWorkspace(ws, serverSession)}
          />
        </div>
      ) : null}
      {showMainApp ? (
      <>
      <LlmSettingsModal
        open={settingsOpen}
        initial={llmSettings}
        onClose={() => setSettingsOpen(false)}
        onSaved={(s) => setLlmSettings(s)}
      />
      <div className="launch-panel launch-panel--side">
        <SidebarNav
          active={compared && rows.length > 0}
          workspacePage={workspacePage}
          onWorkspacePage={setWorkspacePage}
          leftFolderName={leftTitle}
          rightFolderName={rightTitle}
          localOnlyMode={Boolean(session?.localOnlyMode)}
          gitUser={session?.localOnlyMode ? null : session?.gitUser ?? null}
          workspaceName={
            session?.localOnlyMode ? "Folder compare" : activeWorkspace?.name ?? null
          }
          workspaceRepoLabel={
            session?.localOnlyMode
              ? "Local · pick two folders"
              : activeWorkspace
                ? activeWorkspace.githubSlug ?? baseName(activeWorkspace.repoRoot)
                : null
          }
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </div>
      <div className="launch-panel launch-panel--main">
        <WorkspaceStage pageKey={workspacePage}>
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
          compareStatusMessage={compareEngineMessage}
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
          selectedDiffSummaryModalOpen={selectedDiffSummaryModalOpen}
          onCloseSelectedDiffSummaryModal={() => setSelectedDiffSummaryModalOpen(false)}
        />
      ) : workspacePage === "history" && activeWorkspace ? (
        <GitHistoryWorkspace
          workspace={activeWorkspace}
          busy={busy}
          error={error}
          onCompareCommits={compareHistoryCommits}
          onDocumentCommit={documentHistoryCommits}
          onLiveRepoPersist={persistLiveDevRepo}
        />
      ) : workspacePage === "docs" ? (
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
          onOpenInsightsDock={() => setDocsInsightsOpen(true)}
          insightsDockOpen={docsInsightsOpen}
        />
      ) : workspacePage === "prs" ? (
        <PullRequestsWorkspace
          suggestedRepoPath={right.trim() || left.trim()}
          onOpenCompare={openPrCompare}
          onUseRepoAsTarget={useRepoAsTarget}
        />
      ) : (
        <AutoCommitWorkspace
          suggestedRepoPath={right.trim() || left.trim()}
          compared={compared}
          compareRows={rows}
          leftRoot={left}
          rightRoot={right}
          leftTitle={leftTitle}
          rightTitle={rightTitle}
          llmSettings={llmSettings}
        />
      )}
        </WorkspaceStage>
      </div>
      {workspacePage !== "docs" || docsInsightsOpen ? (
      <div className="launch-panel launch-panel--insights">
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
          prefetchProgress={prefetchProgress}
        />
      </div>
      </div>
      ) : null}
      </>
      ) : null}
      </AppLaunchShell>
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

export default function App() {
  return (
    <BackgroundActivityProvider>
      <AppMain />
      <BackgroundActivityBar />
    </BackgroundActivityProvider>
  );
}
