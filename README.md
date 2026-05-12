# NovaDiff

**AI-Powered Code Folder Comparison & Intelligent Review**

Compare two codebases instantly with beautiful side-by-side diffs, semantic understanding, and AI-generated insights.

The modern, open-source alternative to WinMerge, Meld, and Beyond Compare.

![NovaDiff Hero](https://github.com/anomaloushuman/NovaDiff/blob/cf1a138540b0b7e4a203ade2f87423cf7ecb37d7/nova-diff-desktop.jpg)

## ✨ Features

- **Lightning-fast folder comparison** with tree view and powerful filters
- **Beautiful syntax-highlighted side-by-side diffs**
- **AI-Powered Insights**: Get smart summaries of changes (new features, refactors, bug fixes, etc.)
- **Semantic diffing** — understands moved code, renamed variables, and logical changes
- **Smart change categorization** and prioritization
- **AI Review Comments** — automated suggestions and potential issue detection
- **Merge assistance** with intelligent conflict hints
- **Ignore patterns**, `.gitignore` support, and custom rules
- **Modern, dark-first UI** that feels native

## Roadmap

- [x] Core two-folder comparison engine
- [ ] Local LLM support (Ollama / LM Studio)
- [ ] Git integration (`git difftool --dir-diff`)
- [ ] 3-way merge view
- [ ] VS Code extension
- [ ] Self-hosted web version

## Quick Start

```bash
git clone https://github.com/yourusername/novadiff.git
cd novadiff
npm install
npm run dev
```
## Tech Stack

- Frontend: Tauri + React + TypeScript + shadcn/ui
- Backend: Rust (high-performance diffing)
- AI Layer: OpenAI / Groq / Anthropic or local models via Ollama
- Diff & Parsing: Custom engine + Tree-sitter for semantic awareness

## Why NovaDiff?
Classic diff tools are outdated. NovaDiff brings intelligence and clarity to code reviews — helping you understand not just what changed, but why and how it matters.

## Contributing
Contributions are welcome! Please see CONTRIBUTING.md for details.

## License
MIT License

Made with ❤️ for developers who want faster and smarter code reviews.