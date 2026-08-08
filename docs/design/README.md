# AI Fitness Design Foundation

This directory is the approved home for design discovery, specifications, decisions, and implementation guidance. M0-B is merged into stable `main`; the independent M0-C workstream remains outside this design branch.

**Checkpoint:** `DESIGN FOUNDATION — PAUSED AT SAFE FIGMA CHECKPOINT`. Repository contracts are complete for the current checkpoint; the overall design foundation remains in progress and unfinished visual work is `PENDING FIGMA CONSTRUCTION`.

## Artifacts

- [Phase 0 discovery](./phase-0-discovery.md) — approved scope, platform architecture, and milestone boundary.
- [Design system specification](./design-system-spec.md) — color, typography, spacing, shape, motion, accessibility, and implementation notes.
- [Semantic color contract](./semantic-color-contract.json) — canonical Light/Dark aliases and shared semantic hierarchy.
- [Foundation token contract](./foundation-token-contract.json) — dimension, motion, typography, and elevation definitions.
- [Component architecture](./component-architecture.md) — core component APIs, states, token bindings, and platform wrappers.
- [Figma state ledger](./figma-state.json) — exact resumable collection, variable, style, page, and component IDs.
- [Design contract validator](./validate-design-contract.mjs) — local parity, scope, naming, primitive-reference, and WCAG contrast checks.

Run validation from the repository root:

```powershell
node docs/design/validate-design-contract.mjs
```

## Figma tooling note

The current Starter plan requires `Color — Light` and `Color — Dark` to be separate one-mode collections. They are representations of one semantic contract and must be generated together from `semantic-color-contract.json`.

This is not the production theme architecture. Production remains:

`semantic color tokens → theme-specific values → platform implementation`

## Implementation gate

The M0-B closure and stable-main synchronization prerequisites are satisfied. Production UI implementation remains blocked until the design foundation passes its accessibility, cross-platform consistency, and adversarial UX review gate and an implementation milestone is explicitly authorized.

Any design exploration that depends on M0-C remains **FUTURE IMPLEMENTATION — OUTSIDE CURRENT STABLE BASELINE**. Do not checkout, modify, cherry-pick, or depend on the active M0-C branch from this workstream.
