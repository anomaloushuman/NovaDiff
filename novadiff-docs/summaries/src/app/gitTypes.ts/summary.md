### Overview  
A new file `src/app/gitTypes.ts` has been added. It declares a set of TypeScript interfaces that model Git tooling status, GitHub authentication, repository and pull‑request summaries, local repo matching, blame information, status files, and publish‑related payloads and results.

### Key changes  
- **GitToolingStatus** – lines 1‑6 (R1‑R6)  
  ```ts
  export interface GitToolingStatus {
    git: { gitAvailable: boolean; gitVersion: string | null; gitError: string | null; };
    gh: GithubAuthStatus;
  }
  ```
- **GithubAuthStatus** – lines 10‑17 (R10‑R17)  
- **GithubRepoSummary** – lines 19‑28 (R19‑R28)  
- **GithubPullRequestSummary** – lines 30‑41 (R30‑R41)  
- **LocalRepoMatch** – lines 43‑47 (R43‑R47)  
- **GitBlameOwner** – lines 50‑54 (R50‑R54)  
- **GitStatusFile** – lines 64‑68 (R64‑R68)  
- **GitRepoStatus** – lines 71‑82 (R71‑R82)  
- **PrCompareRoots** – lines 84‑89 (R84‑R89)  
- **PublishPreview** – lines 91‑102 (R91‑R102)  
- **PublishExecuteResult** – lines 104‑110 (R104‑R110)  
- **PublishExecutePayload** – lines 113‑125 (R113‑R125)

### Impact  
- **Type safety** – modules that consume Git or GitHub data can import these interfaces, providing compile‑time guarantees about the shape of the data.  
- **Documentation** – the interfaces serve as living documentation for the data structures used throughout the application.  
- **Runtime** – the change adds only type declarations; no executable code is introduced, so existing JavaScript behavior is unaffected.

### Risks & follow‑ups  
- **Import consistency** – verify that modules import the correct path (`src/app/gitTypes`) and that no duplicate definitions exist.  
- **Build pipeline** – run `npm run lint`, `npm test`, and `npm run build` to ensure the new file does not introduce type errors.  
- **Documentation** – update any README or developer docs that reference GitHub or Git data structures to point to these new interfaces.
