# AI Fitness Design Foundation Implementation Plan

> **For agentic workers:** Execute inline in the isolated design worktree. Production UI implementation is prohibited until M0-B closes and the design branch is rebased onto the latest stable branch.

**Goal:** Establish an evidence-led cross-platform UX architecture, shared semantic design system, Figma library, representative screens, and implementation guidance without modifying M0-B-owned production files.

**Checkpoint status (2026-08-08):** Successful resumable checkpoint. Repository specifications are complete for the current checkpoint; unfinished visual representation is explicitly `PENDING FIGMA CONSTRUCTION`. The overall design foundation is not complete.

**Architecture:** The repository remains the product source of truth. Design artifacts use shared semantic foundations and components, then adapt navigation, density, gestures, and system chrome per Web, H5, iOS, Android, and Admin. Figma and Markdown are the only mutation targets during this phase.

**Tech Stack:** Figma variables/styles/components/Auto Layout; Markdown design specifications; future React/Next.js, Expo/React Native, and TypeScript mapping only after milestone gating.

## Global Constraints

- Branch: `codex/design-foundation`, based on tag `m0-a-complete` (`8051c15`).
- Do not modify the active `feature/m0-b-camera-pipeline` checkout or M0-B-owned files.
- Do not implement production UI until M0-B is closed and this branch is rebased.
- Label functionality outside M0-B as `FUTURE IMPLEMENTATION — OUTSIDE M0-B`.
- Do not invent `TBD / ADR REQUIRED` values or present design assumptions as product requirements.
- Preserve `Exercise Content != Pose Detection != Exercise Analysis != AI Coach`.
- No default raw-video upload/storage and no live LLM coaching loop.

---

### Task 1: Approve and lock design discovery

**Files:**
- Create: `docs/design/phase-0-discovery.md`

**Interfaces:**
- Consumes: SRS 0.2.0, architecture/ADRs, M0 planning/evidence, M0-B read-only evidence, blank Figma inventory.
- Produces: approved scope for tokens, components, pages, screens, and review criteria.

- [x] Review the source-of-truth map and M0-B boundary.
- [x] Approve “Measured Momentum” and refine typography to platform-native UI/body stacks with selective Manrope brand/metric roles.
- [x] Approve the exact Figma proof scope, prioritizing coherence and states over screen count.
- [x] Confirm `docs/design/` as the artifact path.

Verification: approval is recorded before any Figma foundations are created.

### Task 2: Create Figma foundations — PENDING FIGMA CONSTRUCTION

**Files:**
- Update: `docs/design/phase-0-discovery.md` with approved decisions.
- Create: `docs/design/design-system-spec.md`.

**Interfaces:**
- Consumes: approved Task 1 scope.
- Produces: Figma variable/style IDs and an implementation-neutral token specification.

- [x] Verify Figma plan support for Light/Dark variable modes; record the one-mode Starter-plan limitation and approved paired-collection fallback.
- [x] Create primitive color variables with hidden scopes and platform code syntax.
- [ ] Create identical semantic aliases in one-mode `Color — Light` and `Color — Dark` collections with explicit property scopes and parity validation.
- [ ] Create dimension and motion variables with explicit scopes or intentionally hidden scopes.
- [ ] Create typography and effect styles using verified font names.
- [ ] Validate collection counts, modes, aliases, scopes, code syntax, and contrast.
- [ ] Record every returned Figma ID in the state ledger.

Successful checkpoint note (2026-08-08): the three approved collections, 57 primitives, and the first five paired semantic roles were created and recorded. The canonical repository specifications and executable WCAG/parity validation are complete. The remaining visual representation is `PENDING FIGMA CONSTRUCTION` and resumes from `figma-state.json` only when the allowance permits.

Completed specification work:

- [x] Create `docs/design/design-system-spec.md`.
- [x] Create the deterministic 55-role semantic color contract.
- [x] Create the dimension, motion, typography, and elevation contract.
- [x] Reproduce and pass 40 Light/Dark WCAG validation cases.
- [x] Record the Figma Starter limitation as tooling-only, not production architecture.

Verification: no `ALL_SCOPES`, no broken alias, no unapproved hard-coded semantic value, and WCAG target pairs documented.

