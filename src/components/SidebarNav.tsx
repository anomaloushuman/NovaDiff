import { useEffect, useRef, type ReactNode } from "react";
import appMark from "../../nova-diff-icon.png";
import { useLaunch } from "./launch/LaunchContext";
import { TypewriterText } from "./launch/TypewriterText";
import type { UseSidebarExpandResult } from "./sidebar/useSidebarExpand";

export type SidebarExpandProps = Pick<
  UseSidebarExpandResult,
  | "panelExpanded"
  | "typingActive"
  | "erasingActive"
  | "onPointerEnter"
  | "onPointerLeave"
  | "onFocusCapture"
  | "onBlurCapture"
>;
import { usePrefersReducedMotion } from "../app/usePrefersReducedMotion";
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
  | "insights"
  | "prs"
  | "publish";

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
  expand: SidebarExpandProps;
}

const navIcon = { size: 18, strokeWidth: 1.75 } as const;
const featureIcon = { size: 16, strokeWidth: 1.75 } as const;
const LABEL_SPEED = 20;

function SidebarTypedLabel({
  text,
  showSlot,
  typingActive,
  erasingActive,
  delay = 0,
  className,
  speed = LABEL_SPEED,
}: {
  text: string;
  showSlot: boolean;
  typingActive: boolean;
  erasingActive: boolean;
  delay?: number;
  className?: string;
  speed?: number;
}) {
  const reduced = usePrefersReducedMotion();

  if (!showSlot) {
    return null;
  }

  if (reduced) {
    if (erasingActive) {
      return null;
    }
    return <span className={className}>{text}</span>;
  }

  if (erasingActive) {
    return (
      <TypewriterText
        text={text}
        className={className}
        active
        direction="reverse"
        persist={false}
        speed={speed}
        showCursor
      />
    );
  }

  if (typingActive) {
    return (
      <TypewriterText
        text={text}
        className={className}
        active
        direction="forward"
        persist={false}
        speed={speed}
        delay={delay}
        showCursor
      />
    );
  }

  return <span className={className}>{text}</span>;
}

