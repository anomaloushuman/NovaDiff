import { useEffect } from "react";

const SHORTCUTS = [
  { keys: "?", desc: "Show keyboard shortcuts" },
  { keys: "F11", desc: "Toggle fullscreen" },
  { keys: "Ctrl/⌘ + F", desc: "Toggle fullscreen (alternate)" },
  { keys: "Esc", desc: "Close this help panel" },
] as const;

export function KeyboardShortcutsHelp({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="shortcuts-help-overlay" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <div className="shortcuts-help-panel">
        <header className="shortcuts-help-head">
          <h2>Keyboard shortcuts</h2>
          <button type="button" className="doc-workspace-copy-btn" onClick={onClose}>
            Close
          </button>
        </header>
        <ul className="shortcuts-help-list">
          {SHORTCUTS.map((s) => (
            <li key={s.keys}>
              <kbd>{s.keys}</kbd>
              <span>{s.desc}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
