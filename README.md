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
- **Documentation workspace** with per-file AI summaries, risk signals, 3D code city, and a built-in **code knowledge graph** (Tree-sitter structure extraction, interactive explorer, compare overlay)
- **Git & GitHub** — `gh` auth detection, local clone discovery (macOS / Windows / Linux), pull request list & compare, human-in-the-loop **auto-commit** with optional push and PR creation

## Roadmap

- [x] Core two-folder comparison engine
- [x] Local LLM support (Ollama / LM Studio) — per-file summaries (Settings + Summary tab)
- [x] Git integration (status, publish, PR compare via worktrees, GitHub CLI)
- [ ] 3-way merge view
- [ ] VS Code extension
- [ ] Self-hosted web version

## Quick Start

Prerequisites: [Node.js](https://nodejs.org/) (LTS), [Rust](https://rustup.rs/) (stable), [Git](https://git-scm.com/), and optionally [GitHub CLI](https://cli.github.com/) (`gh auth login`) for pull requests and auto-publish.

```bash
git clone https://github.com/yourusername/NovaDiff.git
cd NovaDiff
npm install
npm run electron:dev
```

(`electron:dev` builds the Rust CLI once, then starts Vite + Electron.)

For the Vite dev server only (no Electron shell): `npm run dev`.

Release build: `npm run electron:build` (builds the `novadiff-cli` binary, then Vite + installers under `release/`).

First graph build compiles the in-repo engine (`npm run graph:build` runs automatically before `npm run build` / `electron:dev`).

## Tech Stack

- Shell: Electron + React + TypeScript
- Comparison engine: Rust CLI (`novadiff-cli`, Rayon-parallel hashing) + Electron UI
- Local review: Ollama (`/api/chat`) or LM Studio OpenAI-compatible (`/v1/chat/completions`); GPU/Metal via those servers
- AI Layer: OpenAI / Groq / Anthropic or local models via Ollama
- Diff & Parsing: Custom engine + Tree-sitter for semantic awareness

## Why NovaDiff?
Classic diff tools are outdated. NovaDiff brings intelligence and clarity to code reviews — helping you understand not just what changed, but why and how it matters.

## Contributing
Contributions are welcome! Please see [CONTRIBUTIONS.md](CONTRIBUTIONS.md) for details.

## License
MIT License

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for open-source attributions.

Made with ❤️ for developers who want faster and smarter code reviews.