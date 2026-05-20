### Overview  
A new `README.md` file (lines R1‑R72) has been added to the repository. It introduces NovaDiff, lists its features, roadmap, quick‑start instructions, and technical stack.

### Key changes  
- **File addition**: `README.md` now exists in the root.  
- **Header & branding**: `# NovaDiff` (R1) and tagline **AI‑Powered Code Folder Comparison & Intelligent Review** (R3).  
- **Hero image**: `![NovaDiff Hero](https://github.com/anomaloushuman/NovaDiff/blob/cf1a138540b0b7e4a203ade2f87423cf7ecb37d7/nova-diff-desktop.jpg)` (R9).  
- **Feature list** (R13‑R22):  
  - Lightning‑fast folder comparison  
  - Beautiful syntax‑highlighted side‑by‑side diffs  
  - AI‑Powered Insights and smart summaries  
  - Semantic diffing (moved code, renamed variables)  
  - Smart change categorization & prioritization  
  - AI Review Comments and merge assistance  
  - Ignore patterns, `.gitignore` support, custom rules  
  - Modern dark‑first UI  
  - Documentation workspace with per‑file AI summaries and code knowledge graph  
  - Git & GitHub integration (auth detection, PR compare, auto‑commit)  
- **Roadmap** (R25‑R32): completed core engine, LLM support, Git integration; pending 3‑way merge view, VS Code extension, self‑hosted web.  
- **Quick start** (R34‑R51): prerequisites (Node.js, Rust, Git, optional GitHub CLI) and commands for cloning, dev, and release builds.  
- **Tech stack** (R53‑R60): Electron + React + TypeScript UI, Rust CLI engine, local review via Ollama/LM Studio, AI layer options, Tree‑sitter parsing.  
- **License & contributions** (R64‑R68): MIT license notice and link to `CONTRIBUTIONS.md`.

### Impact  
- Adds onboarding documentation for new users and contributors.  
- Includes the README in CI artifacts; scripts referencing an old README may need updating.  
- Contains keywords that improve repository discoverability (e.g., “semantic diffing”, “AI‑Powered Insights”).

### Risks & follow‑ups  
- **Broken links**: Verify URLs for the hero image, Node.js, Rust, and GitHub CLI.  
- **License compliance**: Ensure the MIT license text matches repository policy.  
- **CI documentation**: Confirm that CI pipelines include the new README in generated docs.
