# AI Fitness Design Foundation

This directory is the approved home for design discovery, specifications, decisions, and implementation guidance while M0-B is active on a separate branch.

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

Production UI implementation remains blocked until M0-B is closed, `codex/design-foundation` is rebased onto the latest stable branch, conflicts are reviewed, and the relevant future milestone is active.

All post-M0-B behavior remains **FUTURE IMPLEMENTATION — OUTSIDE M0-B**.
