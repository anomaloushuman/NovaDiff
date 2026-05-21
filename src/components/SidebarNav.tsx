import type { ReactNode } from "react";
import appMark from "../../nova-diff-icon.png";
import { useLaunch } from "./launch/LaunchContext";
import { TypewriterText } from "./launch/TypewriterText";
import {
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

export type WorkspacePage =
  | "compare"
  | "history"
  | "docs"
  | "docReports"
  | "prs"
  | "publish";

interface SidebarNavProps {
  active: boolean;
  workspacePage: WorkspacePage;
  onWorkspacePage: (page: WorkspacePage) => void;
  leftFolderName: string;
  rightFolderName: string;
  localOnlyMode?: boolean;
  compact?: boolean;
  gitUser?: { login: string; name: string | null; avatarUrl: string | null } | null;
  workspaceName?: string | null;
  workspaceRepoLabel?: string | null;
  onOpenSettings?: () => void;
}

const ic = { size: 16, strokeWidth: 1.75 } as const;
const icCompact = { size: 18, strokeWidth: 1.75 } as const;

function NavLink({
  compact,
  active,
  disabled,
  title,
  ariaLabel,
  onClick,
  icon,
  label,
}: {
  compact: boolean;
  active: boolean;
  disabled?: boolean;
  title?: string;
  ariaLabel: string;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`sidebar-link${active ? " active" : ""}${compact ? " sidebar-link--compact" : ""}`}
      disabled={disabled}
      title={title ?? (compact ? label : undefined)}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <span className="sidebar-link-icon" aria-hidden>
        {icon}
      </span>
      {!compact ? label : null}
    </button>
  );
}

export function SidebarNav({
  active,
  workspacePage,
  onWorkspacePage,
  leftFolderName,
  rightFolderName,
  localOnlyMode,
  compact = false,
  gitUser,
  workspaceName,
  workspaceRepoLabel,
  onOpenSettings,
}: SidebarNavProps) {
  const gitLocked = Boolean(localOnlyMode);
  const { brandReveal, skipSequence } = useLaunch();
  const showLaunchBrand = brandReveal && !skipSequence && !compact;
  const iconProps = compact ? icCompact : ic;

  const repoLabel =
    workspaceRepoLabel ??
    (active ? `${leftFolderName} → ${rightFolderName}` : "Pick two folders");

  return (
    <aside
      className={`sidebar${showLaunchBrand ? " sidebar--launch" : ""}${compact ? " sidebar--compact" : ""}`}
    >
      <div className={`sidebar-brand${compact ? " sidebar-brand--compact" : ""}`}>
        <img className="sidebar-logo" src={appMark} alt="" width={36} height={36} />
        {!compact ? (
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
        ) : null}
      </div>

      {!compact ? (
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
      ) : null}

      <nav className="sidebar-section">
        {!compact ? <div className="sidebar-label">Workspace</div> : null}
        <div
          className={`sidebar-repo ${active ? "active" : "muted"}${compact ? " sidebar-repo--compact" : ""}`}
          title={compact ? `${workspaceName ?? "Workspace"} — ${repoLabel}` : undefined}
        >
          <span className="sidebar-repo-icon" aria-hidden>
            <FolderGit2 size={18} strokeWidth={1.75} />
          </span>
          {!compact ? (
            <span className="sidebar-repo-text">
              <span className="sidebar-repo-name">{workspaceName ?? "Workspace"}</span>
              <span className="sidebar-repo-branch">{repoLabel}</span>
            </span>
          ) : null}
        </div>
      </nav>

      <nav className="sidebar-section sidebar-section--nav">
        {!compact ? <div className="sidebar-label">Navigate</div> : null}
        <NavLink
          compact={compact}
          active={workspacePage === "compare"}
          disabled={!active}
          title={!active ? "Compare two folders first" : undefined}
          ariaLabel="Folder compare"
          onClick={() => {
            if (active) {
              onWorkspacePage("compare");
            }
          }}
          icon={<Columns2 {...iconProps} />}
          label="Folder compare"
        />
        <NavLink
          compact={compact}
          active={workspacePage === "history"}
          disabled={gitLocked}
          title={gitLocked ? "Requires GitHub sign-in (not available in local-only mode)" : undefined}
          ariaLabel="Git history compare"
          onClick={() => onWorkspacePage("history")}
          icon={<History {...iconProps} />}
          label="Git history compare"
        />
        <NavLink
          compact={compact}
          active={workspacePage === "docs"}
          disabled={!active}
          title={!active ? "Compare two folders first" : undefined}
          ariaLabel="Code map and city"
          onClick={() => {
            if (active) {
              onWorkspacePage("docs");
            }
          }}
          icon={<Brain {...iconProps} />}
          label="Code map"
        />
        <NavLink
          compact={compact}
          active={workspacePage === "docReports"}
          disabled={!active}
          title={!active ? "Compare two folders first" : undefined}
          ariaLabel="Documentation reports"
          onClick={() => {
            if (active) {
              onWorkspacePage("docReports");
            }
          }}
          icon={<FileText {...iconProps} />}
          label="Doc reports"
        />
        <NavLink
          compact={compact}
          active={workspacePage === "prs"}
          disabled={gitLocked}
          title={gitLocked ? "Requires GitHub sign-in (not available in local-only mode)" : undefined}
          ariaLabel="Pull requests"
          onClick={() => onWorkspacePage("prs")}
          icon={<GitPullRequest {...iconProps} />}
          label="Pull requests"
        />
        <NavLink
          compact={compact}
          active={workspacePage === "publish"}
          disabled={gitLocked}
          title={gitLocked ? "Requires GitHub sign-in (not available in local-only mode)" : undefined}
          ariaLabel="Auto-commit"
          onClick={() => onWorkspacePage("publish")}
          icon={<ClipboardList {...iconProps} />}
          label="Auto-commit"
        />
        <NavLink
          compact={compact}
          active={false}
          disabled
          title="Coming soon"
          ariaLabel="Insights"
          onClick={() => {}}
          icon={<Lightbulb {...iconProps} />}
          label="Insights"
        />
        <NavLink
          compact={compact}
          active={false}
          disabled={!onOpenSettings}
          title={onOpenSettings ? "Local LLM (Ollama / LM Studio)" : undefined}
          ariaLabel="Settings"
          onClick={() => onOpenSettings?.()}
          icon={<Settings2 {...iconProps} />}
          label="Settings"
        />
      </nav>

      <div className="sidebar-spacer" />

      <div className={`sidebar-user${compact ? " sidebar-user--compact" : ""}`}>
        {gitUser?.avatarUrl ? (
          <img
            className="sidebar-user-avatar-img"
            src={gitUser.avatarUrl}
            alt=""
            width={36}
            height={36}
          />
        ) : (
          <div className="sidebar-user-avatar" aria-hidden title={compact ? gitUser?.login ?? "Local" : undefined}>
            <User size={18} strokeWidth={1.75} />
          </div>
        )}
        {!compact ? (
          <div>
            <div className="sidebar-user-name">
              {localOnlyMode ? "Local" : (gitUser?.login ?? "Local")}
            </div>
            <div className="sidebar-user-email">
              {localOnlyMode
                ? "Offline folder compare"
                : gitUser
                  ? (gitUser.name ?? "GitHub · signed in")
                  : "Offline compare"}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
