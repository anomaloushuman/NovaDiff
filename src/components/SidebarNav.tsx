import appMark from "../../nova-diff-icon.png";

interface SidebarNavProps {
  active: boolean;
  leftFolderName: string;
  rightFolderName: string;
  onOpenSettings?: () => void;
}

export function SidebarNav({
  active,
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
        </div>
      </div>

      <nav className="sidebar-section">
        <div className="sidebar-label">Workspace</div>
        <div className={`sidebar-repo ${active ? "active" : "muted"}`}>
          <span className="sidebar-repo-name">Folder compare</span>
          <span className="sidebar-repo-branch">
            {active ? `${leftFolderName} → ${rightFolderName}` : "Pick two folders"}
          </span>
        </div>
      </nav>

      <nav className="sidebar-section">
        <div className="sidebar-label">Navigate</div>
        <button type="button" className="sidebar-link" disabled title="Coming soon">
          Pull Requests
        </button>
        <button type="button" className="sidebar-link" disabled title="Coming soon">
          Reviews
        </button>
        <button type="button" className="sidebar-link" disabled title="Coming soon">
          Insights
        </button>
        <button
          type="button"
          className="sidebar-link"
          disabled={!onOpenSettings}
          title={onOpenSettings ? "Local LLM (Ollama / LM Studio)" : undefined}
          onClick={() => onOpenSettings?.()}
        >
          Settings
        </button>
      </nav>

      <div className="sidebar-spacer" />

      <div className="sidebar-user">
        <div className="sidebar-user-avatar" aria-hidden />
        <div>
          <div className="sidebar-user-name">Local</div>
          <div className="sidebar-user-email">Offline compare</div>
        </div>
      </div>
    </aside>
  );
}
