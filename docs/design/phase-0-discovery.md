# AI Fitness Design Foundation — Phase 0 Discovery

**Status:** Approved with typography and accessibility refinements on 2026-08-08
**Design branch:** `codex/design-foundation`
**Baseline:** `m0-a-complete` (`8051c15`)
**Figma:** [AI Fitness — Product Design System](https://www.figma.com/design/YjKfAowet2M4zdzQds8jEH)

## Source-of-truth order

1. Approved ADRs and regulatory obligations.
2. `docs/SRS.md` version 0.2.0.
3. Versioned contracts and pose-profile schemas when they exist.
4. Approved design specifications.
5. Backlog and future recommendations.

The current production UI is an M0 technical shell, not an approved product design system. Its dark navy palette is evidence of the current prototype direction, but its hard-coded values are not treated as canonical tokens.

## Product problem and users

The product helps an adult exerciser understand what to do next, perform an exercise with low friction, and receive explainable, privacy-preserving movement feedback. It is not a medical, diagnostic, rehabilitation, or injury-prevention product.

Documented users:

- Guided beginner: needs confidence, plain language, and restrained cues.
- Independent exerciser: needs fast workout execution and offline resilience.
- Technique-focused user: needs transparent evidence and version-aware trends.
- Content editor and exercise-analysis author: need safe, reviewable publication workflows.
- Support/admin operator: needs least-privilege operational context without raw camera content.
- Product/data analyst: needs privacy-safe aggregate signals.

## Evidence-led UX architecture

### Consumer mobile (M1 product target)

Primary navigation is `Today`, `Explore`, `Coach`, `History`, and `Profile`. `Coach` means deterministic guidance/Form Check in M1, not generative AI. The camera flow is contextual and never required to complete a workout.

Core path:

`Today → workout/exercise → guidance → manual or Form Check → setup → countdown → active set → set result → local completion → sync/history`

### Authenticated web (M1 product target)

Desktop navigation covers `Today`, `Explore`, `Workouts`, `History`, and `Profile/Settings`. Web supports discovery, guidance, workout building, manual tracking, and history. Browser camera Form Check remains future work.

### H5/mobile web

H5 uses the web contract and mobile content priority, but does not imply native camera, haptics, background execution, or secure-storage capabilities. It supports guidance and manual workout execution first.

### Admin (M2 narrow/V1 target)

Admin is a dense desktop productivity surface for catalogue/content, licence/media status, profile/rule review, feature flags, support, and audit. Full Admin is outside M0/M1.

## M0-B boundary

### M0-B relevant — design specification only

- Contextual camera-purpose explanation.
- Camera permission loading, request, denial, and restricted states.
- Explicit setup gate before preview activation.
- Preview inactive and preview active states.
- Background/interruption recovery.
- Manual fallback that preserves the set.
- Large, accessible primary action and readable status.

These designs must not change `apps/mobile/App.tsx`, `apps/mobile/app.json`, `apps/mobile/package.json`, `apps/mobile/src/camera/**`, `docs/evidence/M0-B.md`, or `pnpm-lock.yaml` during parallel M0-B work.

### Future implementation — outside M0-B

- Product navigation, authentication, Today, Explore, workout builder, history, progress, and profile.
- Positioning, calibration, countdown, skeleton overlay, rep counting, form cues, and set scoring beyond the camera-pipeline boundary.
- Web, H5, Admin, backend, sync, analytics, and AI Coach implementation.

### Production UI implementation gate

Production UI work starts only after M0-B is closed, this branch is rebased onto the latest stable branch, conflicts are reviewed, and the relevant future milestone is active.

## Approved visual direction

**Working concept: “Measured Momentum.”** The system uses deep mineral ink surfaces, cadence teal for primary action/progress, and a restrained warm pulse accent for moments requiring attention. The identity comes from typography, metric clarity, spacing, and motion discipline rather than gradients, glass, glow, robot imagery, or decorative AI symbols.

- Shared typography is defined by semantic hierarchy and intent, not identical rendering across platforms.
- Manrope is reserved for brand expression, selected headings, and important fitness/metric presentation where it adds value.
- Web/H5/Admin use the platform `system-ui` stack for general body and control text, with selective Manrope display/metric roles.
- iOS uses the native SF system typography stack with Dynamic Type mappings for general body and control text; Manrope remains optional and selective for branded display/metric roles.
- Android uses the native Android/Roboto system typography stack for general body and control text; a custom font requires a documented UX reason.
- Light and dark modes share semantic roles, not duplicated per-screen colors.
- Active workout layouts prioritize one-handed access, coaching-distance legibility, and one primary corrective cue.

## Proposed foundation scope

### Variable collections

- `Primitives` — one value mode; neutral, cadence teal, pulse orange, red, amber, blue, green.
- `Color — Light` and `Color — Dark` — one mode each because the current Figma Starter plan permits only one mode per collection. Both collections expose the exact same semantic names and hierarchy and are maintained as two representations of one semantic contract.
- `Dimension` — spacing, radius, border width, target size, icon size, gutters, and content widths.
- `Motion` — duration and documented easing references; reduced-motion behavior remains explicit in component notes.

The split color collections are a **Figma Starter-plan tooling limitation**, not the production architecture. The intended implementation remains `semantic color tokens → theme-specific values → platform implementation`. Web, H5, React Native, and Admin must use a proper theme/token abstraction after M0-B closes and must not reproduce the two-collection workaround literally.

### Typography styles

- Display, H1, H2, H3, Title, Body, Body Secondary, Label, Caption.
- Metric Hero, Metric Large, Metric Medium.
- Native iOS and Android mappings documented separately where system typography differs.

### Initial component proof set

- Action Button and Quiet Button families with explicit states.
- Input/Field with focus, error, disabled, and loading states.
- Navigation Item with selected, unselected, focus/pressed, and disabled states.
- Metric with neutral/status presentations and tabular numerals.
- Status/Sync Badge with icon plus text; never color-only.
- Workout Control with large target sizes and icon-swap semantics.
- State Panel for loading, empty, offline, error, success, and sync-pending states.
- Camera Setup Status for the M0-B permission/preview/interruption/manual-fallback state language.

## Proposed Figma pages

1. `00 Cover & Handoff`
2. `00 Foundations`
3. `01 Components`
4. `02 Web`
5. `03 H5`
6. `04 Mobile — Shared`
7. `04 Mobile — iOS`
8. `04 Mobile — Android`
9. `05 Admin`
10. `06 Flows & Prototypes`

## Representative screen scope

### Web

- Sign in: default, loading, validation error.
- Today: one start/resume action and recent history.
- Explore: search/filter and explicit `AI Form Check` vs `Guide Only` status.
- Workout builder: ordered sections, exercises, sets, and save state.
- History detail: deterministic result and actionable sync error.

### H5

- Today.
- Exercise guidance.
- Manual active set.
- Set result with sync pending/offline state.

### Mobile shared/iOS/Android

- Camera permission/setup state matrix — M0-B relevant, design-only.
- Camera preview active — M0-B relevant, design-only.
- Camera interrupted/manual fallback — M0-B relevant, design-only.
- Today.
- Exercise guidance.
- Active Form Check with one cue and large metrics — future beyond M0-B.
- Set result with coverage caveat and deterministic summary — future beyond M0-B.

Native differences are intentional: iOS uses safe areas, system tab/navigation/sheet behavior and Dynamic Type; Android uses edge-to-edge system bar handling, platform back behavior, Material touch feedback, and adaptive navigation.

### Admin

- Exercise catalogue/content table.
- Profile/rule review and immutable publication gate.

Both are future design preparation outside M0-B.

### AI transparency pattern

One optional M2 post-workout summary example will distinguish deterministic workout facts from AI-generated copy, label generation clearly, expose uncertainty/limits, and retain a deterministic fallback. It is not a live coaching or M0/M1 implementation requirement.

## Responsive rules

These are design transformation bands, not the unresolved supported-device/browser matrix:

| Band | Reference width | Layout behavior |
| --- | ---: | --- |
| Compact mobile | 320–479 | Single column, 16 px gutters, priority content only, bottom navigation where appropriate |
| Standard mobile | 480–767 | Single column, 20–24 px gutters, limited side-by-side controls |
| Tablet | 768–1023 | 8-column layout, 32 px gutters, split views and navigation rail/sidebar where platform-appropriate |
| Laptop | 1024–1439 | 12-column layout, persistent sidebar, 40 px gutters |
| Desktop | 1440–1919 | 12-column layout, 48 px gutters, 1280 px primary content maximum |
| Wide desktop | 1920+ | 12-column layout, 1440 px maximum, additional whitespace instead of uncontrolled stretching |

## Accessibility constraints

- WCAG 2.2 AA target for web/H5/Admin.
- Minimum text contrast 4.5:1 and large text 3:1; meaningful non-text UI 3:1.
- Visible focus, logical keyboard order, no hover-only information.
- 44×44 pt minimum iOS hit region and 48×48 dp minimum Android target; active-workout controls exceed the platform minimum where practical.
- Dynamic Type/font scaling without hiding workout controls or critical feedback.
- Status always uses text/icon/shape in addition to color.
- Semantic text, disabled, border, status, chart/metric, selected, focus, and interactive-control combinations are explicitly measured in both Light and Dark modes before palette lock.
- Accent and status hues never carry meaning alone; labels, icons, shapes, patterns, or state changes provide a second cue.
- Reduced motion removes non-essential transforms and preserves immediate feedback.
- Camera setup has text/visual guidance and accessible announcements; skeleton is supplementary.

## Existing versus planned gap analysis

### Codebase-only

- Dark technical shell with hard-coded colors and type.
- M0-B camera state machine and prototype screen owned by the parallel branch.
- No semantic token source, reusable UI component library, production navigation, or responsive product UI.

### Figma-only/reusable libraries

- Apple iOS/iPadOS 26 kit is available for native system chrome and behavioral reference.
- Material 3 kit is available for Android navigation, app bars, system bars, and native control reference.
- Simple Design System is available as a component-architecture reference.

### Resolution

- Build local AI Fitness foundations and semantic components.
- Reuse/import platform kits only for native chrome and specification reference; do not adopt their visual identity as the product brand.
- Do not map Figma components to production code yet because no stable UI component source exists and M0-B is still active.

## Approval record

- “Measured Momentum” is the approved working visual direction.
- The Phase 1–4 Figma scope is approved, with coherence and state coverage prioritized over screen count.
- `docs/design/` is the approved persistent artifact location.
- Production UI implementation remains blocked until M0-B is closed and this design branch is rebased onto the latest stable branch.
