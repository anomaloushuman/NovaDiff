### Overview  
The `README.md` was updated to reflect new feature bullets, a revised roadmap, and clearer prerequisites. No code‑level changes were made.

### Key changes  
- **Documentation workspace** and **Git & GitHub** bullets added at lines 22‑23 (diff lines R22, R23).  
- Old Git integration bullet (`git difftool --dir-diff`) removed at line 27; new bullet covering status, publish, PR compare via worktrees, and GitHub CLI added at line 29 (diff lines L27, R29).  
- Prerequisites expanded to include `Git` and optional `GitHub CLI` at lines 34‑36 (diff lines L34, R36).  
- Note that the first graph build compiles the in‑repo engine (`npm run graph:build` runs automatically before `npm run build` / `electron:dev`) inserted at lines 51‑52 (diff lines R51‑52).  
- Reference to `THIRD_PARTY_NOTICES.md` added at lines 70‑71 (diff lines R70‑71).

### Impact  
- Documentation now matches the current feature set, reducing user confusion.  
- Roadmap and prerequisites are accurate for contributors.  
- No runtime or API changes; the build process remains unchanged.

### Risks & follow‑ups  
- Verify that the new Git integration features are fully implemented elsewhere (unknown from the available diff).  
- Confirm that `npm run graph:build` indeed runs before `electron:dev` as described (unknown from the available diff).  
- Ensure `THIRD_PARTY_NOTICES.md` exists and contains correct attributions (unknown from the available diff).  
- Check that the removed `git difftool --dir-diff` bullet does not appear in other documentation.
