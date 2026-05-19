### Overview  
The `WelcomeScreen` component now accepts an optional `cachedGitUser` prop.  
- `WelcomeScreenProps` gains `cachedGitUser?: GitUserProfile | null` (see `L6`).  
- The component signature changes to `WelcomeScreen({ cachedGitUser, onComplete, onLocalOnly })` (`R11`).  
- The `refresh` callback now lists `cachedGitUser?.login` in its dependency array (`R67`).  
- After fetching users, the logic first checks if `cachedGitUser` matches a detected account and selects it; otherwise it falls back to the first user (`R56‑R58`).  

### Key changes  
- **Prop addition** – `cachedGitUser` added to `WelcomeScreenProps` (`L6`).  
- **Signature update** – component now receives `{ cachedGitUser, onComplete, onLocalOnly }` (`R11`).  
- **Dependency update** – `refresh` depends on `cachedGitUser?.login` (`R67`).  
- **Selection logic** – auto‑select cached user if present (`R56‑R58`).  
- **UI changes** –  
  - Removed the old “Continue as @login” button block (`L363‑L384`).  
  - New continue button text shows “Use a different account” when a cached user exists, otherwise “Continue with GitHub” (`R397`).  
  - Button disabled state now uses `selected` instead of `cachedGitUser` (`R388`).  

### Impact  
- **User experience** – Cached accounts are pre‑selected, reducing friction.  
- **API contract** – Callers must provide `cachedGitUser` or handle its absence; omitting it may lead to default `undefined` behavior.  
- **UI clarity** – Button text and disabled state reflect the presence of a cached user.  

### Risks & follow‑ups  
1. **Missing prop** – Verify that all imports of `WelcomeScreen` supply `cachedGitUser`; otherwise the component defaults to `undefined`.  
2. **Selection edge case** – Ensure that when `cachedGitUser` is not in the detected list, the fallback still selects the first user (`R58`).  
3. **Dependency array** – Confirm that adding `cachedGitUser?.login` to `refresh`’s deps triggers a refresh when the cached user changes (`R67`).  
4. **UI regression** – Run visual tests to validate the new button text and disabled state (`R397`, `R388`).
