### Overview  
`packages/graph-view/src/index.css` now defines legacy gold color aliases, hides the noise‑grain overlay for NovaDiff embeds, and removes several React‑Flow styling rules that were previously applied only in the embedded context.

### Key changes  
- **Gold aliases** added at lines 15‑18:  
  ```css
  --color-gold: var(--color-accent);
  --color-gold-dim: var(--color-accent-dim);
  --color-gold-bright: var(--color-accent-bright);
  ```  
- **Noise overlay** for embeds is now hidden: the comment at line 125 is replaced by a new comment at line 130, and the `.novadiff-graph-embed.noise-overlay::before` block (lines 126‑128) is removed and replaced with `display: none` at line 132.  
- **React‑Flow canvas overrides**: the comment at line 253 (“Override React Flow dark theme”) is removed, and a new comment at line 265 (“Override React Flow canvas”) is added.  
- **Embedded‑specific React‑Flow styles** (background pattern, edges, node container, controls, minimap) are all removed (lines 270‑315).  

### Impact  
- Embedded graphs no longer show film‑grain noise, matching the host’s clean surface.  
- Removing unused React‑Flow rules for embeds reduces stylesheet size and selector conflicts.  
- Gold aliases centralize color mapping, easing future theme updates.  

### Risks & follow‑ups  
- Verify that the hidden noise overlay does not break any legacy tests that expect the overlay in embedded mode.  
- Ensure that removing React‑Flow edge/background styles does not affect edge visibility or interaction in the embedded explorer.  
- Run the `graph-view` smoke test in NovaDiff to confirm that the new gold aliases render correctly.  
- Check that the new comment for “Override React Flow canvas” does not conflict with future canvas‑specific overrides.
