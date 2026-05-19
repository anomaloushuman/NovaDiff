import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "../../app/usePrefersReducedMotion";

const CLOSE_MS = 300;

export interface AnimatedOverlayProps {
  open: boolean;
  onClose: () => void;
  backdropClassName: string;
  panelClassName: string;
  labelledBy?: string;
  children: React.ReactNode;
}

export function AnimatedOverlay({
  open,
  onClose,
  backdropClassName,
  panelClassName,
  labelledBy,
  children,
}: AnimatedOverlayProps) {
  const reduced = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      if (reduced) {
        setVisible(true);
        return;
      }
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const delay = reduced ? 0 : CLOSE_MS;
    const id = window.setTimeout(() => setMounted(false), delay);
    return () => window.clearTimeout(id);
  }, [open, reduced]);

  useEffect(() => {
    if (!mounted || !open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, onClose, open]);

  if (!mounted) {
    return null;
  }

  const motion = visible ? "is-open" : "is-closing";

  return (
    <div
      className={`${backdropClassName} ui-overlay ${motion}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={`${panelClassName} ui-overlay-panel ${motion}`}>{children}</div>
    </div>
  );
}
