# Contributing to NovaDiff

Thank you for considering contributing to NovaDiff! 🎉

We welcome contributions of all kinds — bug reports, feature requests, documentation improvements, and code contributions.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md) (be respectful, inclusive, and constructive).

## How to Contribute

### 1. Reporting Bugs or Suggesting Features

- Please search existing [Issues](https://github.com/yourusername/novadiff/issues) first.
- Use the appropriate issue template (Bug Report or Feature Request).
- Provide as much detail as possible (screenshots, steps to reproduce, OS version, etc.).

### 2. Development Setup

# 1. Fork & clone the repository
```bash
git clone https://github.com/yourusername/novadiff.git
cd novadiff
```
# 2. Install dependencies
```bash
npm install
```

# 3. Install Rust (stable) if needed: https://rustup.rs/

# 4. Run the desktop app (builds Rust CLI, then Vite + Electron)
```bash
npm run electron:dev
```

# Project Structure
novadiff/
├── src/                    # React + TypeScript UI
├── electron/               # Electron main + preload (spawns `novadiff-cli`)
├── cli/                    # Rust `novadiff-cli` (folder scan + file diff)
├── public/
└── docs/


### 3. Submitting Pull Requests

- Create a new branch for your feature: ```git checkout -b feature/amazing-feature```
or
- ```git checkout -b fix/bug-description```

Make your changes following the coding guidelines below.

Test your changes thoroughly.

Commit your changes using Conventional Commits:textfeat: add semantic diff summary (examples)
fix: correct file tree rendering
docs: update installation instructions

Push to your fork and open a Pull Request.

# Coding Guidelines

- Frontend: TypeScript + ESLint + Prettier (configured)
- Rust: Follow standard Rust style (cargo fmt)
- Use meaningful variable and function names
- Keep components small and focused
- Add comments for complex logic

# Testing
# Run tests
```npm test```

# Run Rust CLI tests (if any)
```cargo test --manifest-path cli/Cargo.toml```

# AI / LLM Related Contributions
When working on AI features:
- Keep prompts modular and easy to customize
- Support multiple providers (OpenAI, Groq, Ollama, etc.)
- Prioritize local/privacy-first options

# Development Priorities (Current)
- Improving diff performance on large repositories
- Better semantic understanding using Tree-sitter
- Local LLM integration (Ollama)
- Polish UI/UX

# Questions?
Feel free to:
- Open a Discussion
- Ask in PR comments
- Reach out on social media (if we set up a channel)


Thank you for helping make NovaDiff better! ❤️
Your contributions make this project valuable for thousands of developers.