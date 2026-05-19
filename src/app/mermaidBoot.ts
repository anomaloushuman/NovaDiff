let initTheme: "dark" | "default" | null = null;

function currentMermaidTheme(): "dark" | "default" {
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    !window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "default";
  }
  return "dark";
}

export async function ensureMermaidInit(): Promise<void> {
  const theme = currentMermaidTheme();
  if (initTheme === theme) {
    return;
  }
  const m = (await import("mermaid")).default;
  m.initialize({
    startOnLoad: false,
    theme,
    securityLevel: "loose",
    suppressErrorRendering: true,
    fontFamily: "inherit",
  });
  initTheme = theme;
}

export async function runMermaidNodes(nodes: HTMLElement[]): Promise<void> {
  if (nodes.length === 0) {
    return;
  }
  await ensureMermaidInit();
  const m = (await import("mermaid")).default;
  await m.run({ nodes });
}
