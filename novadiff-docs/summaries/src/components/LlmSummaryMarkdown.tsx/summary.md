### Overview  
A new `src/components/LlmSummaryMarkdown.tsx` component is added to render LLM‑generated markdown with GFM support, sanitization, and inline Mermaid chart rendering.

### Key changes  
- **Imports**: added `react`, `react-markdown`, `rehype-sanitize`, `remark-gfm`, `normalizeGeneratedMarkdown`, and `runMermaidNodes`.  
- **Props interface**: `LlmSummaryMarkdownProps` now requires a `source: string`.  
- **MermaidBlock**: a memoized component that mounts a `<pre class="mermaid">` element and triggers `runMermaidNodes` in a `useEffect`.  
- **LlmSummaryMarkdownInner**: normalizes the source via `useMemo`, renders `<ReactMarkdown>` with `remarkPlugins={[remarkGfm]}` and `rehypePlugins={[rehypeSanitize]}`, and customizes `a` and `code` components. Code blocks with `language-mermaid` are replaced by `MermaidBlock`.  
- **Export**: `LlmSummaryMarkdown` is exported as `memo(LlmSummaryMarkdownInner)`.

### Impact  
- **Correctness**: Markdown is sanitized and GFM‑parsed, reducing XSS risk. Mermaid blocks are rendered client‑side.  
- **Maintainability**: All logic lives in a single component; memoization and `useMemo` keep re‑renders minimal.  
- **Performance**: `useMemo` normalizes only on source change; `memo` prevents unnecessary re‑renders.  
- **Observability**: `MermaidBlock` logs errors only if `runMermaidNodes` fails; otherwise silent.  

### Risks & follow‑ups  
- **Sanitization**: Verify `rehypeSanitize` correctly strips dangerous tags; run integration tests with malicious input.  
- **Mermaid rendering**: Ensure `runMermaidNodes` is available and handles errors; test with various chart sizes.  
- **Dependency versions**: Confirm `react-markdown`, `rehype-sanitize`, and `remark-gfm` are compatible with the current React version.  
- **Normalization**: `normalizeGeneratedMarkdown` must not alter essential markdown syntax; run unit tests on edge cases.
