### Overview  
A new file, `CONTRIBUTIONS.md`, has been added to the repository root. The file spans lines 1‑98 and introduces a structured guide for contributors.

### Key changes  
- **File addition**: `CONTRIBUTIONS.md` (lines 1‑98).  
- **Content**: Sections added at the following diff lines:  
  - R1: `# Contributing to NovaDiff`  
  - R3: `Thank you for considering contributing to NovaDiff! 🎉`  
  - R5: `We welcome contributions of all kinds …`  
  - R7: `## Code of Conduct`  
  - R9: `By participating … [Code of Conduct](CODE_OF_CONDUCT.md)`  
  - R11: `## How to Contribute`  
  - Subsequent sections cover bug reporting, development setup, project structure, pull‑request workflow, coding guidelines, testing, AI/LLM contributions, current priorities, and a closing thank‑you.  
- **Links**: References to `CODE_OF_CONDUCT.md`, the GitHub issues page, and the Rust installation guide (`https://rustup.rs/`).  
- **Formatting**: Markdown with fenced code blocks for Git commands and installation steps.

### Impact  
- **Documentation**: Provides a single, centralized location for contribution guidelines, improving onboarding.  
- **Runtime**: No code or build changes; the addition is purely informational.  
- **CI/CD**: If the project lints or builds documentation, the new file will be included automatically.

### Risks & follow‑ups  
- **README linkage**: Verify that the README or other docs reference `CONTRIBUTIONS.md` so contributors can find it.  
- **Markdown linting**: It is unknown from the diff whether the repository runs markdown linting; run `npm run lint:md` if available.  
- **Link validity**: Check that the URLs to `CODE_OF_CONDUCT.md` and the GitHub issues page resolve correctly.  
- **Future maintenance**: Monitor for required updates when major project changes occur (e.g., new build steps or tooling).
