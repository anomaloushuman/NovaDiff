import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CodeCityModel,
  CodebaseOutline,
  EvidenceBadge,
  FileChange,
  NovadiffDocsBundleKey,
  RiskSignal,
  SelectionIndexEntry,
  SummaryIndexEntry,
} from "../app/types";
import {
  buildCodebaseMetricsMarkdown,
  buildCodebasePromptContext,
  codebaseDepthMermaid,
  codebaseExtensionPieMermaid,
} from "../app/codebaseDocs";
import {
  buildCommitMessageContext,
  parseCommitMessageOutput,
} from "../app/commitMessage";
import {
  buildCompareMetricsMarkdown,
  buildDocWorkspaceMetrics,
  changeKindPieMermaid,
  depthBarMermaid,
  metricsToPromptContext,
  type GitignorePromptMeta,
} from "../app/docWorkspaceMetrics";
import { bundleLabel, bundleShortDescription, DOC_PREVIEW_PAGES } from "../app/novadiffDocs";
import { DocMermaidMount } from "./DocMermaidMount";
import type { LlmSettings } from "../app/llmStorage";
import { buildCodeCityLayout } from "../app/codeCityLayout";
import {
  buildReleaseOverviewMarkdown,
  buildRiskPromptContext,
  buildSummaryPromptContext,
  deriveConfidenceBadges,
  relPathAnchorId,
} from "../app/docsQuality";
import { CodeCityLegend } from "./CodeCityLegend";
import { CodeCityView } from "./CodeCityView";
import { KnowledgeGraphPanel } from "./KnowledgeGraphPanel";
import { useBackgroundActivityActionsOptional } from "../app/BackgroundActivityContext";
import { LlmSummaryMarkdown } from "./LlmSummaryMarkdown";

const MAX_AUTO_FILES = 400;
const SUMMARY_READ_BATCH = 10;
const SELECTION_READ_BATCH = 8;
const INITIAL_SUMMARY_RENDER = 6;
const INITIAL_SELECTION_RENDER = 4;
const RENDER_BATCH_STEP = 6;
type DocPreviewPage = (typeof DOC_PREVIEW_PAGES)[number];

function mergeSummaryEntries(
  prev: SummaryIndexEntry[],
  next: SummaryIndexEntry[],
): SummaryIndexEntry[] {
  const byPath = new Map(prev.map((entry) => [entry.relPath, entry]));
  for (const entry of next) {
    byPath.set(entry.relPath, entry);
  }
  return [...byPath.values()].sort((a, b) => a.relPath.localeCompare(b.relPath));
}

