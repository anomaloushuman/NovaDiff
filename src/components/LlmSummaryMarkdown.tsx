import { memo, useEffect, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { normalizeGeneratedMarkdown } from "../app/generatedMarkdown";
import { runMermaidNodes } from "../app/mermaidBoot";

interface LlmSummaryMarkdownProps {
  /** Markdown source (may be incomplete while streaming). */
  source: string;
}

function MermaidBlock({ chart }: { chart: string }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) {
      return;
    }
    el.replaceChildren();
    const pre = document.createElement("pre");
    pre.className = "mermaid";
    pre.textContent = chart;
    el.appendChild(pre);
    void runMermaidNodes([pre]);
  }, [chart]);
  return <div ref={host} className="llm-mermaid-host" />;
}

function LlmSummaryMarkdownInner({ source }: LlmSummaryMarkdownProps) {
  const normalized = useMemo(() => normalizeGeneratedMarkdown(source), [source]);
  return (
    <div className="llm-md-root">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ href, children, ...rest }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              {...rest}
            >
              {children}
            </a>
          ),
          code: (props) => {
            const { className, children, ...rest } = props;
            const inline = Boolean(
              (props as { inline?: boolean }).inline,
            );
            if (inline) {
              return (
                <code className={className} {...rest}>
                  {children}
                </code>
              );
            }
            const cls = typeof className === "string" ? className : "";
            const isMermaid = cls.split(/\s+/).includes("language-mermaid");
            const text = String(children).replace(/\n$/, "");
            if (isMermaid && text.trim()) {
              return <MermaidBlock chart={text} />;
            }
            return (
              <code className={className} {...rest}>
                {children}
              </code>
            );
          },
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}

export const LlmSummaryMarkdown = memo(LlmSummaryMarkdownInner);
