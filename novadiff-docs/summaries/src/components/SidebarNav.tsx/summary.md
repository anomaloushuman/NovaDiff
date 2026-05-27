### Overview  
`src/components/SidebarNav.tsx` was refactored to replace the legacy *compact* mode with a new `expand` prop that drives panel state.  
- The file now imports `useEffect`, `useRef`, `UseSidebarExpandResult`, and `usePrefersReducedMotion` (lines R1‑R17).  
- A new `SidebarTypedLabel` component (lines 58‑119) replaces inline typewriter logic and respects reduced‑motion settings.  
- `SidebarExpandProps` is exported as a `Pick` of `UseSidebarExpandResult` fields (lines R7‑R16).  
- `SidebarNavProps` no longer accepts `compact`; it now requires `expand: SidebarExpandProps` (lines 40‑57).  
- `NavLink` props were updated: `compact` removed, `collapsed`, `showSlot`, `typingActive`, `erasingActive`, and `labelDelay` added (lines 120‑139).  
- Icon handling was unified: `iconProps` removed; `navIcon` (size 18) and `featureIcon` (size 16) constants introduced (lines 54‑56).  
- All compact‑specific class names and markup blocks were removed (e.g., `sidebar--compact`, `sidebar-brand--compact`, `sidebar-feature--compact`, etc., lines 40‑41, 55‑56, 58‑59).  
- Launch‑brand logic now uses `useLaunch`’s `skipSequence` and `panelExpanded` from `expand`, with a `useRef`/`useEffect` timeout of 4 s (lines 186‑210).  

### Key changes  
- **Imports & exports**: added `useEffect`, `useRef`, `UseSidebarExpandResult`, `usePrefersReducedMotion`; exported `SidebarExpandProps`.  
- **Props**: `SidebarNavProps` now requires `expand`; `NavLink` uses `collapsed`, `showSlot`, `typingActive`, `erasingActive`, `labelDelay`.  
- **State handling**: panel state derived from `expand`; launch‑brand animation controlled via `useRef`/`useEffect`.  
- **Icon logic**: replaced `iconProps` with `navIcon`/`featureIcon`.  
- **UI**: all compact‑specific markup replaced with `collapsed`/`showSlot` and `SidebarTypedLabel`.  
- **Accessibility**: `SidebarTypedLabel` falls back to plain text when `usePrefersReducedMotion` is true.  

### Impact  
- Callers must supply the new `expand` prop; otherwise the component will error.  
- Removed duplicated compact logic reduces future maintenance.  
- `SidebarTypedLabel` may instantiate many `TypewriterText` components; keep the number of labels reasonable.  
- The 4 s launch‑brand timeout is now managed by a ref; verify its behavior.  

### Risks & follow‑ups  
1. **Missing `expand` prop** – ensure all usages of `SidebarNav` pass it.  
2. **Icon rendering** – confirm `navIcon`/`featureIcon` sizes match design expectations.  
3. **Reduced motion fallback** – test with OS reduced‑motion settings to verify static text rendering.  
4. **Brand animation** – validate the 4 s timeout and `launchBrandPendingRef` logic still shows the brand correctly after launch.