function mergeSelectionEntries(
  prev: SelectionIndexEntry[],
  next: SelectionIndexEntry[],
): SelectionIndexEntry[] {
  const byKey = new Map(prev.map((entry) => [`${entry.relPath}::${entry.selectionKey}`, entry]));
  for (const entry of next) {
    byKey.set(`${entry.relPath}::${entry.selectionKey}`, entry);
  }
  return [...byKey.values()].sort((a, b) => {
    const pathCmp = a.relPath.localeCompare(b.relPath);
    if (pathCmp !== 0) {
      return pathCmp;
    }
    return a.selectionKey.localeCompare(b.selectionKey);
  });
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

export interface DocumentationWorkspaceProps {
  compared: boolean;
  leftRoot: string;
  rightRoot: string;
  leftTitle: string;
  rightTitle: string;
  rows: FileChange[];
  fileStats: { added: number; removed: number; modified: number; total: number };
  llmSettings: LlmSettings;
  docGenTrigger: number;
  workspaceDocAuto: boolean;
  onWorkspaceDocAutoChange: (value: boolean) => void;
  onJumpToCompare: (path: string) => void;
  onOpenInsightsDock?: () => void;
  insightsDockOpen?: boolean;
}

export function DocumentationWorkspace({
  compared,
  leftRoot,
  rightRoot,
  leftTitle,
  rightTitle,
  rows,
  fileStats,
  llmSettings,
  docGenTrigger,
  workspaceDocAuto,
  onWorkspaceDocAutoChange,
  onJumpToCompare,
  onOpenInsightsDock,
  insightsDockOpen = false,
}: DocumentationWorkspaceProps) {
  const { upsertActivity, removeActivity } = useBackgroundActivityActionsOptional() ?? {};
  const [asyncFiltered, setAsyncFiltered] = useState<FileChange[] | null>(null);
  const [gitignoreMeta, setGitignoreMeta] = useState<GitignorePromptMeta | null>(
    null,
  );
  const [docFilterReady, setDocFilterReady] = useState(false);
  const [docFilterSettled, setDocFilterSettled] = useState(false);
  const [docFilterLoading, setDocFilterLoading] = useState(false);
  const [skippedNovadiffDocs, setSkippedNovadiffDocs] = useState<number | null>(
    null,
  );
  const [baselineOutline, setBaselineOutline] = useState<CodebaseOutline | null>(null);
  const [baselineOutlineLoading, setBaselineOutlineLoading] = useState(false);
  const [codebaseOutline, setCodebaseOutline] = useState<CodebaseOutline | null>(null);
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [activeBundleKey, setActiveBundleKey] =
    useState<NovadiffDocsBundleKey>("change-report");
  const [docWriteNote, setDocWriteNote] = useState<string | null>(null);
  const [docPreviewHtml, setDocPreviewHtml] = useState<string | null>(null);
  const [docPreviewPage, setDocPreviewPage] = useState<DocPreviewPage>("index.html");
  const [docPreviewError, setDocPreviewError] = useState<string | null>(null);
  const [summaryReloadToken, setSummaryReloadToken] = useState(0);
  const [savedSummaries, setSavedSummaries] = useState<SummaryIndexEntry[]>([]);
  const [savedSummariesLoading, setSavedSummariesLoading] = useState(false);
  const [savedSummariesError, setSavedSummariesError] = useState<string | null>(null);
  const [savedSelectionDocs, setSavedSelectionDocs] = useState<SelectionIndexEntry[]>([]);
  const [savedSelectionDocsLoading, setSavedSelectionDocsLoading] = useState(false);
  const [savedSelectionDocsError, setSavedSelectionDocsError] = useState<string | null>(
    null,
  );
  const [riskSignals, setRiskSignals] = useState<RiskSignal[]>([]);
  const [riskSignalsLoading, setRiskSignalsLoading] = useState(false);
  const [riskSignalsError, setRiskSignalsError] = useState<string | null>(null);
  const [summarySearch, setSummarySearch] = useState("");
  const [selectionSearch, setSelectionSearch] = useState("");
  const [summaryLoaderReady, setSummaryLoaderReady] = useState(false);
  const [selectionLoaderReady, setSelectionLoaderReady] = useState(false);
  const [riskLoaderReady, setRiskLoaderReady] = useState(false);
  const [outlineLoaderReady, setOutlineLoaderReady] = useState(false);
  const [commitLoaderReady, setCommitLoaderReady] = useState(false);
  const [summaryRenderCount, setSummaryRenderCount] = useState(INITIAL_SUMMARY_RENDER);
  const [selectionRenderCount, setSelectionRenderCount] = useState(INITIAL_SELECTION_RENDER);
  const [cityVisible, setCityVisible] = useState(false);

  const previewFrameRef = useRef<HTMLIFrameElement>(null);
  const summarySectionRef = useRef<HTMLElement>(null);
  const citySectionRef = useRef<HTMLElement>(null);

  const focusSummaryQuery = useCallback((value: string) => {
    setSummarySearch(value);
    summarySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    setDocPreviewHtml(null);
    setDocPreviewPage("index.html");
    setDocPreviewError(null);
    setActiveBundleKey("change-report");
  }, [rightRoot]);

  useEffect(() => {
    setSummaryLoaderReady(false);
    setSelectionLoaderReady(false);
    setRiskLoaderReady(false);
    setOutlineLoaderReady(false);
    setCommitLoaderReady(false);
    setDocFilterReady(false);
    setDocFilterSettled(false);
    setSummaryRenderCount(INITIAL_SUMMARY_RENDER);
    setSelectionRenderCount(INITIAL_SELECTION_RENDER);
    if (!compared) {
      return;
    }
    const timers: number[] = [];
    const frame = window.requestAnimationFrame(() => {
      timers.push(window.setTimeout(() => setDocFilterReady(true), 0));
      timers.push(window.setTimeout(() => setSummaryLoaderReady(true), 0));
      timers.push(window.setTimeout(() => setSelectionLoaderReady(true), 70));
      timers.push(window.setTimeout(() => setRiskLoaderReady(true), 140));
      timers.push(window.setTimeout(() => setOutlineLoaderReady(true), 220));
      timers.push(window.setTimeout(() => setCommitLoaderReady(true), 320));
    });
    return () => {
      window.cancelAnimationFrame(frame);
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [compared, leftRoot, rightRoot]);

  useEffect(() => {
    const el = citySectionRef.current;
    if (!el) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setCityVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!docFilterReady || !compared || rows.length === 0) {
      setAsyncFiltered(null);
      setGitignoreMeta(null);
      setDocFilterLoading(false);
      setSkippedNovadiffDocs(null);
      setDocFilterSettled(!compared || rows.length === 0);
      return;
    }
    const l = leftRoot.trim();
    const r = rightRoot.trim();
    const api = window.electronAPI;
    if (!l || !r || !api?.filterChangesGitignore) {
      setAsyncFiltered(null);
      setGitignoreMeta(null);
      setDocFilterLoading(false);
      setSkippedNovadiffDocs(null);
      setDocFilterSettled(true);
      return;
    }
    let cancelled = false;
    setAsyncFiltered(null);
    setDocFilterLoading(true);
    setDocFilterSettled(false);
    void api
      .filterChangesGitignore({ changes: rows, leftRoot: l, rightRoot: r })
      .then((out) => {
        if (cancelled) {
          return;
        }
        const next = Array.isArray(out.changes)
          ? (out.changes as FileChange[])
          : rows;
        setAsyncFiltered(next);
        const skipped =
          typeof out.skipped_gitignore === "number" ? out.skipped_gitignore : 0;
        const input =
          typeof out.input_changes === "number" ? out.input_changes : rows.length;
        setGitignoreMeta(
          skipped > 0 ? { inputTotal: input, skippedGitignore: skipped } : null,
        );
        const skippedNd =
          typeof out.skipped_novadiff_docs === "number"
            ? out.skipped_novadiff_docs
            : 0;
        setSkippedNovadiffDocs(skippedNd > 0 ? skippedNd : null);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setAsyncFiltered(null);
        setGitignoreMeta(null);
        setSkippedNovadiffDocs(null);
      })
      .finally(() => {
        if (!cancelled) {
          setDocFilterLoading(false);
          setDocFilterSettled(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [compared, rows, leftRoot, rightRoot, docFilterReady]);

  const docRows = useMemo(
    () => asyncFiltered ?? rows,
    [asyncFiltered, rows],
  );

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onSummaryPrefetchProgress) {
      return;
    }
    return api.onSummaryPrefetchProgress((msg) => {
      if (!msg || typeof msg !== "object") {
        return;
      }
      if (msg.state === "finished") {
        setSummaryReloadToken((n) => n + 1);
      }
    });
  }, []);

  useEffect(() => {
    const root = rightRoot.trim();
    const api = window.electronAPI;
    if (
      !summaryLoaderReady ||
      !compared ||
      !docFilterSettled ||
      docFilterLoading ||
      !root ||
      docRows.length === 0 ||
      !api?.readFileSummaryMarkdowns
    ) {
      setSavedSummaries([]);
      setSavedSummariesLoading(false);
      setSavedSummariesError(null);
      return;
    }
    let cancelled = false;
    const readFileSummaryMarkdowns = api.readFileSummaryMarkdowns;
    setSavedSummariesLoading(true);
    setSavedSummariesError(null);
    setSavedSummaries([]);
    void (async () => {
      try {
        const paths = docRows.map((r) => r.path);
        for (let index = 0; index < paths.length; index += SUMMARY_READ_BATCH) {
          const items = await readFileSummaryMarkdowns({
            targetRoot: root,
            relPaths: paths.slice(index, index + SUMMARY_READ_BATCH),
          });
          if (cancelled) {
            return;
          }
          setSavedSummaries((prev) =>
            mergeSummaryEntries(prev, Array.isArray(items) ? items : []),
          );
          await yieldToBrowser();
        }
      } catch (e) {
        if (cancelled) {
          return;
        }
        setSavedSummaries([]);
        setSavedSummariesError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) {
          setSavedSummariesLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    compared,
    docFilterSettled,
    docFilterLoading,
    rightRoot,
    docRows,
    summaryReloadToken,
    summaryLoaderReady,
  ]);

  useEffect(() => {
    const left = leftRoot.trim();
    const right = rightRoot.trim();
    const api = window.electronAPI;
    if (
      !riskLoaderReady ||
      !compared ||
      !docFilterSettled ||
      docFilterLoading ||
      !left ||
      !right ||
      docRows.length === 0 ||
      !api?.scanRiskSignals
    ) {
      setRiskSignals([]);
      setRiskSignalsLoading(false);
      setRiskSignalsError(null);
      return;
    }
    let cancelled = false;
    setRiskSignalsLoading(true);
    setRiskSignalsError(null);
    void api
      .scanRiskSignals({
        leftRoot: left,
        rightRoot: right,
        changes: docRows,
      })
      .then((items) => {
        if (!cancelled) {
          setRiskSignals(Array.isArray(items) ? items : []);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setRiskSignals([]);
          setRiskSignalsError(e instanceof Error ? e.message : String(e));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRiskSignalsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    compared,
    docFilterSettled,
    docFilterLoading,
    docRows,
    leftRoot,
    rightRoot,
    riskLoaderReady,
  ]);

  useEffect(() => {
    const root = rightRoot.trim();
    const api = window.electronAPI;
    if (
      !selectionLoaderReady ||
      !compared ||
      !docFilterSettled ||
      docFilterLoading ||
      !root ||
      docRows.length === 0 ||
      !api?.readSelectionSummaryMarkdowns
    ) {
      setSavedSelectionDocs([]);
      setSavedSelectionDocsLoading(false);
      setSavedSelectionDocsError(null);
      return;
    }
    let cancelled = false;
    const readSelectionSummaryMarkdowns = api.readSelectionSummaryMarkdowns;
    setSavedSelectionDocsLoading(true);
    setSavedSelectionDocsError(null);
    setSavedSelectionDocs([]);
    void (async () => {
      try {
        const paths = docRows.map((r) => r.path);
        for (let index = 0; index < paths.length; index += SELECTION_READ_BATCH) {
          const items = await readSelectionSummaryMarkdowns({
            targetRoot: root,
            relPaths: paths.slice(index, index + SELECTION_READ_BATCH),
          });
          if (cancelled) {
            return;
          }
          setSavedSelectionDocs((prev) =>
            mergeSelectionEntries(prev, Array.isArray(items) ? items : []),
          );
          await yieldToBrowser();
        }
      } catch (e) {
        if (cancelled) {
          return;
        }
        setSavedSelectionDocs([]);
        setSavedSelectionDocsError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) {
          setSavedSelectionDocsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    compared,
    docFilterSettled,
    docFilterLoading,
    rightRoot,
    docRows,
    summaryReloadToken,
    selectionLoaderReady,
  ]);

  useEffect(() => {
    const l = leftRoot.trim();
    const api = window.electronAPI;
    if (!outlineLoaderReady || !compared || !l || !api?.scanCodebaseOutline) {
      setBaselineOutline(null);
      setBaselineOutlineLoading(false);
      return;
    }
    let cancelled = false;
    setBaselineOutlineLoading(true);
    void api
      .scanCodebaseOutline(l)
      .then((o) => {
        if (cancelled) {
          return;
        }
        setBaselineOutline(o ?? null);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setBaselineOutline(null);
      })
      .finally(() => {
        if (!cancelled) {
          setBaselineOutlineLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [compared, leftRoot, outlineLoaderReady]);

  useEffect(() => {
    const r = rightRoot.trim();
    const api = window.electronAPI;
    if (!outlineLoaderReady || !compared || !r || !api?.scanCodebaseOutline) {
      setCodebaseOutline(null);
      setOutlineLoading(false);
      return;
    }
    let cancelled = false;
    setOutlineLoading(true);
    void api
      .scanCodebaseOutline(r)
      .then((o) => {
        if (cancelled) {
          return;
        }
        setCodebaseOutline(o ?? null);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setCodebaseOutline(null);
      })
      .finally(() => {
        if (!cancelled) {
          setOutlineLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [compared, rightRoot, outlineLoaderReady]);

  useEffect(() => {
    const api = window.electronAPI;
    const l = leftRoot.trim();
    const r = rightRoot.trim();
    if (!cityVisible || !compared || !l || !r || !api?.buildCodeCityModel) {
      setCityModel(null);
      setCityLoading(false);
      setCityError(null);
      return;
    }
    let cancelled = false;
    setCityLoading(true);
    setCityError(null);
    void api
      .buildCodeCityModel({
        leftRoot: l,
        rightRoot: r,
        leftLabel: leftTitle,
        rightLabel: rightTitle,
        changes: rows,
      })
      .then((model) => {
        if (cancelled) {
          return;
        }
        setCityModel(model ?? null);
      })
      .catch((e) => {
        if (cancelled) {
          return;
        }
        setCityModel(null);
        setCityError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) {
          setCityLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [cityVisible, compared, leftRoot, rightRoot, leftTitle, rightTitle, rows]);

  const metrics = useMemo(() => buildDocWorkspaceMetrics(docRows), [docRows]);
  const metricsChartsLoading = docFilterLoading || !docFilterSettled;

  const pieDef = useMemo(() => changeKindPieMermaid(metrics), [metrics]);
  const depthDef = useMemo(() => depthBarMermaid(metrics), [metrics]);
  const importDef = useMemo(() => {
    const s = codebaseOutline?.import_graph_mermaid;
    return typeof s === "string" && s.trim().length > 0
      ? s
      : "flowchart TB\n  empty[No JS/TS import graph yet]";
  }, [codebaseOutline]);
  const callDef = useMemo(() => {
    const s = codebaseOutline?.cross_file_call_graph_mermaid;
    return typeof s === "string" && s.trim().length > 0
      ? s
      : "flowchart TB\n  empty[No cross-file call graph yet]";
  }, [codebaseOutline]);

  const [docMarkdown, setDocMarkdown] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [cityModel, setCityModel] = useState<CodeCityModel | null>(null);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityError, setCityError] = useState<string | null>(null);
  const [cityRootSide, setCityRootSide] = useState<"baseline" | "target">("target");
  const [cityCompareOverlay, setCityCompareOverlay] = useState(true);
  const [cityBlameOverlay, setCityBlameOverlay] = useState(false);
  const [cityChangedOnly, setCityChangedOnly] = useState(false);
  const [citySubsystem, setCitySubsystem] = useState("all");
  const [cityExtension, setCityExtension] = useState("all");
  const [citySymbolKind, setCitySymbolKind] = useState("all");
  const [cityAuthor, setCityAuthor] = useState("all");
  const [citySearch, setCitySearch] = useState("");
  const [selectedCityBuilding, setSelectedCityBuilding] = useState<ReturnType<
    typeof buildCodeCityLayout
  >["buildings"][number] | null>(null);
  useEffect(() => {
    if (docFilterLoading) {
      upsertActivity?.({
        id: "doc-filter",
        kind: "filter",
        label: "Applying compare filters",
        detail: "Gitignore and novadiff-docs rules",
        progress: null,
      });
    } else {
      removeActivity?.("doc-filter");
    }
  }, [docFilterLoading, removeActivity, upsertActivity]);

  useEffect(() => {
    if (outlineLoading) {
      upsertActivity?.({
        id: "doc-outline",
        kind: "outline",
        label: "Scanning codebase outline",
        detail: "Imports and cross-file heuristics",
        progress: null,
      });
    } else {
      removeActivity?.("doc-outline");
    }
  }, [outlineLoading, removeActivity, upsertActivity]);

  useEffect(() => {
    if (docLoading) {
      upsertActivity?.({
        id: "doc-gen",
        kind: "docs",
        label: "Generating documentation bundle",
        detail: "Streaming AI narrative",
        progress: null,
      });
    } else {
      removeActivity?.("doc-gen");
    }
  }, [docLoading, removeActivity, upsertActivity]);

  useEffect(() => {
    if (cityLoading) {
      upsertActivity?.({
        id: "code-city",
        kind: "city",
        label: "Building 3D code city",
        progress: null,
      });
    } else {
      removeActivity?.("code-city");
    }
  }, [cityLoading, removeActivity, upsertActivity]);

  const cityLayout = useMemo(
    () =>
      buildCodeCityLayout(cityModel, {
        rootSide: cityRootSide,
        compareOverlay: cityCompareOverlay,
        blameOverlay: cityBlameOverlay,
        changedOnly: cityChangedOnly,
        subsystem: citySubsystem,
        extension: cityExtension,
        symbolKind: citySymbolKind,
        author: cityAuthor,
        search: citySearch,
      }),
    [
      cityBlameOverlay,
      cityChangedOnly,
      cityCompareOverlay,
      cityExtension,
      cityModel,
      cityRootSide,
      citySearch,
      citySubsystem,
      cityAuthor,
      citySymbolKind,
    ],
  );

  useEffect(() => {
    if (!selectedCityBuilding) {
      return;
    }
    if (!cityLayout.buildings.some((building) => building.id === selectedCityBuilding.id)) {
      setSelectedCityBuilding(null);
    }
  }, [cityLayout.buildings, selectedCityBuilding]);

  const cityStats = useMemo(() => {
    let added = 0;
    let modified = 0;
    let removed = 0;
    let unchanged = 0;
    for (const building of cityLayout.buildings) {
      if (building.changeState === "added") {
        added += 1;
      } else if (building.changeState === "modified") {
        modified += 1;
      } else if (building.changeState === "removed") {
        removed += 1;
      } else {
        unchanged += 1;
      }
    }
    return {
      added,
      modified,
      removed,
      unchanged,
      changed: added + modified + removed,
    };
  }, [cityLayout.buildings]);

  const resetCityFilters = useCallback(() => {
    setCityRootSide("target");
    setCityCompareOverlay(true);
    setCityBlameOverlay(false);
    setCityChangedOnly(false);
    setCitySubsystem("all");
    setCityExtension("all");
    setCitySymbolKind("all");
    setCityAuthor("all");
    setCitySearch("");
    setSelectedCityBuilding(null);
  }, []);

  const [commitSubject, setCommitSubject] = useState("");
  const [commitBody, setCommitBody] = useState("");
  const [commitLoading, setCommitLoading] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [copiedHint, setCopiedHint] = useState<string | null>(null);
  const commitGenId = useRef(0);

  const commitInputKey = useMemo(
    () =>
      JSON.stringify({
        model: `${llmSettings.provider}:${llmSettings.model}:${llmSettings.baseUrl}`,
        rows: docRows.map((r) => [r.path, r.kind]),
        left: leftRoot.trim(),
        right: rightRoot.trim(),
      }),
    [
      docRows,
      leftRoot,
      rightRoot,
      llmSettings.provider,
      llmSettings.model,
      llmSettings.baseUrl,
    ],
  );

  useEffect(() => {
    if (
      !commitLoaderReady ||
      !compared ||
      !docFilterSettled ||
      docRows.length === 0 ||
      docFilterLoading
    ) {
      setCommitSubject("");
      setCommitBody("");
      setCommitLoading(false);
      setCommitError(null);
      return;
    }
    const api = window.electronAPI;
    if (!api?.llmSummarize) {
      return;
    }
    const ctx = buildCommitMessageContext(
      metrics,
      docRows,
      leftTitle,
      rightTitle,
      leftRoot,
      rightRoot,
    );
    commitGenId.current += 1;
    const rid = commitGenId.current;
    let cancelled = false;
    setCommitLoading(true);
    setCommitError(null);
    void api
      .llmSummarize({
        ...llmSettings,
        commitMessage: true,
        commitContext: ctx,
        relPath: "(commit-message)",
        kind: "modified",
        leftLabel: leftTitle,
        rightLabel: rightTitle,
      })
      .then((text) => {
        if (cancelled || rid !== commitGenId.current) {
          return;
        }
        const parsed = parseCommitMessageOutput(text);
        setCommitSubject(parsed.subject);
        setCommitBody(parsed.body);
      })
      .catch((e) => {
        if (cancelled || rid !== commitGenId.current) {
          return;
        }
        setCommitError(e instanceof Error ? e.message : String(e));
        setCommitSubject("");
        setCommitBody("");
      })
      .finally(() => {
        if (!cancelled && rid === commitGenId.current) {
          setCommitLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    compared,
    commitLoaderReady,
    docFilterSettled,
    docFilterLoading,
    commitInputKey,
    metrics,
    docRows,
    leftTitle,
    rightTitle,
    leftRoot,
    rightRoot,
    llmSettings,
  ]);

  const copyToClipboard = useCallback(async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHint(label);
      window.setTimeout(() => setCopiedHint(null), 2000);
    } catch {
      setCopiedHint("Copy failed");
      window.setTimeout(() => setCopiedHint(null), 2500);
    }
  }, []);

  const copySelectionDocs = useCallback(() => {
    const markdown = savedSelectionDocs
      .map((entry, index) => {
        const metaBits = [
          `requested ${entry.requestedMode}`,
          entry.effectiveMode !== entry.requestedMode
            ? `effective ${entry.effectiveMode}`
            : null,
          entry.symbol
            ? `${entry.symbol.side} ${entry.symbol.kind} \`${entry.symbol.name}\``
            : null,
        ]
          .filter(Boolean)
          .join(" · ");
        return `## ${index + 1}. \`${entry.relPath}\` — ${entry.label}\n\n${
          metaBits ? `_${metaBits}_\n\n` : ""
        }${entry.markdown.trim()}`;
      })
      .join("\n\n---\n\n");
    return copyToClipboard("Selection docs copied", markdown);
  }, [copyToClipboard, savedSelectionDocs]);

  const loadDocPreviewPage = useCallback(
    async (bundleKey: NovadiffDocsBundleKey, relPath: DocPreviewPage) => {
      const root = rightRoot.trim();
      const api = window.electronAPI;
      if (!root || !api?.readNovadiffDocsFile) {
        return;
      }
      setDocPreviewError(null);
      try {
        const html = await api.readNovadiffDocsFile({
          targetRoot: root,
          bundleKey,
          relPath,
          forPreview: true,
        });
        setActiveBundleKey(bundleKey);
        setDocPreviewPage(relPath);
        setDocPreviewHtml(typeof html === "string" && html.length > 0 ? html : null);
      } catch (e) {
        setDocPreviewHtml(null);
        setDocPreviewError(e instanceof Error ? e.message : String(e));
      }
    },
    [rightRoot],
  );

  const handlePreviewFrameLoad = useCallback(() => {
    const doc = previewFrameRef.current?.contentDocument;
    if (!doc) {
      return;
    }
    const view = doc.defaultView;
    if (!view) {
      return;
    }
    doc.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof view.Element)) {
        return;
      }
      const anchor = target.closest("a");
      if (!(anchor instanceof view.HTMLAnchorElement)) {
        return;
      }
      const href = anchor.getAttribute("href")?.trim() ?? "";
      if (!href) {
        return;
      }
      const normalized = href.split("#")[0]?.split("?")[0] ?? "";
      if (DOC_PREVIEW_PAGES.includes(normalized as DocPreviewPage)) {
        event.preventDefault();
        void loadDocPreviewPage(activeBundleKey, normalized as DocPreviewPage);
      }
    });
  }, [activeBundleKey, loadDocPreviewPage]);

  const unifiedSummaryEntries = useMemo(() => {
    const byPath = new Map(savedSummaries.map((item) => [item.relPath, item]));
    return docRows.flatMap((row) => {
      const entry = byPath.get(row.path);
      return entry?.markdown
        ? [
            {
              relPath: row.path,
              kind: row.kind,
              markdown: entry.markdown.trim(),
              badges: Array.isArray(entry.badges) ? entry.badges : [],
              htmlRelPath: entry.htmlRelPath ?? null,
            },
          ]
        : [];
    });
  }, [docRows, savedSummaries]);

  const copyUnifiedSummaries = useCallback(() => {
    const markdown = unifiedSummaryEntries
      .map(
        (entry, index) =>
          `## ${index + 1}. \`${entry.relPath}\`\n\n_Change kind: ${
            entry.kind
          }_\n\n${entry.markdown}`,
      )
      .join("\n\n---\n\n");
    return copyToClipboard("Unified summaries copied", markdown);
  }, [copyToClipboard, unifiedSummaryEntries]);

  const deferredSummarySearch = useDeferredValue(summarySearch);
  const deferredSelectionSearch = useDeferredValue(selectionSearch);

  const filteredSummaryEntries = useMemo(() => {
    const query = deferredSummarySearch.trim().toLowerCase();
    if (!query) {
      return unifiedSummaryEntries;
    }
    return unifiedSummaryEntries.filter((entry) => {
      const badgeText = (entry.badges ?? []).map((badge) => badge.label).join(" ").toLowerCase();
      return (
        entry.relPath.toLowerCase().includes(query) ||
        entry.kind.toLowerCase().includes(query) ||
        entry.markdown.toLowerCase().includes(query) ||
        badgeText.includes(query)
      );
    });
  }, [deferredSummarySearch, unifiedSummaryEntries]);

  const missingSummaryCount = Math.max(0, docRows.length - unifiedSummaryEntries.length);

  const filteredSelectionDocs = useMemo(() => {
    const query = deferredSelectionSearch.trim().toLowerCase();
    if (!query) {
      return savedSelectionDocs;
    }
    return savedSelectionDocs.filter((entry) => {
      const symbolText = entry.symbol ? `${entry.symbol.kind} ${entry.symbol.name}` : "";
      return (
        entry.relPath.toLowerCase().includes(query) ||
        entry.label.toLowerCase().includes(query) ||
        symbolText.toLowerCase().includes(query) ||
        entry.markdown.toLowerCase().includes(query)
      );
    });
  }, [deferredSelectionSearch, savedSelectionDocs]);

  const visibleSummaryEntries = useMemo(
    () => filteredSummaryEntries.slice(0, summaryRenderCount),
    [filteredSummaryEntries, summaryRenderCount],
  );

  const visibleSelectionDocs = useMemo(
    () => filteredSelectionDocs.slice(0, selectionRenderCount),
    [filteredSelectionDocs, selectionRenderCount],
  );

  useEffect(() => {
    setSummaryRenderCount((count) => {
      if (deferredSummarySearch.trim()) {
        return filteredSummaryEntries.length;
      }
      if (count === 0 || count > filteredSummaryEntries.length) {
        return Math.min(INITIAL_SUMMARY_RENDER, filteredSummaryEntries.length);
      }
      return count;
    });
  }, [filteredSummaryEntries.length, deferredSummarySearch]);

  useEffect(() => {
    if (summaryRenderCount >= filteredSummaryEntries.length) {
      return;
    }
    const timer = window.setTimeout(() => {
      setSummaryRenderCount((count) =>
        Math.min(count + RENDER_BATCH_STEP, filteredSummaryEntries.length),
      );
    }, 16);
    return () => window.clearTimeout(timer);
  }, [filteredSummaryEntries.length, summaryRenderCount]);

  useEffect(() => {
    setSelectionRenderCount((count) => {
      if (deferredSelectionSearch.trim()) {
        return filteredSelectionDocs.length;
      }
      if (count === 0 || count > filteredSelectionDocs.length) {
        return Math.min(INITIAL_SELECTION_RENDER, filteredSelectionDocs.length);
      }
      return count;
    });
  }, [filteredSelectionDocs.length, deferredSelectionSearch]);

  useEffect(() => {
    if (selectionRenderCount >= filteredSelectionDocs.length) {
      return;
    }
    const timer = window.setTimeout(() => {
      setSelectionRenderCount((count) =>
        Math.min(count + RENDER_BATCH_STEP, filteredSelectionDocs.length),
      );
    }, 16);
    return () => window.clearTimeout(timer);
  }, [filteredSelectionDocs.length, selectionRenderCount]);

  const confidenceBadges = useMemo<EvidenceBadge[]>(
    () =>
      deriveConfidenceBadges({
        rows: docRows,
        summaries: unifiedSummaryEntries,
        selections: savedSelectionDocs,
        riskSignals,
      }),
    [docRows, riskSignals, savedSelectionDocs, unifiedSummaryEntries],
  );

  const buildReleaseOverview = useCallback(
    () =>
      buildReleaseOverviewMarkdown({
        leftTitle,
        rightTitle,
        rows: docRows,
        summaries: unifiedSummaryEntries,
        selections: savedSelectionDocs,
        riskSignals,
        confidenceBadges,
      }),
    [
      confidenceBadges,
      docRows,
      leftTitle,
      rightTitle,
      riskSignals,
      savedSelectionDocs,
      unifiedSummaryEntries,
    ],
  );

  const runGenerate = useCallback(
    async (bundleKey: NovadiffDocsBundleKey = activeBundleKey) => {
    const api = window.electronAPI;
      if (!api?.llmSummarizeStream || !compared) {
        return;
      }
      const targetRoot = rightRoot.trim();
      const left = leftRoot.trim();
      const targetOutline = codebaseOutline;
      const outlineForBundle =
        bundleKey === "codebase-baseline" ? baselineOutline : targetOutline;
      const rootLabelForBundle =
        bundleKey === "codebase-baseline" ? leftTitle : rightTitle;
      const rootPathForBundle = bundleKey === "codebase-baseline" ? left : targetRoot;
      if (
        bundleKey === "change-report" &&
        (docRows.length === 0 || docFilterLoading || !docFilterSettled)
      ) {
        return;
      }
      if (bundleKey !== "change-report" && !outlineForBundle) {
        setDocError(`Codebase scan is not ready for ${bundleLabel(bundleKey)}.`);
        return;
      }
      setDocWriteNote(null);
      setDocPreviewHtml(null);
      setDocPreviewError(null);
      setDocLoading(true);
      setDocError(null);
      setDocMarkdown("");
      setActiveBundleKey(bundleKey);
      let finalText = "";
      let llmFailed = false;
      try {
        await api.llmAbortStream?.();
        await Promise.resolve();
        if (bundleKey === "change-report") {
          const appendix =
            typeof targetOutline?.prompt_appendix === "string"
              ? targetOutline.prompt_appendix
              : "";
          const summaryContext = buildSummaryPromptContext(unifiedSummaryEntries, 6);
          const riskContext = buildRiskPromptContext(riskSignals, 8);
          const confidenceContext = confidenceBadges
            .map((badge) => `- ${badge.label}: ${badge.description ?? "Evidence-backed confidence signal."}`)
            .join("\n");
          const baseContext = metricsToPromptContext(
            metrics,
            leftTitle,
            rightTitle,
            left,
            targetRoot,
            docRows.length,
            gitignoreMeta,
            appendix.trim() ? appendix.trim() : null,
          );
          const verificationContext = [
            riskContext,
            confidenceContext ? `Confidence hints for synthesis only:\n${confidenceContext}` : "",
          ]
            .filter(Boolean)
            .join("\n\n");
          await api.llmSummarizeStream(
            {
              ...llmSettings,
              workspaceDoc: true,
              workspaceContext: baseContext,
              summaryContext,
              verificationContext,
              riskSignals,
              relPath: "(workspace)",
              kind: "modified",
              leftLabel: leftTitle,
              rightLabel: rightTitle,
            },
            (text) => {
              finalText = text;
              setDocMarkdown(text);
            },
          );
        } else {
          const perspective = bundleKey === "codebase-baseline" ? "baseline" : "target";
          const ctx = buildCodebasePromptContext(
            outlineForBundle as CodebaseOutline,
            rootLabelForBundle,
            rootPathForBundle,
            perspective,
          );
          await api.llmSummarizeStream(
            {
              ...llmSettings,
              codebaseDoc: true,
              codebaseContext: ctx,
              codebasePerspective: perspective,
              relPath: `(${bundleKey})`,
              kind: "modified",
              leftLabel: leftTitle,
              rightLabel: rightTitle,
            },
            (text) => {
              finalText = text;
              setDocMarkdown(text);
            },
          );
        }
      } catch (e) {
        llmFailed = true;
        setDocError(e instanceof Error ? e.message : String(e));
      } finally {
        setDocLoading(false);
      }
      if (
        !llmFailed &&
        api.writeNovadiffDocs &&
        targetRoot.length > 0 &&
        finalText.trim().length > 0
      ) {
        try {
          const reportOutline =
            bundleKey === "change-report" ? targetOutline : outlineForBundle;
          const perspective = bundleKey === "codebase-baseline" ? "baseline" : "target";
          const releaseOverviewMd =
            bundleKey === "change-report" ? buildReleaseOverview() : "";
          const metricsMarkdown =
            bundleKey === "change-report"
              ? buildCompareMetricsMarkdown(metrics, docRows, leftTitle, rightTitle)
              : buildCodebaseMetricsMarkdown(
                  reportOutline as CodebaseOutline,
                  rootLabelForBundle,
                  rootPathForBundle,
                  perspective,
                );
          const res = await api.writeNovadiffDocs({
            targetRoot,
            bundleKey,
            docMode: bundleKey,
            leftRoot: left,
            rightRoot: targetRoot,
            leftTitle,
            rightTitle,
            generatedAt: new Date().toISOString(),
            aiMarkdown: finalText,
            compareMetricsMd: metricsMarkdown,
            codebaseOutline: reportOutline ?? undefined,
            changeMixMermaid:
              bundleKey === "change-report"
                ? pieDef
                : codebaseExtensionPieMermaid(reportOutline as CodebaseOutline),
            depthMermaid:
              bundleKey === "change-report"
                ? depthDef
                : codebaseDepthMermaid(reportOutline as CodebaseOutline),
            importGraphMermaid:
              typeof reportOutline?.import_graph_mermaid === "string"
                ? reportOutline.import_graph_mermaid
                : "",
            crossFileCallGraphMermaid:
              typeof reportOutline?.cross_file_call_graph_mermaid === "string"
                ? reportOutline.cross_file_call_graph_mermaid
                : "",
            classDiagramMermaid:
              typeof reportOutline?.class_diagram_mermaid === "string"
                ? reportOutline.class_diagram_mermaid
                : "",
            riskSignals: bundleKey === "change-report" ? riskSignals : [],
            summaryIndex: bundleKey === "change-report" ? unifiedSummaryEntries : [],
            selectionIndex: bundleKey === "change-report" ? savedSelectionDocs : [],
            releaseOverviewMd,
            confidenceBadges: bundleKey === "change-report" ? confidenceBadges : [],
          });
          let msg = `Wrote ${bundleLabel(bundleKey)} to ${targetRoot}/novadiff-docs/${bundleKey}/ (Markdown, JSON, Mermaid, HTML, PDF).`;
          if (res?.htmlWarning) {
            msg += ` HTML: ${res.htmlWarning}`;
          }
          if (res?.pdfWarning) {
            msg += ` PDF: ${res.pdfWarning}`;
          }
          setDocWriteNote(msg);
          await loadDocPreviewPage(bundleKey, "index.html");
        } catch (e) {
          setDocWriteNote(
            `Documentation streamed, but writing ${bundleKey} failed: ${
              e instanceof Error ? e.message : String(e)
            }`,
          );
        }
      }
    },
    [
      activeBundleKey,
      baselineOutline,
      codebaseOutline,
      compared,
      confidenceBadges,
      docFilterLoading,
      docFilterSettled,
      docRows,
      docRows.length,
      gitignoreMeta,
      leftRoot,
      leftTitle,
      llmSettings,
      loadDocPreviewPage,
      metrics,
      pieDef,
      buildReleaseOverview,
      depthDef,
      riskSignals,
      rightRoot,
      rightTitle,
      savedSelectionDocs,
      unifiedSummaryEntries,
    ],
  );

  const runGenRef = useRef(runGenerate);
  runGenRef.current = runGenerate;

  useEffect(() => {
    if (docGenTrigger === 0) {
      return;
    }
    if (!workspaceDocAuto) {
      return;
    }
    if (docFilterLoading || !docFilterSettled) {
      return;
    }
    if (!compared || docRows.length === 0 || docRows.length > MAX_AUTO_FILES) {
      return;
    }
    void runGenRef.current("change-report");
  }, [
    docGenTrigger,
    workspaceDocAuto,
    compared,
    docRows.length,
    docFilterSettled,
    docFilterLoading,
  ]);

  if (!compared || rows.length === 0) {
    return (
      <main className="doc-workspace doc-workspace--empty">
        <p className="doc-workspace-lead">
          Run a folder comparison first. The documentation workspace builds metrics,
          diagrams, and an AI narrative from the two trees you select.
        </p>
      </main>
    );
  }

  if (docRows.length === 0 && !docFilterLoading) {
    return (
      <main className="doc-workspace doc-workspace--empty">
        <p className="doc-workspace-lead">
          Every path in this compare matches the baseline or target root{" "}
          <code>.gitignore</code> or <code>.git/info/exclude</code>, so there is
          nothing left for structural metrics or AI documentation here.
        </p>
      </main>
    );
  }

  return (
    <main className="doc-workspace">
      <header className="doc-workspace-header">
        <div>
          <h1 className="doc-workspace-title">Documentation workspace</h1>
          <p className="doc-workspace-sub">
            Baseline <strong>{leftTitle}</strong> → Target <strong>{rightTitle}</strong>
            <span className="doc-workspace-meta">
              {" "}
              · Compare: {fileStats.total} path(s); metrics & AI context:{" "}
              {docRows.length} after root <code>.gitignore</code> /{" "}
              <code>.git/info/exclude</code>
              {docFilterLoading ? " (updating…)" : ""}
              {gitignoreMeta
                ? ` · skipped ${gitignoreMeta.skippedGitignore} (.gitignore)`
                : ""}
              {skippedNovadiffDocs != null
                ? ` · skipped ${skippedNovadiffDocs} (novadiff-docs)`
                : ""}
              {outlineLoading
                ? " · scanning target codebase…"
                : codebaseOutline &&
                    typeof codebaseOutline.total_files === "number"
                  ? ` · target scan: ${String(codebaseOutline.total_files)} files`
                  : ""}{" "}
              · auto metrics (Doxygen-style indexing is roadmap; today: path statistics
              + LLM narrative + on-disk bundle).
            </span>
          </p>
        </div>
        {onOpenInsightsDock && !insightsDockOpen ? (
          <button
            type="button"
            className="doc-workspace-copy-btn doc-workspace-insights-reopen"
            onClick={onOpenInsightsDock}
          >
            Show summary panel
          </button>
        ) : null}
      </header>

      <KnowledgeGraphPanel
        compared={compared}
        leftRoot={leftRoot}
        rightRoot={rightRoot}
        leftTitle={leftTitle}
        rightTitle={rightTitle}
        docRows={docRows}
        llmSettings={llmSettings}
        metrics={metrics}
        pieDef={pieDef}
        depthDef={depthDef}
        importDef={importDef}
        callDef={callDef}
        metricsChartsLoading={metricsChartsLoading}
        outlineLoading={outlineLoading}
      />

      <details className="doc-workspace-panel doc-workspace-details-secondary">
        <summary className="doc-workspace-h2 doc-workspace-details-summary">
          Additional workspace panels (risk, summaries, bundles, code city)
        </summary>

      <section ref={citySectionRef} className="doc-workspace-panel doc-workspace-panel--nested">
        <h2 className="doc-workspace-h2">Structural metrics (reference)</h2>
        <p className="doc-workspace-prose">
          Derived from the compare result (relative paths), using the same root-level
          ignore rules and <code>novadiff-docs/</code> reservation as summary prefetch
          when both folder roots are known. Extension and depth views help prioritize
          review—similar in spirit to directory and dependency graphs in tools like{" "}
          <a
            href="https://www.doxygen.nl/manual/features.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Doxygen
          </a>{" "}
          (without parsing source ASTs here).
        </p>
        <div className="doc-workspace-grid doc-workspace-charts">
          <div
            className={`doc-workspace-chart doc-state-enter${metricsChartsLoading ? " is-loading" : ""}`}
          >
            <h3 className="doc-workspace-h3">Change mix</h3>
            <DocMermaidMount
              definition={pieDef}
              loading={metricsChartsLoading}
              loadingLabel="Computing change mix…"
            />
          </div>
          <div
            className={`doc-workspace-chart doc-state-enter${metricsChartsLoading ? " is-loading" : ""}`}
          >
            <h3 className="doc-workspace-h3">Depth distribution</h3>
            <DocMermaidMount
              definition={depthDef}
              loading={metricsChartsLoading}
              loadingLabel="Computing depth distribution…"
            />
          </div>
        </div>
        <div className="doc-workspace-grid doc-workspace-charts" style={{ marginTop: 12 }}>
          <div
            className={`doc-workspace-chart doc-state-enter${outlineLoading ? " is-loading" : ""}`}
          >
            <h3 className="doc-workspace-h3">Module imports (JS/TS)</h3>
            <DocMermaidMount
              definition={importDef}
              loading={outlineLoading}
              loadingLabel="Scanning target imports…"
            />
          </div>
          <div
            className={`doc-workspace-chart doc-state-enter${outlineLoading ? " is-loading" : ""}`}
          >
            <h3 className="doc-workspace-h3">Cross-file calls (heuristic)</h3>
            <DocMermaidMount
              definition={callDef}
              loading={outlineLoading}
              loadingLabel="Building call graph…"
            />
          </div>
        </div>
        <div className="doc-workspace-tables">
          <div>
            <h3 className="doc-workspace-h3">Top extensions</h3>
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Extension</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {metrics.extensionCounts.slice(0, 12).map((r) => (
                  <tr key={r.ext}>
                    <td>
                      <button
                        type="button"
                        className="doc-workspace-table-btn"
                        onClick={() => focusSummaryQuery(r.ext)}
                      >
                        <code>{r.ext}</code>
                      </button>
                    </td>
                    <td>{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="doc-workspace-h3">Top path roots</h3>
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Segment</th>
                  <th>Files</th>
                </tr>
              </thead>
              <tbody>
                {metrics.topRoots.map((r) => (
                  <tr key={r.name}>
                    <td>
                      <button
                        type="button"
                        className="doc-workspace-table-btn"
                        onClick={() => focusSummaryQuery(r.name === "." ? "" : `${r.name}/`)}
                      >
                        <code>{r.name}</code>
                      </button>
                    </td>
                    <td>{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {Array.isArray(codebaseOutline?.detected_projects) &&
        (codebaseOutline.detected_projects as { kind?: string; markers?: unknown[] }[])
          .length > 0 ? (
          <div className="doc-workspace-tables" style={{ marginTop: 14 }}>
            <div>
              <h3 className="doc-workspace-h3">Detected project stacks</h3>
              <p className="doc-workspace-muted">
                From marker files seen in the target scan (heuristic; languages without
                obvious markers may be missing).
              </p>
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Kind</th>
                    <th>Markers</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    codebaseOutline.detected_projects as {
                      kind?: string;
                      markers?: string[];
                    }[]
                  ).map((p, i) => (
                    <tr key={`${p.kind ?? "x"}-${i}`}>
                      <td>
                        <code>{p.kind ?? "—"}</code>
                      </td>
                      <td>
                        {Array.isArray(p.markers) ? p.markers.join(", ") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>

      <section ref={summarySectionRef} className="doc-workspace-panel">
        <h2 className="doc-workspace-h2">Risk & confidence</h2>
        <p className="doc-workspace-prose">
          These signals are deterministic and evidence-backed. They provide the grounding
          layer for the AI narrative, per-file summaries, and release rollup without
          relying on model self-confidence.
        </p>
        <div className="doc-workspace-confidence-grid">
          {confidenceBadges.map((badge) => (
            <div key={badge.key} className={`doc-workspace-confidence-card ${badge.tone}`}>
              <strong>{badge.label}</strong>
              <p>{badge.description ?? "Evidence-backed confidence signal."}</p>
            </div>
          ))}
        </div>
        {riskSignalsLoading ? <p className="doc-workspace-muted">Scanning deterministic risk signals…</p> : null}
        {riskSignalsError ? <p className="doc-workspace-alert">{riskSignalsError}</p> : null}
        {!riskSignalsLoading && !riskSignalsError && riskSignals.length === 0 ? (
          <p className="doc-workspace-muted">
            No deterministic risk signals were detected for the current compare.
          </p>
        ) : null}
        {riskSignals.length > 0 ? (
          <div className="doc-workspace-risk-list">
            {riskSignals.map((signal) => (
              <article
                key={signal.id}
                className={`doc-workspace-risk-card severity-${signal.severity}`}
              >
                <div className="doc-workspace-risk-head">
                  <div>
                    <strong>{signal.title}</strong>
                    <p className="doc-workspace-muted">
                      {signal.category} · {signal.severity} · {signal.confidence} confidence ·{" "}
                      {signal.source}
                    </p>
                  </div>
                  {signal.rel_path ? (
                    <button
                      type="button"
                      className="doc-workspace-copy-btn"
                      onClick={() => onJumpToCompare(signal.rel_path ?? "")}
                    >
                      Open diff
                    </button>
                  ) : null}
                </div>
                {signal.evidence.length > 0 ? (
                  <ul className="doc-workspace-risk-evidence">
                    {signal.evidence.map((item, index) => (
                      <li key={`${signal.id}-${index}`}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="doc-workspace-panel">
        <h2 className="doc-workspace-h2">Suggested git commit</h2>
        <p className="doc-workspace-prose">
          Auto-generated from the current change list (one non-streaming LLM call). Copy
          the subject line, the body, or the full message for{" "}
          <code>git commit</code>.
        </p>
        {commitLoading ? (
          <p className="doc-workspace-muted">Generating commit message…</p>
        ) : null}
        {commitError ? <p className="doc-workspace-alert">{commitError}</p> : null}
        {!commitLoading && !commitError ? (
          <div className="doc-workspace-commit">
            <div className="doc-workspace-commit-field">
              <div className="doc-workspace-commit-head">
                <span className="doc-workspace-commit-label">Subject</span>
                <button
                  type="button"
                  className="doc-workspace-copy-btn"
                  disabled={!commitSubject.trim()}
                  onClick={() =>
                    void copyToClipboard("Subject copied", commitSubject.trim())
                  }
                >
                  Copy
                </button>
              </div>
              <pre className="doc-workspace-commit-pre">
                {commitSubject.trim() || "—"}
              </pre>
            </div>
            <div className="doc-workspace-commit-field">
              <div className="doc-workspace-commit-head">
                <span className="doc-workspace-commit-label">Description</span>
                <button
                  type="button"
                  className="doc-workspace-copy-btn"
                  disabled={!commitBody.trim()}
                  onClick={() =>
                    void copyToClipboard("Description copied", commitBody.trim())
                  }
                >
                  Copy
                </button>
              </div>
              <pre className="doc-workspace-commit-pre doc-workspace-commit-pre--body">
                {commitBody.trim() || "—"}
              </pre>
            </div>
            <div className="doc-workspace-commit-actions">
              <button
                type="button"
                className="doc-workspace-copy-btn"
                disabled={!commitSubject.trim() && !commitBody.trim()}
                onClick={() =>
                  void copyToClipboard(
                    "Full message copied",
                    `${commitSubject.trim()}\n\n${commitBody.trim()}`.trim(),
                  )
                }
              >
                Copy full message
              </button>
              {copiedHint ? (
                <span className="doc-workspace-copied">{copiedHint}</span>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className="doc-workspace-panel">
        <h2 className="doc-workspace-h2">Unified file summaries</h2>
        <p className="doc-workspace-prose">
          Aggregates saved per-file summaries from <code>novadiff-docs/summaries/</code>{" "}
          and any in-memory prefetch results still in this session, so changed files can
          be reviewed in one continuous view.
        </p>
        <div className="doc-workspace-commit-actions">
          <button
            type="button"
            className="doc-workspace-copy-btn"
            disabled={savedSummariesLoading || !window.electronAPI?.readFileSummaryMarkdowns}
            onClick={() => setSummaryReloadToken((n) => n + 1)}
          >
            Refresh summaries
          </button>
          <button
            type="button"
            className="doc-workspace-copy-btn"
            disabled={unifiedSummaryEntries.length === 0}
            onClick={() => void copyUnifiedSummaries()}
          >
            Copy merged Markdown
          </button>
        </div>
        <input
          type="search"
          className="doc-workspace-search"
          placeholder="Search summaries by path, badge, or content"
          value={summarySearch}
          onChange={(e) => setSummarySearch(e.target.value)}
        />
        {savedSummariesLoading ? (
          <p className="doc-workspace-muted">Loading saved file summaries…</p>
        ) : null}
        {savedSummariesError ? (
          <p className="doc-workspace-alert">{savedSummariesError}</p>
        ) : null}
        {!savedSummariesLoading && !savedSummariesError ? (
          <p className="doc-workspace-muted">
            Showing {filteredSummaryEntries.length} of {unifiedSummaryEntries.length} loaded
            summary entries across {docRows.length} changed file
            {docRows.length === 1 ? "" : "s"}
            {missingSummaryCount > 0
              ? ` · ${missingSummaryCount} ${
                  missingSummaryCount === 1 ? "summary" : "summaries"
                } not generated yet`
              : " · all available summaries loaded"}.
          </p>
        ) : null}
        {!savedSummariesLoading &&
        !savedSummariesError &&
        unifiedSummaryEntries.length === 0 ? (
          <p className="doc-workspace-muted">
            No per-file summaries are available yet. This section fills as summary
            prefetch completes or after you generate individual file summaries.
          </p>
        ) : null}
        {filteredSummaryEntries.length > 0 ? (
          <div className="doc-workspace-summary-list">
            {visibleSummaryEntries.map((entry) => (
              <article
                key={entry.relPath}
                id={`summary-${relPathAnchorId(entry.relPath)}`}
                className="doc-workspace-summary-card"
              >
                <div className="doc-workspace-summary-head">
                  <div>
                    <h3 className="doc-workspace-h3">
                      <code>{entry.relPath}</code>
                    </h3>
                    <p className="doc-workspace-muted">Change kind: {entry.kind}</p>
                  </div>
                  <div className="doc-workspace-summary-actions">
                    <button
                      type="button"
                      className="doc-workspace-copy-btn"
                      onClick={() => onJumpToCompare(entry.relPath)}
                    >
                      Open diff
                    </button>
                  </div>
                </div>
                {entry.badges && entry.badges.length > 0 ? (
                  <div className="doc-workspace-confidence-badges">
                    {entry.badges.map((badge) => (
                      <span
                        key={`${entry.relPath}-${badge.key}`}
                        className={`doc-workspace-inline-badge ${badge.tone}`}
                      >
                        {badge.label}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="doc-workspace-summary-view llm-summary-md-wrap">
                  <LlmSummaryMarkdown source={entry.markdown} />
                </div>
              </article>
            ))}
          </div>
        ) : null}
        {visibleSummaryEntries.length < filteredSummaryEntries.length ? (
          <div className="doc-workspace-commit-actions">
            <p className="doc-workspace-muted">
              Rendering {visibleSummaryEntries.length} of {filteredSummaryEntries.length} matching
              summaries.
            </p>
            <button
              type="button"
              className="doc-workspace-copy-btn"
              onClick={() =>
                setSummaryRenderCount((count) =>
                  Math.min(count + 24, filteredSummaryEntries.length),
                )
              }
            >
              Show more
            </button>
          </div>
        ) : null}
      </section>

      <section className="doc-workspace-panel">
        <h2 className="doc-workspace-h2">Selected diff documentation</h2>
        <p className="doc-workspace-prose">
          Persists selected-line and symbol-expanded documentation under{" "}
          <code>novadiff-docs/selections/</code>, so focused reviews can be revisited
          independently from full-file summaries.
        </p>
        <div className="doc-workspace-commit-actions">
          <button
            type="button"
            className="doc-workspace-copy-btn"
            disabled={
              savedSelectionDocsLoading || !window.electronAPI?.readSelectionSummaryMarkdowns
            }
            onClick={() => setSummaryReloadToken((n) => n + 1)}
          >
            Refresh selection docs
          </button>
          <button
            type="button"
            className="doc-workspace-copy-btn"
            disabled={savedSelectionDocs.length === 0}
            onClick={() => void copySelectionDocs()}
          >
            Copy merged Markdown
          </button>
        </div>
        <input
          type="search"
          className="doc-workspace-search"
          placeholder="Search saved selection docs"
          value={selectionSearch}
          onChange={(e) => setSelectionSearch(e.target.value)}
        />
        {savedSelectionDocsLoading ? (
          <p className="doc-workspace-muted">Loading saved selection docs…</p>
        ) : null}
        {savedSelectionDocsError ? (
          <p className="doc-workspace-alert">{savedSelectionDocsError}</p>
        ) : null}
        {!savedSelectionDocsLoading && !savedSelectionDocsError ? (
          <p className="doc-workspace-muted">
            {savedSelectionDocs.length === 0
              ? "No saved selected-diff documentation yet."
              : `Loaded ${savedSelectionDocs.length} saved selection document${
                  savedSelectionDocs.length === 1 ? "" : "s"
                } across the changed files.`}
          </p>
        ) : null}
        {filteredSelectionDocs.length > 0 ? (
          <div className="doc-workspace-summary-list">
            {visibleSelectionDocs.map((entry) => (
              <article
                key={`${entry.relPath}-${entry.selectionKey}`}
                className="doc-workspace-summary-card"
              >
                <div className="doc-workspace-summary-head">
                  <div>
                    <h3 className="doc-workspace-h3">
                      <code>{entry.relPath}</code> — {entry.label}
                    </h3>
                    <p className="doc-workspace-muted">
                      requested {entry.requestedMode} · effective {entry.effectiveMode}
                      {entry.symbol ? ` · ${entry.symbol.kind} ${entry.symbol.name}` : ""}
                    </p>
                  </div>
                  <div className="doc-workspace-summary-actions">
                    <button
                      type="button"
                      className="doc-workspace-copy-btn"
                      onClick={() => onJumpToCompare(entry.relPath)}
                    >
                      Open diff
                    </button>
                  </div>
                </div>
                <div className="doc-workspace-summary-view llm-summary-md-wrap">
                  <LlmSummaryMarkdown source={entry.markdown} />
                </div>
              </article>
            ))}
          </div>
        ) : null}
        {visibleSelectionDocs.length < filteredSelectionDocs.length ? (
          <div className="doc-workspace-commit-actions">
            <p className="doc-workspace-muted">
              Rendering {visibleSelectionDocs.length} of {filteredSelectionDocs.length} matching
              selection docs.
            </p>
            <button
              type="button"
              className="doc-workspace-copy-btn"
              onClick={() =>
                setSelectionRenderCount((count) =>
                  Math.min(count + 24, filteredSelectionDocs.length),
                )
              }
            >
              Show more
            </button>
          </div>
        ) : null}
      </section>

      <section className="doc-workspace-panel">
        <h2 className="doc-workspace-h2">Documentation bundles & preview</h2>
        <p className="doc-workspace-prose">
          NovaDiff now maintains three distinct report families under{" "}
          <code>novadiff-docs/</code>: a diff-centric <code>change-report</code>, a
          full <code>codebase-baseline</code> report for the baseline tree, and a full{" "}
          <code>codebase-target</code> report for the target tree. Each bundle writes
          Markdown, JSON, Mermaid, HTML, and PDF artifacts without clobbering the others.
        </p>
        <div className="doc-workspace-bundle-grid">
          {(
            ["change-report", "codebase-baseline", "codebase-target"] as NovadiffDocsBundleKey[]
          ).map((bundleKey) => {
            const needsOutline = bundleKey !== "change-report";
            const ready =
              bundleKey === "change-report"
                ? docRows.length > 0 && !docFilterLoading && docFilterSettled
                : Boolean(
                    bundleKey === "codebase-baseline" ? baselineOutline : codebaseOutline,
                  );
            return (
              <div
                key={bundleKey}
                className={
                  bundleKey === activeBundleKey
                    ? "doc-workspace-bundle-card doc-workspace-chart--active"
                    : "doc-workspace-bundle-card"
                }
              >
                <div className="doc-workspace-bundle-head">
                  <h3 className="doc-workspace-h3">{bundleLabel(bundleKey)}</h3>
                  <span className="doc-workspace-bundle-badge">
                    {bundleKey === "change-report" ? "Diff" : "Codebase"}
                  </span>
                </div>
                <div className="doc-workspace-bundle-body">
                  <p className="doc-workspace-muted">{bundleShortDescription(bundleKey)}</p>
                  <p className="doc-workspace-muted">
                    {needsOutline
                      ? bundleKey === "codebase-baseline"
                        ? baselineOutlineLoading
                          ? "Scanning baseline tree…"
                          : ready
                            ? "Baseline scan ready."
                            : "Baseline scan not ready yet."
                        : outlineLoading
                          ? "Scanning target tree…"
                          : ready
                            ? "Target scan ready."
                            : "Target scan not ready yet."
                      : !docFilterSettled
                        ? "Preparing compare scope…"
                        : docFilterLoading
                          ? "Refreshing compare metrics…"
                          : `${docRows.length} compare paths in scope.`}
                  </p>
                </div>
                <div className="doc-workspace-bundle-actions">
                  <button
                    type="button"
                    className="doc-workspace-copy-btn"
                    disabled={
                      docLoading ||
                      !ready ||
                      !window.electronAPI?.llmSummarizeStream ||
                      (bundleKey === "change-report" && docRows.length === 0)
                    }
                    onClick={() => void runGenerate(bundleKey)}
                  >
                    {docLoading && bundleKey === activeBundleKey
                      ? "Generating…"
                      : "Generate / refresh"}
                  </button>
                  <button
                    type="button"
                    className="doc-workspace-copy-btn"
                    disabled={!window.electronAPI?.readNovadiffDocsFile}
                    onClick={() => void loadDocPreviewPage(bundleKey, "index.html")}
                  >
                    Preview
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <label className="doc-workspace-check">
          <input
            type="checkbox"
            checked={workspaceDocAuto}
            onChange={(e) => onWorkspaceDocAutoChange(e.target.checked)}
          />
          After each compare (≤{MAX_AUTO_FILES} files), auto-generate the{" "}
          <strong>change report</strong>
        </label>
        <div className="doc-workspace-commit-actions">
          <button
            type="button"
            className="doc-workspace-copy-btn"
            disabled={
              unifiedSummaryEntries.length === 0 &&
              savedSelectionDocs.length === 0 &&
              riskSignals.length === 0
            }
            onClick={() =>
              void copyToClipboard("Release overview copied", buildReleaseOverview())
            }
          >
            Copy release / PR rollup
          </button>
        </div>
        {docError ? <p className="doc-workspace-alert">{docError}</p> : null}
        {docPreviewError && !docError ? (
          <p className="doc-workspace-alert">{docPreviewError}</p>
        ) : null}
        {docWriteNote && !docError ? (
          <p className="doc-workspace-muted">{docWriteNote}</p>
        ) : null}
        {docPreviewHtml && !docError ? (
          <div className="doc-workspace-html-preview">
            <div className="doc-workspace-html-preview-bar">
              <div className="doc-workspace-html-preview-meta">
                <span className="doc-workspace-html-preview-kicker">
                  NovaDiff documentation
                </span>
                <span className="doc-workspace-html-preview-hint">
                  Previewing <strong>{bundleLabel(activeBundleKey)}</strong>. Mermaid loads
                  from the CDN when online.
                </span>
              </div>
              <div className="doc-workspace-preview-controls">
                <div className="doc-workspace-preview-tabs">
                {DOC_PREVIEW_PAGES.map((page) => {
                  const label =
                    page === "index.html"
                      ? "Overview"
                      : page === "narrative.html"
                        ? "Narrative"
                        : page === "metrics.html"
                          ? "Metrics"
                          : page === "diagrams.html"
                            ? "Diagrams"
                            : "Release";
                  return (
                    <button
                      key={page}
                      type="button"
                      className={
                        page === docPreviewPage
                          ? "doc-workspace-preview-tab active"
                          : "doc-workspace-preview-tab"
                      }
                      onClick={() => {
                        void loadDocPreviewPage(activeBundleKey, page);
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
                </div>
                <button
                  type="button"
                  className="doc-workspace-copy-btn"
                  disabled={!window.electronAPI?.openNovadiffDocsInBrowser}
                  onClick={() => {
                    const root = rightRoot.trim();
                    if (!root) {
                      return;
                    }
                    void window.electronAPI?.openNovadiffDocsInBrowser?.({
                      targetRoot: root,
                      bundleKey: activeBundleKey,
                    });
                  }}
                >
                  Open in default browser
                </button>
              </div>
            </div>
            <iframe
              ref={previewFrameRef}
              title="NovaDiff novadiff-docs HTML preview"
              className="doc-workspace-html-iframe"
              sandbox="allow-scripts allow-same-origin"
              srcDoc={docPreviewHtml}
              onLoad={handlePreviewFrameLoad}
            />
          </div>
        ) : null}
        {docMarkdown != null && docMarkdown !== "" ? (
          <div className="doc-workspace-md">
            <div className="doc-workspace-md-head">
              <div>
                <span className="doc-workspace-html-preview-kicker">Live AI output</span>
                <p className="doc-workspace-muted">
                  Streaming Markdown for <strong>{bundleLabel(activeBundleKey)}</strong>.
                </p>
              </div>
            </div>
            <div className="doc-workspace-md-body llm-summary-md-wrap">
              <LlmSummaryMarkdown source={docMarkdown} />
              {docLoading ? (
                <span className="llm-stream-caret" aria-hidden>
                  ▍
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
        {docMarkdown === "" && docLoading ? (
          <p className="doc-workspace-muted">
            Streaming {bundleLabel(activeBundleKey).toLowerCase()}…
          </p>
        ) : null}
      </section>

      <section className="doc-workspace-panel doc-workspace-panel--nested">
        <h2 className="doc-workspace-h2">3D code city</h2>
        <p className="doc-workspace-prose">
          The city lays out districts by top-level subsystem, files as blocks, and
          symbol spans as buildings. Compare-state drives emissive window colors, while
          the optional blame overlay tints buildings by dominant author for the bounded
          set of files the backend sampled.
        </p>
        <div className="code-city-toolbar">
          <div className="code-city-toolbar-row">
            <div className="code-city-toolbar-group">
              <span className="code-city-toolbar-label">View</span>
              <div className="code-city-segmented">
                <button
                  type="button"
                  className={
                    cityRootSide === "baseline"
                      ? "code-city-control-btn active"
                      : "code-city-control-btn"
                  }
                  onClick={() => setCityRootSide("baseline")}
                >
                  Baseline city
                </button>
                <button
                  type="button"
                  className={
                    cityRootSide === "target"
                      ? "code-city-control-btn active"
                      : "code-city-control-btn"
                  }
                  onClick={() => setCityRootSide("target")}
                >
                  Target city
                </button>
              </div>
            </div>
            <div className="code-city-toolbar-group">
              <span className="code-city-toolbar-label">Overlays</span>
              <div className="code-city-toggle-row">
                <button
                  type="button"
                  className={
                    cityCompareOverlay
                      ? "code-city-control-btn active"
                      : "code-city-control-btn"
                  }
                  onClick={() => setCityCompareOverlay((value) => !value)}
                >
                  Compare overlay
                </button>
                <button
                  type="button"
                  className={
                    cityBlameOverlay
                      ? "code-city-control-btn active"
                      : "code-city-control-btn"
                  }
                  onClick={() => setCityBlameOverlay((value) => !value)}
                >
                  Git blame overlay
                </button>
                <button
                  type="button"
                  className={
                    cityChangedOnly
                      ? "code-city-control-btn active"
                      : "code-city-control-btn"
                  }
                  onClick={() => setCityChangedOnly((value) => !value)}
                >
                  Changed only
                </button>
              </div>
            </div>
            <button
              type="button"
              className="doc-workspace-copy-btn"
              onClick={resetCityFilters}
            >
              Reset filters
            </button>
          </div>
          <div className="code-city-toolbar-row">
            <select
              className="doc-workspace-select"
              value={citySubsystem}
              onChange={(e) => setCitySubsystem(e.target.value)}
            >
              <option value="all">All subsystems</option>
              {cityLayout.subsystems.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <select
              className="doc-workspace-select"
              value={cityExtension}
              onChange={(e) => setCityExtension(e.target.value)}
            >
              <option value="all">All extensions</option>
              {cityLayout.extensions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <select
              className="doc-workspace-select"
              value={citySymbolKind}
              onChange={(e) => setCitySymbolKind(e.target.value)}
            >
              <option value="all">All symbol kinds</option>
              {cityLayout.symbolKinds.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <select
              className="doc-workspace-select"
              value={cityAuthor}
              onChange={(e) => setCityAuthor(e.target.value)}
            >
              <option value="all">All authors</option>
              {(cityModel?.authors ?? []).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <input
              type="search"
              className="doc-workspace-search"
              placeholder="Search file or symbol"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
            />
          </div>
        </div>
        <div className="code-city-stat-grid">
          <div className="code-city-stat-card">
            <span className="code-city-stat-label">Visible buildings</span>
            <strong>{cityLayout.buildings.length}</strong>
          </div>
          <div className="code-city-stat-card">
            <span className="code-city-stat-label">Districts</span>
            <strong>{cityLayout.districts.length}</strong>
          </div>
          <div className="code-city-stat-card">
            <span className="code-city-stat-label">Changed</span>
            <strong>{cityStats.changed}</strong>
          </div>
          <div className="code-city-stat-card">
            <span className="code-city-stat-label">Authors sampled</span>
            <strong>{cityModel?.authors.length ?? 0}</strong>
          </div>
        </div>
        {!cityVisible ? (
          <p className="doc-workspace-muted">
            City model loading is deferred until this section scrolls near view to keep the
            workspace responsive.
          </p>
        ) : null}
        {cityLoading ? <p className="doc-workspace-muted">Building city model…</p> : null}
        {cityError ? <p className="doc-workspace-alert">{cityError}</p> : null}
        {!cityError && cityModel ? (
          <div className="code-city-layout">
            <CodeCityView
              layout={cityLayout}
              rootSide={cityRootSide}
              compareOverlay={cityCompareOverlay}
              blameOverlay={cityBlameOverlay}
              selectedBuildingId={selectedCityBuilding?.id ?? null}
              onSelect={setSelectedCityBuilding}
            />
            <CodeCityLegend
              selected={selectedCityBuilding}
              blameOverlay={cityBlameOverlay}
              rootSide={cityRootSide}
              visibleBuildingCount={cityLayout.buildings.length}
              districtCount={cityLayout.districts.length}
              changedBuildingCount={cityStats.changed}
              onOpenDiff={(path) => onJumpToCompare(path)}
            />
          </div>
        ) : null}
        {!cityError && !cityLoading && !cityModel ? (
          <div className="code-city-empty">
            Build the city model to explore the repository structure in 3D.
          </div>
        ) : null}
      </section>
      </details>
    </main>
  );
}
