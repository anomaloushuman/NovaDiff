import appMark from "../../nova-diff-icon.png";
import { useLaunch } from "./launch/LaunchContext";
import { TypewriterText } from "./launch/TypewriterText";
import {
  BookOpen,
  Brain,
  ClipboardList,
  Columns2,
  FileText,
  FolderGit2,
  GitPullRequest,
  History,
  Lightbulb,
  Settings2,
  User,
} from "lucide-react";

export type WorkspacePage = "compare" | "history" | "docs" | "prs" | "publish";

interface SidebarNavProps {
  active: boolean;
  workspacePage: WorkspacePage;
  onWorkspacePage: (page: WorkspacePage) => void;
  leftFolderName: string;
  rightFolderName: string;
  localOnlyMode?: boolean;
  gitUser?: { login: string; name: string | null; avatarUrl: string | null } | null;
  workspaceName?: string | null;
  workspaceRepoLabel?: string | null;
  onOpenSettings?: () => void;
}

const ic = { size: 16, strokeWidth: 1.75 } as const;

export function SidebarNav({
  active,
  workspacePage,
  onWorkspacePage,
  leftFolderName,
  rightFolderName,
  localOnlyMode,
  gitUser,
  workspaceName,
  workspaceRepoLabel,
  onOpenSettings,
}: SidebarNavProps) {
  const gitLocked = Boolean(localOnlyMode);
  const { brandReveal, skipSequence } = useLaunch();
  const showLaunchBrand = brandReveal && !skipSequence;

  return (
    <aside className={`sidebar${showLaunchBrand ? " sidebar--launch" : ""}`}>
      <div className="sidebar-brand">
        <img className="sidebar-logo" src={appMark} alt="" width={36} height={36} />
        <div>
          {showLaunchBrand ? (
            <>
              <div className="sidebar-title sidebar-title--type">
                <TypewriterText text="NovaDiff" active speed={38} />
              </div>
              <div className="sidebar-tagline">
                <TypewriterText
                  text="Smarter Diffs. Better Reviews."
                  active
                  speed={19}
                  delay={320}
                />
              </div>
              <div className="sidebar-product-line">
                <TypewriterText
                  text="AI-powered folder compare"
                  active
                  speed={16}
                  delay={1100}
                />
              </div>
            </>
          ) : (
            <>
              <div className="sidebar-title">NovaDiff</div>
              <div className="sidebar-tagline">Smarter Diffs. Better Reviews.</div>
              <div className="sidebar-product-line">AI-powered folder compare</div>
            </>
          )}
        </div>
      </div>

      <div className="sidebar-features" aria-label="Product highlights">
        <div className="sidebar-feature">
          <span className="sidebar-feature-icon" aria-hidden>
            <Columns2 {...ic} />
          </span>
          <span>Side-by-side</span>
        </div>
        <div className="sidebar-feature">
          <span className="sidebar-feature-icon" aria-hidden>
            <Brain {...ic} />
          </span>
          <span>Semantic</span>
        </div>
        <div className="sidebar-feature">
          <span className="sidebar-feature-icon" aria-hidden>
            <FileText {...ic} />
          </span>
          <span>Summaries</span>
        </div>
        <div className="sidebar-feature">
          <span className="sidebar-feature-icon" aria-hidden>
            <Lightbulb {...ic} />
          </span>
          <span>Insights</span>
        </div>
      </div>

      <nav className="sidebar-section">
        <div className="sidebar-label">Workspace</div>
        <div className={`sidebar-repo ${active ? "active" : "muted"}`}>
          <span className="sidebar-repo-icon" aria-hidden>
            <FolderGit2 size={18} strokeWidth={1.75} />
          </span>
          <span className="sidebar-repo-text">
            <span className="sidebar-repo-name">{workspaceName ?? "Workspace"}</span>
            <span className="sidebar-repo-branch">
              {workspaceRepoLabel ??
                (active ? `${leftFolderName} → ${rightFolderName}` : "Pick two folders")}
            </span>
          </span>
        </div>
      </nav>

      <nav className="sidebar-section">
        <div className="sidebar-label">Navigate</div>
        <button
          type="button"
          className={`sidebar-link ${workspacePage === "compare" ? "active" : ""}`}
          disabled={!active}
          title={!active ? "Compare two folders first" : undefined}
          onClick={() => {
            if (active) {
              onWorkspacePage("compare");
            }
          }}
        >
          <Columns2 {...ic} className="sidebar-link-icon" />
          Folder compare
        </button>
        <button
          type="button"
          className={`sidebar-link ${workspacePage === "history" ? "active" : ""}`}
          disabled={gitLocked}
          title={gitLocked ? "Requires GitHub sign-in (not available in local-only mode)" : undefined}
          onClick={() => onWorkspacePage("history")}
        >
          <History {...ic} className="sidebar-link-icon" />
          Git history compare
        </button>
        <button
          type="button"
          className={`sidebar-link ${workspacePage === "docs" ? "active" : ""}`}
          disabled={!active}
          title={!active ? "Compare two folders first" : undefined}
          onClick={() => {
            if (active) {
              onWorkspacePage("docs");
            }
          }}
        >
          <BookOpen {...ic} className="sidebar-link-icon" />
          Documentation workspace
        </button>
        <button
          type="button"
          className={`sidebar-link ${workspacePage === "prs" ? "active" : ""}`}
          disabled={gitLocked}
          title={gitLocked ? "Requires GitHub sign-in (not available in local-only mode)" : undefined}
          onClick={() => onWorkspacePage("prs")}
        >
          <GitPullRequest {...ic} className="sidebar-link-icon" />
          Pull requests
        </button>
        <button
          type="button"
          className={`sidebar-link ${workspacePage === "publish" ? "active" : ""}`}
          disabled={gitLocked}
          title={gitLocked ? "Requires GitHub sign-in (not available in local-only mode)" : undefined}
          onClick={() => onWorkspacePage("publish")}
        >
          <ClipboardList {...ic} className="sidebar-link-icon" />
          Auto-commit
        </button>
        <button type="button" className="sidebar-link" disabled title="Coming soon">
          <Lightbulb {...ic} className="sidebar-link-icon" />
          Insights
        </button>
        <button
          type="button"
          className="sidebar-link"
          disabled={!onOpenSettings}
          title={onOpenSettings ? "Local LLM (Ollama / LM Studio)" : undefined}
          onClick={() => onOpenSettings?.()}
        >
          <Settings2 {...ic} className="sidebar-link-icon" />
          Settings
        </button>
      </nav>

      <div className="sidebar-spacer" />

      <div className="sidebar-user">
        {gitUser?.avatarUrl ? (
          <img
            className="sidebar-user-avatar-img"
            src={gitUser.avatarUrl}
            alt=""
            width={36}
            height={36}
          />
        ) : (
          <div className="sidebar-user-avatar" aria-hidden>
            <User size={18} strokeWidth={1.75} />
          </div>
        )}
        <div>
          <div className="sidebar-user-name">
            {localOnlyMode ? "Local" : gitUser?.login ?? "Local"}
          </div>
          <div className="sidebar-user-email">
            {localOnlyMode
              ? "Offline folder compare"
              : gitUser
                ? (gitUser.name ?? "GitHub · signed in")
                : "Offline compare"}
          </div>
        </div>
      </div>
    </aside>
  );
}
