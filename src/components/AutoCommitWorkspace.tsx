import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, GitBranch, Loader2, Upload } from "lucide-react";
import type { LlmSettings } from "../app/llmStorage";
import {
  buildCommitMessageContext,
  parseCommitMessageOutput,
} from "../app/commitMessage";
import { buildDocWorkspaceMetrics } from "../app/docWorkspaceMetrics";
import type { FileChange } from "../app/types";
import type { GitRepoStatus, PublishPreview } from "../app/gitTypes";

export interface AutoCommitWorkspaceProps {
  suggestedRepoPath: string;
  compared: boolean;
  compareRows: FileChange[];
  leftRoot: string;
  rightRoot: string;
  leftTitle: string;
  rightTitle: string;
  llmSettings: LlmSettings;
}

type ReviewStep = "draft" | "review" | "done";

export function AutoCommitWorkspace({
  suggestedRepoPath,
  compared,
  compareRows,
  leftRoot,
  rightRoot,
  leftTitle,
  rightTitle,
  llmSettings,
}: AutoCommitWorkspaceProps) {
  const api = window.electronAPI;
  const [repoRoot, setRepoRoot] = useState(suggestedRepoPath.trim());
  const [status, setStatus] = useState<GitRepoStatus | null>(null);
  const [preview, setPreview] = useState<PublishPreview | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [prBody, setPrBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<ReviewStep>("draft");
  const [pushAfterCommit, setPushAfterCommit] = useState(true);
  const [openPr, setOpenPr] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [docsNote, setDocsNote] = useState<string | null>(null);

  const metrics = useMemo(
    () => (compareRows.length > 0 ? buildDocWorkspaceMetrics(compareRows) : null),
    [compareRows],
  );

  const refreshRepo = useCallback(async () => {
    const root = repoRoot.trim();
    if (!root || !api?.gitRepoStatus) {
      setStatus(null);
      setPreview(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const st = await api.gitRepoStatus({ repoRoot: root });
      setStatus(st);
      if (api.gitPublishPreview) {
        setPreview(await api.gitPublishPreview({ repoRoot: root }));
      }
    } catch (e) {
      setStatus(null);
      setPreview(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [api, repoRoot]);

  useEffect(() => {
    void refreshRepo();
  }, [refreshRepo]);

  const generateDraft = useCallback(async () => {
    if (!api?.llmSummarize) {
      setError("LLM unavailable in this environment.");
      return;
    }
    setGenerating(true);
    setError(null);
    setDocsNote(null);
    try {
      const filesForPrompt =
        status?.files?.map((f) => ({ path: f.path, kind: "modified" as const })) ??
        compareRows;
      const m =
        metrics ??
        buildDocWorkspaceMetrics(
          filesForPrompt.length > 0
            ? filesForPrompt
            : [{ path: ".", kind: "modified" }],
        );
      const ctx = buildCommitMessageContext(
        m,
        filesForPrompt,
        leftTitle || "baseline",
        rightTitle || pathBasename(repoRoot),
        leftRoot || repoRoot,
        rightRoot || repoRoot,
      );
      const raw = await api.llmSummarize({
        ...llmSettings,
        commitMessage: true,
        commitContext: ctx,
        relPath: "(auto-commit)",
        kind: "modified",
        leftLabel: leftTitle || "baseline",
        rightLabel: rightTitle || pathBasename(repoRoot),
      });
      const parsed = parseCommitMessageOutput(raw);
      setSubject(parsed.subject);
      setBody(parsed.body);
      setPrBody(
        `## Summary\n\n${parsed.body}\n\n## Documentation\n\nGenerated with NovaDiff auto-publish after human review.`,
      );

      if (compared && compareRows.length > 0 && api.writeNovadiffDocs && repoRoot.trim()) {
        const write = await api.writeNovadiffDocs({
          targetRoot: repoRoot.trim(),
          bundleKey: "change-report",
          leftRoot,
          rightRoot,
          leftTitle,
          rightTitle,
          compareMetricsMd: `Auto-publish draft for ${compareRows.length} compared paths.`,
        });
        setDocsNote(`Documentation bundle written to ${write.dir}`);
      }

      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }, [
    api,
    compareRows,
    compared,
    leftRoot,
    leftTitle,
    llmSettings,
    metrics,
    repoRoot,
    rightRoot,
    rightTitle,
    status?.files,
  ]);

  const executePublish = useCallback(async () => {
    if (!api?.gitPublishExecute || !subject.trim()) {
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      const out = await api.gitPublishExecute({
        repoRoot: repoRoot.trim(),
        subject: subject.trim(),
        body: body.trim(),
        push: pushAfterCommit,
        createPullRequest: openPr,
        prBody: prBody.trim(),
        draftPr: false,
      });
      setResultUrl(out.prUrl);
      setStep("done");
      await refreshRepo();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPublishing(false);
    }
  }, [
    api,
    body,
    openPr,
    prBody,
    pushAfterCommit,
    refreshRepo,
    repoRoot,
    subject,
  ]);

  const browseRepo = async () => {
    const p = await api?.pickDirectory?.();
    if (p) {
      setRepoRoot(p);
    }
  };

  return (
    <main className="git-workspace">
      <header className="git-workspace-header">
        <div>
          <h1 className="git-workspace-title">
            <Upload size={22} strokeWidth={1.75} aria-hidden />
            Auto-commit &amp; publish
          </h1>
          <p className="git-workspace-lead">
            Stage changes (respecting <code>.gitignore</code>), commit with an
            AI-generated message, optionally push and open a pull request — only after
            you review and approve.
          </p>
        </div>
      </header>

      <section className="doc-workspace-panel">
        <h2 className="doc-workspace-h2">Repository</h2>
        <div className="git-repo-picker-row">
          <input
            className="path-selector-input git-repo-input"
            value={repoRoot}
            onChange={(e) => setRepoRoot(e.target.value)}
            placeholder="/path/to/your/git/repo"
            spellCheck={false}
          />
          <button type="button" className="doc-workspace-copy-btn" onClick={() => void browseRepo()}>
            Browse
          </button>
          <button
            type="button"
            className="doc-workspace-copy-btn"
            disabled={loading}
            onClick={() => void refreshRepo()}
          >
            Refresh status
          </button>
        </div>

        {loading ? <p className="doc-workspace-muted">Reading git status…</p> : null}

        {status ? (
          <div className="git-status-cards">
            <div className="git-status-card">
              <GitBranch size={16} aria-hidden />
              <span>
                <strong>{status.branch}</strong>
                {status.upstream ? ` · ${status.upstream}` : " · no upstream"}
              </span>
            </div>
            <div className="git-status-card">
              <span>
                {status.files.length} changed file(s)
                {status.ahead > 0 ? ` · ${status.ahead} ahead` : ""}
                {status.behind > 0 ? ` · ${status.behind} behind` : ""}
              </span>
            </div>
          </div>
        ) : null}

        {preview?.githubSlug ? (
          <p className="doc-workspace-muted">
            GitHub remote: {preview.githubSlug.owner}/{preview.githubSlug.repo}
          </p>
        ) : null}
      </section>

      {step === "draft" ? (
        <section className="doc-workspace-panel ui-view-enter">
          <h2 className="doc-workspace-h2">1. Generate draft</h2>
          <p className="doc-workspace-prose">
            Builds a commit message from git status (and compare data when available). A
            documentation bundle is written under <code>novadiff-docs/</code> when a
            folder compare is active for this repo.
          </p>
          <button
            type="button"
            className="doc-workspace-btn"
            disabled={generating || !repoRoot.trim() || !status?.dirty}
            onClick={() => void generateDraft()}
          >
            {generating ? (
              <Loader2 size={16} className="spin-ic" aria-hidden />
            ) : null}
            Generate commit &amp; docs draft
          </button>
          {!status?.dirty && status ? (
            <p className="doc-workspace-muted">Working tree is clean — nothing to commit.</p>
          ) : null}
        </section>
      ) : null}

      {step === "review" || step === "done" ? (
        <section className="doc-workspace-panel ui-view-enter">
          <h2 className="doc-workspace-h2">2. Human review</h2>
          {docsNote ? <p className="doc-workspace-muted">{docsNote}</p> : null}
          <label className="git-field">
            <span>Commit subject</span>
            <input
              className="llm-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={step === "done"}
            />
          </label>
          <label className="git-field">
            <span>Commit body</span>
            <textarea
              className="llm-input git-textarea"
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={step === "done"}
            />
          </label>
          <label className="git-field">
            <span>Pull request description (optional)</span>
            <textarea
              className="llm-input git-textarea"
              rows={6}
              value={prBody}
              onChange={(e) => setPrBody(e.target.value)}
              disabled={step === "done"}
            />
          </label>
          <div className="git-publish-options">
            <label className="doc-workspace-check">
              <input
                type="checkbox"
                checked={pushAfterCommit}
                disabled={step === "done"}
                onChange={(e) => setPushAfterCommit(e.target.checked)}
              />
              Push to remote after commit
            </label>
            <label className="doc-workspace-check">
              <input
                type="checkbox"
                checked={openPr}
                disabled={step === "done" || !preview?.github?.loggedIn}
                onChange={(e) => setOpenPr(e.target.checked)}
              />
              Open GitHub pull request (requires <code>gh auth login</code>)
            </label>
          </div>
          {step === "review" ? (
            <button
              type="button"
              className="doc-workspace-btn"
              disabled={publishing || !subject.trim()}
              onClick={() => void executePublish()}
            >
              {publishing ? (
                <Loader2 size={16} className="spin-ic" aria-hidden />
              ) : (
                <Check size={16} aria-hidden />
              )}
              Approve &amp; publish
            </button>
          ) : (
            <p className="doc-workspace-prose git-success">
              Published successfully.
              {resultUrl ? (
                <>
                  {" "}
                  <a href={resultUrl} target="_blank" rel="noopener noreferrer">
                    View pull request
                  </a>
                </>
              ) : null}
            </p>
          )}
        </section>
      ) : null}

      {error ? <p className="doc-workspace-alert">{error}</p> : null}
    </main>
  );
}

function pathBasename(p: string): string {
  const s = p.replace(/\\/g, "/");
  const i = s.lastIndexOf("/");
  return i >= 0 ? s.slice(i + 1) : s;
}
