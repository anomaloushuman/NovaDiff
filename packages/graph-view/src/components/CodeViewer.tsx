import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Highlight, themes } from "prism-react-renderer";
import { useDashboardStore } from "../store";
import { useI18n } from "../contexts/I18nContext";
import { useNovaDiffEmbed } from "../contexts/NovaDiffEmbedContext";
import { ExplainCodeModal } from "./ExplainCodeModal";

interface CodeViewerProps {
  accessToken: string;
  presentation?: "sidebar" | "modal";
  onClose?: () => void;
  onExpand?: () => void;
}

interface SourceFile {
  path: string;
  language: string;
  content: string;
  sizeBytes: number;
  lineCount: number;
}

type SourceState =
  | { status: "idle" | "loading"; source: null; error: null }
  | { status: "loaded"; source: SourceFile; error: null }
  | { status: "error"; source: null; error: string };

function fileContentUrl(filePath: string, token: string): string {
  const params = new URLSearchParams({ token, path: filePath });
  return `/file-content.json?${params.toString()}`;
}

function fallbackLanguage(filePath: string | undefined): string {
  const ext = filePath?.split(".").pop()?.toLowerCase();
  const byExt: Record<string, string> = {
    css: "css",
    go: "go",
    html: "markup",
    js: "javascript",
    jsx: "jsx",
    json: "json",
    md: "markdown",
    py: "python",
    rb: "ruby",
    rs: "rust",
    sh: "bash",
    ts: "typescript",
    tsx: "tsx",
    yaml: "yaml",
    yml: "yaml",
  };
  return ext ? byExt[ext] ?? "text" : "text";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CodeViewer({
  accessToken,
  presentation = "sidebar",
  onClose,
  onExpand,
}: CodeViewerProps) {
  const graph = useDashboardStore((s) => s.graph);
  const domainGraph = useDashboardStore((s) => s.domainGraph);
  const viewMode = useDashboardStore((s) => s.viewMode);
  const codeViewerNodeId = useDashboardStore((s) => s.codeViewerNodeId);
  const closeCodeViewer = useDashboardStore((s) => s.closeCodeViewer);
  const activeGraph = viewMode === "domain" && domainGraph ? domainGraph : graph;
  // Files tab always builds its tree from the structural graph, so a node ID opened from
  // there may not exist in the active (domain) graph — fall back to the structural graph.
  const node =
    activeGraph?.nodes.find((n) => n.id === codeViewerNodeId) ??
    graph?.nodes.find((n) => n.id === codeViewerNodeId) ??
    null;
  const [state, setState] = useState<SourceState>({
    status: "idle",
    source: null,
    error: null,
  });
  const { t } = useI18n();
  const embed = useNovaDiffEmbed();
  const [selectAnchor, setSelectAnchor] = useState<number | null>(null);
  const [selectEnd, setSelectEnd] = useState<number | null>(null);
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainText, setExplainText] = useState("");
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [explainSavedHint, setExplainSavedHint] = useState<string | null>(null);

  const userSelection = useMemo(() => {
    if (selectAnchor == null || selectEnd == null) {
      return null;
    }
    return {
      start: Math.min(selectAnchor, selectEnd),
      end: Math.max(selectAnchor, selectEnd),
    };
  }, [selectAnchor, selectEnd]);

  useEffect(() => {
    setSelectAnchor(null);
    setSelectEnd(null);
    setExplainOpen(false);
    setExplainText("");
    setExplainLoading(false);
    setExplainError(null);
    setExplainSavedHint(null);
  }, [node?.id, node?.filePath]);

  useEffect(() => {
    if (!node?.filePath) {
      setState({ status: "error", source: null, error: "This node does not have a file path." });
      return;
    }

    if (accessToken === "__demo__") {
      setState({
        status: "error",
        source: null,
        error: "Source preview is available only when the local dashboard server is running.",
      });
      return;
    }

    const controller = new AbortController();
    setState({ status: "loading", source: null, error: null });

    if (accessToken === "__novadiff__" && embed.readFile) {
      void embed
        .readFile(node.filePath)
        .then((source) => {
          if (controller.signal.aborted) {
            return;
          }
          setState({ status: "loaded", source, error: null });
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) {
            return;
          }
          setState({
            status: "error",
            source: null,
            error: err instanceof Error ? err.message : String(err),
          });
        });
      return () => controller.abort();
    }

    fetch(fileContentUrl(node.filePath, accessToken), { signal: controller.signal })
      .then(async (res) => {
        const data = (await res.json()) as SourceFile | { error?: string };
        if (!res.ok) {
          throw new Error("error" in data && data.error ? data.error : "Source unavailable");
        }
        setState({ status: "loaded", source: data as SourceFile, error: null });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          source: null,
          error: err instanceof Error ? err.message : String(err),
        });
      });

    return () => controller.abort();
  }, [accessToken, embed.readFile, node?.filePath]);

  const highlightedRange = useMemo(() => {
    if (userSelection) {
      return userSelection;
    }
    if (!node?.lineRange) {
      return null;
    }
    return { start: node.lineRange[0], end: node.lineRange[1] };
  }, [node?.lineRange, userSelection]);

  const handleLineClick = useCallback((lineNumber: number, shiftKey: boolean) => {
    if (shiftKey && selectAnchor != null) {
      setSelectEnd(lineNumber);
      return;
    }
    setSelectAnchor(lineNumber);
    setSelectEnd(lineNumber);
  }, [selectAnchor]);

  if (!node) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-surface">
        <p className="text-text-muted text-sm">{t.codeViewer.noFile}</p>
      </div>
    );
  }

  const source = state.source;
  const language = source?.language ?? fallbackLanguage(node.filePath);
  const lineInfo = highlightedRange
    ? `${t.codeViewer.lines} ${highlightedRange.start}-${highlightedRange.end}`
    : t.codeViewer.fullFile;
  const isModal = presentation === "modal";
  const handleClose = onClose ?? closeCodeViewer;

  const runExplainCode = useCallback(async () => {
    if (!embed.explainCode || !node?.filePath || !userSelection || state.status !== "loaded") {
      return;
    }
    const fileSource = state.source;
    const lines = fileSource.content.split(/\r?\n/);
    const snippet = lines.slice(userSelection.start - 1, userSelection.end).join("\n");
    if (!snippet.trim()) {
      return;
    }
    setExplainOpen(true);
    setExplainLoading(true);
    setExplainError(null);
    setExplainText("");
    setExplainSavedHint(null);
    try {
      const finalText = await embed.explainCode(
        {
          filePath: node.filePath,
          startLine: userSelection.start,
          endLine: userSelection.end,
          snippet,
          symbolName: node.name,
        },
        (chunk) => setExplainText(chunk),
      );
      setExplainText(finalText);
      setExplainSavedHint(
        `Saved to novadiff-docs/selections/${node.filePath}/lines-${userSelection.start}-${userSelection.end}/`,
      );
    } catch (e) {
      setExplainError(e instanceof Error ? e.message : String(e));
    } finally {
      setExplainLoading(false);
    }
  }, [embed.explainCode, node?.filePath, node?.name, state, userSelection]);

  return (
    <div className="h-full w-full flex flex-col bg-surface overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3 bg-elevated border-b border-border-subtle shrink-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border"
              style={{
                color: "var(--color-node-file)",
                borderColor: "color-mix(in srgb, var(--color-node-file) 30%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--color-node-file) 10%, transparent)",
              }}
            >
              {language}
            </span>
            <span className="text-[10px] text-text-muted">{lineInfo}</span>
          </div>
          <div className="text-sm font-heading text-text-primary truncate" title={node.name}>
            {node.name}
          </div>
          {node.filePath && (
            <div className="text-[11px] font-mono text-text-muted truncate mt-0.5" title={node.filePath}>
              {node.filePath}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {embed.explainCode && userSelection && state.status === "loaded" ? (
            <button
              type="button"
              onClick={() => void runExplainCode()}
              disabled={explainLoading}
              className={`novadiff-explain-code-btn${explainLoading ? " is-thinking" : ""}`}
            >
              {explainLoading ? "Thinking" : "Explain code"}
            </button>
          ) : null}
          {onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="text-text-muted hover:text-text-primary transition-colors"
              title={t.codeViewer.openLarger}
              aria-label={t.codeViewer.openLarger}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9V4h5M20 15v5h-5M4 4l6 6M20 20l-6-6" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="text-text-muted hover:text-text-primary transition-colors"
            title={isModal ? t.codeViewer.closeExpanded : t.codeViewer.closeViewer}
            aria-label={isModal ? t.codeViewer.closeExpanded : t.codeViewer.closeViewer}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto bg-root">
        {state.status === "loading" && (
          <div className="p-5 text-sm text-text-muted">{t.codeViewer.loading}</div>
        )}

        {state.status === "error" && (
          <div className="p-5">
            <div className="rounded-lg border border-border-subtle bg-elevated p-4">
              <div className="text-sm font-medium text-text-primary mb-2">{t.codeViewer.sourceUnavailable}</div>
              <p className="text-sm text-text-secondary leading-relaxed">{state.error}</p>
            </div>
          </div>
        )}

        {source && (
          <>
            <div className="px-4 py-2 border-b border-border-subtle bg-surface text-[11px] text-text-muted flex items-center justify-between">
              <span>
                {source.lineCount} {t.codeViewer.linesLabel}
                {userSelection
                  ? ` · selected ${userSelection.start}–${userSelection.end}`
                  : embed.explainCode
                    ? " · click line numbers; Shift+click to extend"
                    : ""}
              </span>
              <span>{formatBytes(source.sizeBytes)}</span>
            </div>
            <Highlight code={source.content} language={language} theme={themes.vsDark}>
              {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <pre
                  className={`${className} min-w-max p-0 m-0 ${
                    isModal ? "text-xs leading-5" : "text-[11px] leading-5"
                  } font-mono`}
                  style={{ ...style, background: "transparent" }}
                >
                  {tokens.map((line, index) => {
                    const lineNumber = index + 1;
                    const isNodeHighlight =
                      !userSelection &&
                      highlightedRange !== null &&
                      lineNumber >= highlightedRange.start &&
                      lineNumber <= highlightedRange.end;
                    const isUserSelected =
                      userSelection !== null &&
                      lineNumber >= userSelection.start &&
                      lineNumber <= userSelection.end;
                    const lineProps = getLineProps({ line });
                    return (
                      <div
                        key={lineNumber}
                        {...lineProps}
                        className={`${lineProps.className} flex ${
                          isUserSelected
                            ? "bg-accent/25"
                            : isNodeHighlight
                              ? "bg-accent/15"
                              : "hover:bg-elevated/40"
                        }`}
                      >
                        <button
                          type="button"
                          className="w-12 shrink-0 select-none border-r border-border-subtle pr-3 text-right text-text-muted bg-surface/60 hover:text-accent cursor-pointer"
                          onClick={(e) => handleLineClick(lineNumber, e.shiftKey)}
                        >
                          {lineNumber}
                        </button>
                        <span className="pl-3 pr-6 whitespace-pre">
                          {line.map((token, key) => (
                            <span key={key} {...getTokenProps({ token })} />
                          ))}
                        </span>
                      </div>
                    );
                  })}
                </pre>
              )}
            </Highlight>
          </>
        )}
      </div>
      {explainOpen &&
        createPortal(
          <ExplainCodeModal
            open={explainOpen}
            title="Explain code"
            subtitle={
              node.filePath && userSelection
                ? `${node.filePath} · lines ${userSelection.start}–${userSelection.end}`
                : undefined
            }
            text={explainText}
            loading={explainLoading}
            error={explainError}
            savedHint={explainSavedHint}
            onClose={() => {
              if (!explainLoading) {
                setExplainOpen(false);
              }
            }}
          />,
          document.body,
        )}
    </div>
  );
}
