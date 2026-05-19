import { useEffect, useRef, useState } from "react";
import { runMermaidNodes } from "../app/mermaidBoot";

type RenderPhase = "idle" | "waiting" | "rendering" | "ready" | "error";

export interface DocMermaidMountProps {
  definition: string;
  /** When true, show skeleton and do not render source text. */
  loading?: boolean;
  loadingLabel?: string;
  errorLabel?: string;
}

export function DocMermaidMount({
  definition,
  loading = false,
  loadingLabel = "Loading chart…",
  errorLabel = "Could not render diagram.",
}: DocMermaidMountProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const renderGenRef = useRef(0);
  const [phase, setPhase] = useState<RenderPhase>("idle");

  useEffect(() => {
    if (loading) {
      setPhase("waiting");
      hostRef.current?.replaceChildren();
      return;
    }

    const host = hostRef.current;
    if (!host) {
      return;
    }

    const def = definition.trim();
    if (!def) {
      setPhase("idle");
      host.replaceChildren();
      return;
    }

    const generation = ++renderGenRef.current;
    let cancelled = false;
    setPhase("rendering");
    host.replaceChildren();

    const pre = document.createElement("pre");
    pre.className = "mermaid";
    pre.textContent = def;
    host.appendChild(pre);

    const run = () => {
      void runMermaidNodes([pre])
        .then(() => {
          if (cancelled || generation !== renderGenRef.current) {
            return;
          }
          setPhase("ready");
        })
        .catch(() => {
          if (cancelled || generation !== renderGenRef.current) {
            return;
          }
          setPhase("error");
          host.replaceChildren();
        });
    };

    // Render at full host size so Mermaid computes SVG bounds correctly.
    requestAnimationFrame(() => {
      if (cancelled || generation !== renderGenRef.current) {
        return;
      }
      run();
    });

    return () => {
      cancelled = true;
    };
  }, [definition, loading]);

  const showSkeleton = loading || phase === "waiting" || phase === "rendering";
  const mountClass = [
    "doc-mermaid-mount",
    phase === "ready" ? "is-ready" : "",
    showSkeleton ? "is-busy" : "",
    phase === "error" ? "is-error" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={mountClass}>
      {showSkeleton ? (
        <div className="doc-mermaid-skeleton" aria-busy="true" aria-live="polite">
          <span className="doc-mermaid-skeleton-bar" />
          <span className="doc-mermaid-skeleton-label">
            {loading ? loadingLabel : "Rendering diagram…"}
          </span>
        </div>
      ) : null}
      {phase === "error" ? (
        <p className="doc-workspace-muted doc-mermaid-error">{errorLabel}</p>
      ) : null}
      <div
        ref={hostRef}
        className={`doc-mermaid-host${phase === "ready" ? " is-visible" : ""}`}
        aria-hidden={showSkeleton && phase !== "rendering"}
      />
    </div>
  );
}