function NavLink({
  collapsed,
  showSlot,
  typingActive,
  erasingActive,
  labelDelay,
  active,
  disabled,
  title,
  ariaLabel,
  onClick,
  icon,
  label,
}: {
  collapsed: boolean;
  showSlot: boolean;
  typingActive: boolean;
  erasingActive: boolean;
  labelDelay: number;
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
      className={`sidebar-link${active ? " active" : ""}`}
      disabled={disabled}
      title={title ?? (collapsed ? label : undefined)}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <span className="sidebar-link-icon" aria-hidden>
        {icon}
      </span>
      <span className={`sidebar-text-slot${showSlot ? " is-open" : ""}`}>
        <SidebarTypedLabel
          text={label}
          showSlot={showSlot}
          typingActive={typingActive}
          erasingActive={erasingActive}
          delay={labelDelay}
        />
      </span>
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
  gitUser,
  workspaceName,
  workspaceRepoLabel,
  onOpenSettings,
  expand,
}: SidebarNavProps) {
  const gitLocked = Boolean(localOnlyMode);
  const { skipSequence } = useLaunch();
  const {
    panelExpanded,
    typingActive,
    erasingActive,
    onPointerEnter,
    onPointerLeave,
    onFocusCapture,
    onBlurCapture,
  } = expand;

  const collapsed = !panelExpanded;
  const showSlot = panelExpanded;
  const launchBrandPendingRef = useRef(!skipSequence);
  const showLaunchBrand =
    panelExpanded && !skipSequence && launchBrandPendingRef.current;

  useEffect(() => {
    if (panelExpanded && launchBrandPendingRef.current) {
      const id = window.setTimeout(() => {
        launchBrandPendingRef.current = false;
      }, 4000);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [panelExpanded]);

  const repoLabel =
    workspaceRepoLabel ??
    (active ? `${leftFolderName} → ${rightFolderName}` : "Pick two folders");

  const userName = localOnlyMode ? "Local" : (gitUser?.login ?? "Local");
  const userEmail = localOnlyMode
    ? "Offline folder compare"
    : gitUser
      ? (gitUser.name ?? "GitHub · signed in")
      : "Offline compare";

  let navDelay = 0;
  const nextNavDelay = () => {
    const d = navDelay;
    navDelay += 35;
    return d;
  };

  return (
    <aside
      className={`sidebar sidebar--rail${panelExpanded ? " sidebar--expanded" : ""}`}
      aria-expanded={panelExpanded}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocusCapture={onFocusCapture}
      onBlurCapture={onBlurCapture}
    >
      <div className="sidebar-brand">
        <img className="sidebar-logo" src={appMark} alt="" width={36} height={36} />
        <div className={`sidebar-brand-text${showSlot ? " is-open" : ""}`}>
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
              <div className="sidebar-title">
                <SidebarTypedLabel
                  text="NovaDiff"
                  showSlot={showSlot}
                  typingActive={typingActive}
                  erasingActive={erasingActive}
                  speed={22}
                />
              </div>
              <div className="sidebar-tagline">
                <SidebarTypedLabel
                  text="Smarter Diffs. Better Reviews."
                  showSlot={showSlot}
                  typingActive={typingActive}
                  erasingActive={erasingActive}
                  delay={40}
                  speed={18}
                />
              </div>
              <div className="sidebar-product-line">
                <SidebarTypedLabel
                  text="AI-powered folder compare"
                  showSlot={showSlot}
                  typingActive={typingActive}
                  erasingActive={erasingActive}
                  delay={200}
                  speed={16}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="sidebar-features sidebar-features--expanded" aria-label="Product highlights">
        <div className="sidebar-feature">
          <span className="sidebar-feature-icon" aria-hidden>
            <Columns2 {...featureIcon} />
          </span>
          <span className={`sidebar-text-slot${showSlot ? " is-open" : ""}`}>
            <SidebarTypedLabel
              text="Side-by-side"
              showSlot={showSlot}
              typingActive={typingActive}
              erasingActive={erasingActive}
              delay={80}
            />
          </span>
        </div>
        <div className="sidebar-feature">
          <span className="sidebar-feature-icon" aria-hidden>
            <Brain {...featureIcon} />
          </span>
          <span className={`sidebar-text-slot${showSlot ? " is-open" : ""}`}>
            <SidebarTypedLabel
              text="Semantic"
              showSlot={showSlot}
              typingActive={typingActive}
              erasingActive={erasingActive}
              delay={115}
            />
          </span>
        </div>
        <div className="sidebar-feature">
          <span className="sidebar-feature-icon" aria-hidden>
            <FileText {...featureIcon} />
          </span>
          <span className={`sidebar-text-slot${showSlot ? " is-open" : ""}`}>
            <SidebarTypedLabel
              text="Summaries"
              showSlot={showSlot}
              typingActive={typingActive}
              erasingActive={erasingActive}
              delay={150}
            />
          </span>
        </div>
        <div className="sidebar-feature">
          <span className="sidebar-feature-icon" aria-hidden>
            <Lightbulb {...featureIcon} />
          </span>
          <span className={`sidebar-text-slot${showSlot ? " is-open" : ""}`}>
            <SidebarTypedLabel
              text="Insights"
              showSlot={showSlot}
              typingActive={typingActive}
              erasingActive={erasingActive}
              delay={185}
            />
          </span>
        </div>
      </div>

      <nav className="sidebar-section">
        <div className={`sidebar-label sidebar-text-slot${showSlot ? " is-open" : ""}`}>
          <SidebarTypedLabel
            text="Workspace"
            showSlot={showSlot}
            typingActive={typingActive}
            erasingActive={erasingActive}
          />
        </div>
        <div
          className={`sidebar-repo ${active ? "active" : "muted"}`}
          title={collapsed ? `${workspaceName ?? "Workspace"} — ${repoLabel}` : undefined}
        >
          <span className="sidebar-repo-icon" aria-hidden>
            <FolderGit2 {...navIcon} />
          </span>
          <span className={`sidebar-repo-text sidebar-text-slot${showSlot ? " is-open" : ""}`}>
            <span className="sidebar-repo-name">
              <SidebarTypedLabel
                text={workspaceName ?? "Workspace"}
                showSlot={showSlot}
                typingActive={typingActive}
                erasingActive={erasingActive}
                delay={30}
              />
            </span>
            <span className="sidebar-repo-branch">
              <SidebarTypedLabel
                text={repoLabel}
                showSlot={showSlot}
                typingActive={typingActive}
                erasingActive={erasingActive}
                delay={65}
              />
            </span>
          </span>
        </div>
      </nav>

      <nav className="sidebar-section sidebar-section--nav">
        <div className={`sidebar-label sidebar-text-slot${showSlot ? " is-open" : ""}`}>
          <SidebarTypedLabel
            text="Navigate"
            showSlot={showSlot}
            typingActive={typingActive}
            erasingActive={erasingActive}
          />
        </div>
        <NavLink
          collapsed={collapsed}
          showSlot={showSlot}
          typingActive={typingActive}
          erasingActive={erasingActive}
          labelDelay={nextNavDelay()}
          active={workspacePage === "history"}
          disabled={gitLocked}
          title={gitLocked ? "Requires GitHub sign-in (not available in local-only mode)" : undefined}
          ariaLabel="Change history"
          onClick={() => onWorkspacePage("history")}
          icon={<History {...navIcon} />}
          label="Change history"
        />
        <NavLink
          collapsed={collapsed}
          showSlot={showSlot}
          typingActive={typingActive}
          erasingActive={erasingActive}
          labelDelay={nextNavDelay()}
          active={workspacePage === "compare"}
          disabled={!active}
          title={!active ? "Run a compare from Change history first" : undefined}
          ariaLabel="Code compare"
          onClick={() => {
            if (active) {
              onWorkspacePage("compare");
            }
          }}
          icon={<Columns2 {...navIcon} />}
          label="Code compare"
        />
        <NavLink
          collapsed={collapsed}
          showSlot={showSlot}
          typingActive={typingActive}
          erasingActive={erasingActive}
          labelDelay={nextNavDelay()}
          active={workspacePage === "docs"}
          disabled={!active}
          title={!active ? "Run a compare from Change history first" : undefined}
          ariaLabel="Code map and city"
          onClick={() => {
            if (active) {
              onWorkspacePage("docs");
            }
          }}
          icon={<Brain {...navIcon} />}
          label="Code map"
        />
        <NavLink
          collapsed={collapsed}
          showSlot={showSlot}
          typingActive={typingActive}
          erasingActive={erasingActive}
          labelDelay={nextNavDelay()}
          active={workspacePage === "docReports"}
          disabled={!active}
          title={!active ? "Run a compare from Change history first" : undefined}
          ariaLabel="Documentation reports"
          onClick={() => {
            if (active) {
              onWorkspacePage("docReports");
            }
          }}
          icon={<FileText {...navIcon} />}
          label="Doc reports"
        />
        <NavLink
          collapsed={collapsed}
          showSlot={showSlot}
          typingActive={typingActive}
          erasingActive={erasingActive}
          labelDelay={nextNavDelay()}
          active={workspacePage === "prs"}
          disabled={gitLocked}
          title={gitLocked ? "Requires GitHub sign-in (not available in local-only mode)" : undefined}
          ariaLabel="Pull requests"
          onClick={() => onWorkspacePage("prs")}
          icon={<GitPullRequest {...navIcon} />}
          label="Pull requests"
        />
        <NavLink
          collapsed={collapsed}
          showSlot={showSlot}
          typingActive={typingActive}
          erasingActive={erasingActive}
          labelDelay={nextNavDelay()}
          active={workspacePage === "publish"}
          disabled={gitLocked}
          title={gitLocked ? "Requires GitHub sign-in (not available in local-only mode)" : undefined}
          ariaLabel="Auto-commit"
          onClick={() => onWorkspacePage("publish")}
          icon={<ClipboardList {...navIcon} />}
          label="Auto-commit"
        />
        <NavLink
          collapsed={collapsed}
          showSlot={showSlot}
          typingActive={typingActive}
          erasingActive={erasingActive}
          labelDelay={nextNavDelay()}
          active={workspacePage === "insights"}
          disabled={!active}
          title={!active ? "Run a compare from Change history first" : undefined}
          ariaLabel="Insights"
          onClick={() => {
            if (active) {
              onWorkspacePage("insights");
            }
          }}
          icon={<Lightbulb {...navIcon} />}
          label="Insights"
        />
        <NavLink
          collapsed={collapsed}
          showSlot={showSlot}
          typingActive={typingActive}
          erasingActive={erasingActive}
          labelDelay={nextNavDelay()}
          active={false}
          disabled={!onOpenSettings}
          title={onOpenSettings ? "Local LLM (Ollama / LM Studio)" : undefined}
          ariaLabel="Settings"
          onClick={() => onOpenSettings?.()}
          icon={<Settings2 {...navIcon} />}
          label="Settings"
        />
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
          <div
            className="sidebar-user-avatar"
            aria-hidden
            title={collapsed ? (gitUser?.login ?? "Local") : undefined}
          >
            <User {...navIcon} />
          </div>
        )}
        <div className={`sidebar-user-text sidebar-text-slot${showSlot ? " is-open" : ""}`}>
          <div className="sidebar-user-name">
            <SidebarTypedLabel
              text={userName}
              showSlot={showSlot}
              typingActive={typingActive}
              erasingActive={erasingActive}
              delay={20}
            />
          </div>
          <div className="sidebar-user-email">
            <SidebarTypedLabel
              text={userEmail}
              showSlot={showSlot}
              typingActive={typingActive}
              erasingActive={erasingActive}
              delay={55}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