### Task 3: Create Figma file structure and foundation documentation — PENDING FIGMA CONSTRUCTION

**Files:**
- Update: `docs/design/design-system-spec.md`.

**Interfaces:**
- Consumes: Task 2 variables/styles.
- Produces: navigable Figma pages and foundation specimens.

- [ ] Create the ten approved pages with deterministic names.
- [ ] Build color, typography, spacing, grid, shape, icon, and motion documentation sections.
- [ ] Bind documentation specimens to created variables/styles.
- [ ] Capture and visually inspect each foundation section.

Verification: page names match the approved structure; specimens show Light/Dark semantics and no clipped text or overlapping content.

### Task 4: Build the initial semantic component proof set — PENDING FIGMA CONSTRUCTION

**Files:**
- Create: `docs/design/component-architecture.md`.

**Interfaces:**
- Consumes: Task 2 foundations and Task 3 page structure.
- Produces: component sets, state language, semantic APIs, platform adaptation notes.

- [ ] Build Action/Quiet Button families without a variant matrix over 30 combinations.
- [ ] Build Input/Field states.
- [ ] Build Navigation Item states.
- [ ] Build Metric, Status/Sync Badge, Workout Control, State Panel, and Camera Setup Status.
- [ ] Use Auto Layout, token bindings, text/boolean/instance-swap properties, and component descriptions.
- [ ] Validate metadata and screenshots after every component family.

Completed specification work:

- [x] Create `docs/design/component-architecture.md` with component APIs, variant limits, state semantics, accessibility behavior, token roles, and platform wrappers.

Verification: explicit default/hover-or-pressed/focus/selected/disabled/loading/error states exist where applicable, platform-inapplicable states are documented, and no repeated component is a detached one-off.

### Task 5: Create representative cross-platform screens — PENDING FIGMA CONSTRUCTION

**Files:**
- Create: `docs/design/platform-strategy.md`.
- Create: `docs/design/ux-architecture.md`.

**Interfaces:**
- Consumes: approved representative screen list and Task 4 component instances.
- Produces: Web, H5, iOS, Android, and Admin proof screens plus state coverage.

- [ ] Build Web sign-in, Today, Explore, workout builder, and history detail.
- [ ] Build H5 Today, exercise guidance, manual active set, and result/sync state.
- [ ] Build shared M0-B camera permission/setup, preview-active, and interruption/manual-fallback frames.
- [ ] Build iOS and Android Today, guidance, active Form Check, and set-result adaptations.
- [ ] Build Admin catalogue and profile/rule publication-review frames as future design preparation.
- [ ] Build an optional M2 AI-transparency example with deterministic fallback and clear generation labeling.
- [ ] Apply `FUTURE IMPLEMENTATION — OUTSIDE M0-B` labels wherever required.

Verification: each important flow includes loading, empty/error/offline/sync states as applicable; iOS and Android differences are intentional; no browser screen implies unsupported native capability.

### Task 6: Review and handoff — PENDING FIGMA CONSTRUCTION

**Files:**
- Create: `docs/design/cross-platform-review.md`.
- Create: `docs/design/accessibility-review.md`.
- Create: `docs/design/implementation-guidance.md`.
- Create: `docs/design/README.md`.

**Interfaces:**
- Consumes: all design artifacts.
- Produces: review findings, resolved high-severity issues, implementation mapping, milestone boundary, and open questions.

- [ ] Run cross-platform terminology, semantic color, type, component, icon, state, and AI-language comparison.
- [ ] Run adversarial UX review and classify HIGH/MEDIUM/LOW findings.
- [ ] Resolve every HIGH finding before marking the foundation ready.
- [ ] Run contrast, keyboard/focus, touch-target, Dynamic Type/text-scaling, reduced-motion, and non-color-state review.
- [ ] Map design semantics to future `packages/design-tokens`, `packages/ui-web`, and native component layers without creating them.
- [ ] Verify the active M0-B checkout remains unchanged by this work.
- [ ] Record the required rebase and implementation gate.

Verification: Figma screenshots and metadata pass visual/structural review, Markdown links resolve, and `git diff` in the M0-B checkout shows no design-agent modification.
