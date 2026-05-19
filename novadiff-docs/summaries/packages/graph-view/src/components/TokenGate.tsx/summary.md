### Overview
A new `TokenGate` component is added at `packages/graph-view/src/components/TokenGate.tsx` (lines R1‑R79). It renders a full‑screen form that prompts the user for an access token, validates it via a fetch call, and invokes a callback on success.

### Key changes
- **Import**: `useState` from `react` (R1).  
- **Props interface**: `TokenGateProps` with `onTokenValid: (token: string) => void` (R3‑R5).  
- **Export**: `export default function TokenGate({ onTokenValid }: TokenGateProps)` (R7).  
- **State hooks**: `input`, `error`, and `loading` initialized with `useState` (R8‑R10).  
- **Submit handler**: `handleSubmit` performs `fetch('/knowledge-graph.json?token=…')`, handles 200, 403, and other responses, and updates state (R12‑R35).  
- **UI**: Centered form with an input, error message, and a submit button that disables when `loading` or `input` is empty (R38‑R75).

### Impact
- The component enforces token validation before proceeding; the `onTokenValid` callback is called on a 200 response (R23).  
- Logic is encapsulated in a single file; the interface makes the contract explicit.  
- Uses minimal state and a single network request; no heavy rendering.

### Risks & follow‑ups
- Verify that `/knowledge-graph.json` accepts the token query param and returns the expected status codes (unknown from the available diff/scan evidence).  
- Ensure the `onTokenValid` callback is wired correctly in the parent component to transition to the main view (unknown from the available diff/scan evidence).  
- Test the disabled state of the submit button when `loading` or `input` is empty (R70).  
- Confirm that error messages are accessible and match the design spec (unknown from the available diff/scan evidence).
