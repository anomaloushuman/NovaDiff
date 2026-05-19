import { useCallback, useEffect, useState } from "react";
import { Copy, Download, ExternalLink, FolderOpen, Loader2, User } from "lucide-react";
import type { GhToolingStatus, GitUserProfile } from "../../app/workspaceTypes";

export interface WelcomeScreenProps {
  cachedGitUser?: GitUserProfile | null;
  onComplete: (user: GitUserProfile) => void;
  onLocalOnly: () => void;
}

export function WelcomeScreen({ cachedGitUser, onComplete, onLocalOnly }: WelcomeScreenProps) {
  const api = window.electronAPI;
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<GitUserProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [authStarting, setAuthStarting] = useState(false);
  const [deviceCode, setDeviceCode] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [ghStatus, setGhStatus] = useState<GhToolingStatus | null>(null);
  const [ghChecking, setGhChecking] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [installLog, setInstallLog] = useState<string[]>([]);

  const loadGhStatus = useCallback(async () => {
    if (!api?.githubGhStatus) {
      setGhChecking(false);
      return;
    }
    setGhChecking(true);
    try {
      const status = await api.githubGhStatus();
      setGhStatus(status);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGhChecking(false);
    }
  }, [api]);

  const refresh = useCallback(async () => {
    if (!api?.githubDetectedUsers) {
      setError("Git integration requires the NovaDiff desktop app.");
      return;
    }
    if (!ghStatus?.installed) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await api.githubDetectedUsers();
      setUsers(list);
      if (cachedGitUser && list.some((u) => u.login === cachedGitUser.login)) {
        setSelected(cachedGitUser.login);
      } else if (list.length === 1) {
        setSelected(list[0].login);
      }
    } catch (e) {
      setUsers([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [api, cachedGitUser?.login, ghStatus?.installed]);

  useEffect(() => {
    void loadGhStatus();
  }, [loadGhStatus]);

  useEffect(() => {
    if (ghStatus?.installed) {
      void refresh();
    }
  }, [ghStatus?.installed, refresh]);

  useEffect(() => {
    if (!api?.onGithubAuthProgress) {
      return;
    }
    return api.onGithubAuthProgress((msg) => {
      if (msg.phase === "code" && msg.userCode) {
        setDeviceCode(msg.userCode);
        setAuthStatus("Enter this code on the GitHub page in your browser.");
      } else if (msg.phase === "complete") {
        setAuthStatus("Signed in — loading your profile…");
        setAuthStarting(false);
        void refresh();
      } else if (msg.phase === "error") {
        setAuthStarting(false);
        setError(msg.message ?? "GitHub sign-in failed.");
      }
    });
  }, [api, refresh]);

  useEffect(() => {
    if (!api?.onGithubGhInstallProgress) {
      return;
    }
    return api.onGithubGhInstallProgress((msg) => {
      if (msg.line) {
        setInstallLog((prev) => [...prev.slice(-40), msg.line as string]);
      }
    });
  }, [api]);

  const installGh = async () => {
    if (!api?.githubGhInstall) {
      return;
    }
    setInstalling(true);
    setError(null);
    setInstallLog([]);
    try {
      await api.githubGhInstall();
      await loadGhStatus();
      setAuthStatus("GitHub CLI installed. You can sign in below.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setInstalling(false);
    }
  };

  const startAuth = async () => {
    if (!api?.githubStartAuth) {
      return;
    }
    await api.githubCancelAuth?.();
    setAuthStarting(true);
    setError(null);
    setAuthStatus("Starting GitHub sign-in…");
    setDeviceCode(null);
    setCopied(false);
    try {
      const res = await api.githubStartAuth();
      if (res.userCode) {
        setDeviceCode(res.userCode);
        setAuthStatus("Enter this code on the GitHub page in your browser.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setAuthStatus(null);
    } finally {
      setAuthStarting(false);
    }
  };

  const copyCode = async () => {
    if (!deviceCode) {
      return;
    }
    try {
      await navigator.clipboard.writeText(deviceCode.replace(/-/g, ""));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        await navigator.clipboard.writeText(deviceCode);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        /* ignore */
      }
    }
  };

  const confirmUser = async (user: GitUserProfile) => {
    setConfirming(true);
    setError(null);
    try {
      let profile = user;
      if (api?.githubUserProfile) {
        try {
          profile = await api.githubUserProfile();
        } catch {
          /* use detected profile */
        }
      }
      if (api?.workspaceSetGitUser) {
        await api.workspaceSetGitUser(profile);
      }
      onComplete(profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setConfirming(false);
    }
  };

  const ghReady = Boolean(ghStatus?.installed);
  const showGhSetup = !ghChecking && !ghReady;

  return (
    <div className="welcome-screen ui-view-enter">
      <div className="welcome-screen-frame">
        <h1 className="welcome-screen-title">Welcome to NovaDiff</h1>
        <p className="welcome-screen-lead">
          Connect GitHub for workspaces, version history, and team workflows — or skip straight to
          local folder compare with no account required.
        </p>

        {ghChecking ? (
          <p className="doc-workspace-muted">
            <Loader2 size={16} className="spin-ic" aria-hidden /> Checking for GitHub CLI…
          </p>
        ) : null}

        {error ? <p className="doc-workspace-alert">{error}</p> : null}

        {showGhSetup && ghStatus ? (
          <section className="welcome-gh-consent doc-workspace-panel">
            <h2 className="doc-workspace-h2">GitHub CLI required for full features</h2>
            <p className="doc-workspace-prose">{ghStatus.reason}</p>
            {ghStatus.manualHint ? (
              <p className="doc-workspace-muted">{ghStatus.manualHint}</p>
            ) : null}
            {ghStatus.installCommand ? (
              <pre className="git-cli-hint">{ghStatus.installCommand}</pre>
            ) : null}
            {installLog.length > 0 ? (
              <pre className="welcome-install-log">{installLog.join("\n")}</pre>
            ) : null}
            <div className="welcome-auth-actions">
              {ghStatus.canAutoInstall ? (
                <button
                  type="button"
                  className="doc-workspace-btn"
                  disabled={installing}
                  onClick={() => void installGh()}
                >
                  {installing ? (
                    <Loader2 size={16} className="spin-ic" aria-hidden />
                  ) : (
                    <Download size={16} aria-hidden />
                  )}
                  {ghStatus.installLabel ?? "Install GitHub CLI"}
                </button>
              ) : (
                <button
                  type="button"
                  className="doc-workspace-copy-btn"
                  onClick={() =>
                    void window.open(ghStatus.manualUrl, "_blank", "noopener,noreferrer")
                  }
                >
                  <ExternalLink size={14} aria-hidden />
                  Download GitHub CLI
                </button>
              )}
              <button type="button" className="doc-workspace-copy-btn" onClick={() => void loadGhStatus()}>
                Refresh detection
              </button>
            </div>
          </section>
        ) : null}

        {ghReady ? (
          <>
            {loading ? (
              <p className="doc-workspace-muted">
                <Loader2 size={16} className="spin-ic" aria-hidden /> Detecting signed-in accounts…
              </p>
            ) : null}

            {!loading && users.length === 0 ? (
              <div className="welcome-auth-block">
                <p className="doc-workspace-prose">
                  {ghStatus?.version ? (
                    <span className="doc-workspace-muted">{ghStatus.version} · </span>
                  ) : null}
                  Sign in to link your GitHub account:
                </p>
                {deviceCode ? (
                  <div className="welcome-device-code-block">
                    <p className="doc-workspace-commit-label">Your device code</p>
                    <p className="welcome-device-code" aria-live="polite">
                      {deviceCode}
                    </p>
                    <p className="doc-workspace-muted welcome-device-hint">
                      Paste this on the GitHub &ldquo;Authorize your device&rdquo; page.
                    </p>
                    <div className="welcome-auth-actions">
                      <button
                        type="button"
                        className="doc-workspace-copy-btn"
                        onClick={() => void copyCode()}
                      >
                        <Copy size={14} aria-hidden />
                        {copied ? "Copied" : "Copy code"}
                      </button>
                      <button
                        type="button"
                        className="doc-workspace-copy-btn"
                        onClick={() =>
                          void window.open(
                            "https://github.com/login/device",
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                      >
                        <ExternalLink size={14} aria-hidden />
                        Open GitHub page
                      </button>
                    </div>
                  </div>
                ) : null}
                {authStatus ? <p className="doc-workspace-muted">{authStatus}</p> : null}
                <div className="welcome-auth-actions">
                  <button type="button" className="doc-workspace-btn" onClick={() => void refresh()}>
                    Refresh
                  </button>
                  {api?.githubStartAuth ? (
                    <button
                      type="button"
                      className="doc-workspace-copy-btn"
                      disabled={authStarting}
                      onClick={() => void startAuth()}
                    >
                      {authStarting ? (
                        <Loader2 size={14} className="spin-ic" aria-hidden />
                      ) : (
                        <ExternalLink size={14} aria-hidden />
                      )}
                      {deviceCode ? "Restart sign-in" : "Sign in with GitHub"}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            <ul className="welcome-user-list">
              {users.map((u) => (
                <li key={u.login}>
                  <button
                    type="button"
                    className={`welcome-user-card${selected === u.login ? " selected" : ""}`}
                    onClick={() => setSelected(u.login)}
                    onDoubleClick={() => void confirmUser(u)}
                  >
                    {u.avatarUrl ? (
                      <img
                        className="welcome-user-avatar"
                        src={u.avatarUrl}
                        alt=""
                        width={48}
                        height={48}
                      />
                    ) : (
                      <span className="welcome-user-avatar-fallback" aria-hidden>
                        <User size={24} />
                      </span>
                    )}
                    <span className="welcome-user-text">
                      <strong>{u.name ?? u.login}</strong>
                      <span>@{u.login}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {cachedGitUser && users.some((u) => u.login === cachedGitUser.login) ? (
              <button
                type="button"
                className="doc-workspace-btn welcome-continue-btn"
                disabled={confirming}
                onClick={() => {
                  const u = users.find((x) => x.login === cachedGitUser.login);
                  if (u) {
                    void confirmUser(u);
                  } else {
                    void confirmUser(cachedGitUser);
                  }
                }}
              >
                {confirming ? <Loader2 size={16} className="spin-ic" aria-hidden /> : null}
                Continue as @{cachedGitUser.login}
              </button>
            ) : null}
            {users.length > 0 ? (
              <button
                type="button"
                className="doc-workspace-copy-btn welcome-continue-alt"
                disabled={!selected || confirming}
                onClick={() => {
                  const u = users.find((x) => x.login === selected);
                  if (u) {
                    void confirmUser(u);
                  }
                }}
              >
                {confirming ? <Loader2 size={16} className="spin-ic" aria-hidden /> : null}
                {cachedGitUser ? "Use a different account" : "Continue with GitHub"}
              </button>
            ) : null}
          </>
        ) : null}

        <div className="welcome-local-only-divider" role="separator" />

        <section className="welcome-local-only">
          <h2 className="doc-workspace-h3">Local folder compare only</h2>
          <p className="doc-workspace-prose">
            Skip GitHub sign-in and workspaces. Use NovaDiff as a standalone tool to pick two
            folders, diff them semantically, and generate summaries — no GitHub CLI or account
            needed.
          </p>
          <button type="button" className="doc-workspace-btn welcome-local-only-btn" onClick={onLocalOnly}>
            <FolderOpen size={16} aria-hidden />
            Continue with local compare only
          </button>
        </section>
      </div>
    </div>
  );
}
