import appMark from "../../nova-diff-icon.png";
import {
  BookOpen,
  Brain,
  ClipboardList,
  Columns2,
  FileText,
  FolderGit2,
  GitPullRequest,
  Lightbulb,
  Settings2,
  User,
} from "lucide-react";

export type WorkspacePage = "compare" | "docs";

interface SidebarNavProps {
  active: boolean;
  workspacePage: WorkspacePage;
  onWorkspacePage: (page: WorkspacePage) => void;
  leftFolderName: string;
  rightFolderName: string;
  onOpenSettings?: () => void;
}

const ic = { size: 16, strokeWidth: 1.75 } as const;

export function SidebarNav({
  active,
  workspacePage,
  onWorkspacePage,
  leftFolderName,
  rightFolderName,
  onOpenSettings,
}: SidebarNavProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img className="sidebar-logo" src={appMark} alt="" width={36} height={36} />
        <div>
          <div className="sidebar-title">NovaDiff</div>
          <div className="sidebar-tagline">Smarter Diffs. Better Reviews.</div>
          <div className="sidebar-product-line">AI-powered folder compare</div>
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
            <span className="sidebar-repo-name">Folder compare</span>
            <span className="sidebar-repo-branch">
              {active ? `${leftFolderName} → ${rightFolderName}` : "Pick two folders"}
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
        <button type="button" className="sidebar-link" disabled title="Coming soon">
          <GitPullRequest {...ic} className="sidebar-link-icon" />
          Pull Requests
        </button>
        <button type="button" className="sidebar-link" disabled title="Coming soon">
          <ClipboardList {...ic} className="sidebar-link-icon" />
          Reviews
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
        <div className="sidebar-user-avatar" aria-hidden>
          <User size={18} strokeWidth={1.75} />
        </div>
        <div>
          <div className="sidebar-user-name">Local</div>
          <div className="sidebar-user-email">Offline compare</div>
        </div>
      </div>
    </aside>
  );
}
