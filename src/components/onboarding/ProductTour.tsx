import { useCallback, useState } from "react";
import { saveProductTourCompleted } from "../../app/workspaceStorage";

const STEPS = [
  {
    title: "Compare folders",
    body: "Pick baseline and target trees to see path-level diffs and AI summaries.",
  },
  {
    title: "Documentation & knowledge graph",
    body: "Open Documentation to explore the code knowledge graph — structure, imports, and calls.",
  },
  {
    title: "3D Code City",
    body: "Scroll to Code City, enable Link views, and click buildings to sync with the graph.",
  },
  {
    title: "Publish with review",
    body: "Use Auto-commit & publish to generate semantic messages and stage districts before you push.",
  },
] as const;

export function ProductTour({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const finish = useCallback(() => {
    saveProductTourCompleted();
    onDone();
  }, [onDone]);

  return (
    <div className="product-tour-overlay" role="dialog" aria-modal="true" aria-label="Product tour">
      <div className="product-tour-card">
        <p className="product-tour-kicker">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2 className="product-tour-title">{current.title}</h2>
        <p className="product-tour-body">{current.body}</p>
        <div className="product-tour-actions">
          <button type="button" className="doc-workspace-copy-btn" onClick={finish}>
            Skip tour
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              className="doc-workspace-copy-btn doc-workspace-copy-btn--primary"
              onClick={() => setStep((s) => s + 1)}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="doc-workspace-copy-btn doc-workspace-copy-btn--primary"
              onClick={finish}
            >
              Get started
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
