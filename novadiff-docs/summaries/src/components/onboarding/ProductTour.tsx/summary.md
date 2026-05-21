### Overview  
A new onboarding component `ProductTour` was added at `src/components/onboarding/ProductTour.tsx` (lines 1‑65). It renders a dialog overlay that walks the user through four instructional steps and records completion.

### Key changes  
- **Imports** – added `useCallback` and `useState` from `react` (line 1) and `saveProductTourCompleted` from `../../app/workspaceStorage` (line 2).  
- **Export** – `export function ProductTour({ onDone }: { onDone: () => void })` (line 23).  
- **State** – `const [step, setStep] = useState(0)` and `const current = STEPS[step]` (lines 24‑25).  
- **Finish logic** – `const finish = useCallback(() => { saveProductTourCompleted(); onDone(); }, [onDone]);` (lines 27‑30).  
- **UI** – dialog overlay with `role="dialog" aria-modal="true" aria-label="Product tour"`, step counter, title, body, and buttons: “Skip tour”, “Next”, or “Get started” (lines 32‑63).  
- **Steps** – `const STEPS = [...] as const;` defines four steps: “Compare folders”, “Documentation & knowledge graph”, “3D Code City”, “Publish with review” (lines 4‑21).

### Impact  
The component introduces a new user flow that persists completion via `saveProductTourCompleted` and signals the parent through the required `onDone` callback. It adds minimal runtime overhead: a single state variable and a few re-renders per step. No new external APIs are invoked beyond the existing storage helper.

### Risks & follow‑ups  
- **Missing CSS** – classes `product-tour-overlay`, `product-tour-card`, etc., are referenced but not defined in this diff.  
- **Callback requirement** – `onDone` is mandatory; callers must provide a function.  
- **Side‑effect reliability** – verify that `saveProductTourCompleted` writes correctly and is called once per finish.  
- **Accessibility** – the dialog uses ARIA attributes; confirm focus trapping and screen‑reader announcements.  
- **Telemetry** – no analytics are emitted; consider adding logging if needed.
