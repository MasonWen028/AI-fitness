# AI Fitness Design System Specification

**Working direction:** Measured Momentum
**Status:** Successful resumable specification checkpoint; overall design foundation remains in progress
**Design branch:** `codex/design-foundation`
**Figma:** [AI Fitness — Product Design System](https://www.figma.com/design/YjKfAowet2M4zdzQds8jEH)
**Stable baseline:** `origin/main` at `0a425b25e8f1c124d4b89964ac722a7c3ca37cb7`, including merged M0-B and the prior design checkpoint
**Implementation gate:** The M0-B closure/synchronization prerequisite is satisfied. Production UI work remains blocked until the design foundation passes its own review gate and an implementation milestone is explicitly authorized.

## Stable-baseline reconciliation

### M0-B IMPLEMENTED BEHAVIOUR

M0-B establishes a tested camera lifecycle reducer and technical mobile shell: passive permission updates do not mount the preview, setup/start is explicit, active preview interruption is preserved, permission revocation unmounts preview, and manual fallback remains available. The merged implementation is intentionally milestone-scoped; its hard-coded dark UI, native default controls, technical copy, generic camera-purpose string, and action presentation are not design tokens or reusable component precedent.

Physical-device behavior remains unverified in the M0-B evidence for system prompts, blocked permissions, live preview, background interruption, mount failure, and iOS native execution.

### DESIGN RECOMMENDATION FOR FUTURE IMPLEMENTATION

**FUTURE IMPLEMENTATION — OUTSIDE CURRENT STABLE BASELINE.** Product UI should preserve the explicit setup and fallback invariants while adding contextual camera-purpose explanation, deliberate primary/secondary action hierarchy, distinct requesting/denied/restricted/revoked/unavailable presentations, accessible status announcements, platform-appropriate recovery, and product-language copy. No production UI changes are authorized by this specification update.

M0-C is isolated from this workstream. Design exploration that depends on M0-C behavior must be labeled **FUTURE IMPLEMENTATION — OUTSIDE CURRENT STABLE BASELINE** and cannot be treated as stable implementation evidence.

## Architecture

The intended production architecture is:

`semantic color tokens → theme-specific values → platform implementation`

Web, H5, React Native, and Admin must consume a proper theme/token abstraction. Components reference semantic roles only; they never reference raw palette values.

### Figma Starter-plan limitation

The current Figma Starter plan permits only one variable mode per collection. The design file therefore uses two one-mode representations:

- `Color — Light`
- `Color — Dark`

This is a **Figma Starter-plan tooling limitation**, not the intended production model. Both collections are generated from [semantic-color-contract.json](./semantic-color-contract.json), which is the canonical parity source. Names, hierarchy, scopes, and Web/iOS/Android code syntax must match exactly. Only primitive aliases may differ.

The collections must never evolve independently. A parity check is required after every color change:

1. Sort both variable-name sets and require exact equality.
2. Require equal scopes and code syntax for each matching name.
3. Require every value to be a primitive alias rather than a raw semantic value.
4. Re-run the Light and Dark contrast suites.

Theme-specific semantic names such as `darkText`, `lightBackground`, or `nightBorder` are prohibited.

## Current Figma execution state

Created successfully:

- Three one-mode collections: `Primitives`, `Color — Light`, and `Color — Dark`.
- 57 primitive color variables with hidden scopes and Web/iOS/Android code syntax.
- Five paired semantic roles in both collections: `background/base`, `background/sunken`, `background/elevated`, `surface/default`, and `surface/raised`.

The exact resumable IDs and continuation procedure are recorded in [figma-state.json](./figma-state.json). The completed repository contracts remain authoritative. Remaining variables, styles, components, pages, screens, flows, and reviews are `PENDING FIGMA CONSTRUCTION`; no component construction begins before the unfinished Figma foundation representation is reconciled and validated.

## Color system

### Palette intent

- Mineral ink supplies the neutral structure and low-glare workout surfaces.
- Cadence teal identifies primary action, selection, progress, and focus.
- Warm pulse is restrained to attention and energetic moments; it is not a second primary color.
- Green, amber, red, and blue retain conventional success, warning, error, and information meanings.
- Status and chart meaning always includes text, icon, marker, shape, pattern, or position in addition to hue.

The complete primitive values, semantic names, Light/Dark aliases, scopes, and intentional differences are defined in [semantic-color-contract.json](./semantic-color-contract.json).

### WCAG 2.2 validation

Targets:

- Normal text: at least 4.5:1.
- Large text: at least 3:1.
- Meaningful control boundaries, focus indicators, and non-text state cues: at least 3:1 against adjacent colors.
- Inactive controls are exempt from WCAG contrast requirements, but this system intentionally preserves readable disabled text and visible boundaries.

| Combination | Light | Dark | Result |
| --- | ---: | ---: | --- |
| Primary text / base | 15.51:1 | 18.78:1 | Pass AA/AAA |
| Secondary text / base or default surface | 6.39:1 | 9.65:1 | Pass AA |
| Tertiary text / base or default surface | 5.18:1 | 6.09:1 | Pass AA |
| Disabled text / disabled surface | 4.88:1 | 4.85:1 | Pass AA despite inactive exemption |
| Default border / base | 3.33:1 | 4.36:1 | Pass non-text |
| Default border / default surface | 3.55:1 | 3.84:1 | Pass non-text |
| Disabled border / disabled surface | 3.14:1 | 3.06:1 | Pass non-text despite inactive exemption |
| Strong border / default surface | 6.82:1 | 6.09:1 | Pass non-text |
| Focus ring / default surface | 4.93:1 | 10.36:1 | Pass non-text |
| Content on primary control | 4.93:1 | 11.76:1 | Pass AA |
| Content on warm accent | 4.71:1 | 9.46:1 | Pass AA |
| Success / default surface | 5.43:1 | 10.22:1 | Pass AA |
| Warning / default surface | 5.19:1 | 10.69:1 | Pass AA |
| Error / default surface | 6.57:1 | 8.52:1 | Pass AA |
| Information / default surface | 5.95:1 | 9.35:1 | Pass AA |
| Success / success-subtle | 5.15:1 | 7.79:1 | Pass AA |
| Warning / warning-subtle | 4.97:1 | 7.80:1 | Pass AA |
| Error / error-subtle | 6.05:1 | 7.18:1 | Pass AA |
| Information / info-subtle | 5.54:1 | 7.98:1 | Pass AA |
| Selected content / selected background | 7.69:1 | 8.96:1 | Pass AA/AAA |

Charts and metrics use labeled series, direct values, distinct marker shapes, and optional dash/pattern treatments. Color is supplementary. Each series color has at least 4.5:1 contrast against its default surface in the defined theme.

### Intentional Light/Dark behavior differences

- `surface/raised`: Light primarily uses border/shadow; Dark uses a lighter mineral surface because dark shadows provide weak separation.
- `background/sunken`: Dark may match the base ink; structure comes from surrounding raised surfaces and borders rather than pushing to crushed black.
- Accent and status roles use 600-range colors in Light and 300-range colors in Dark to preserve contrast on their surrounding surfaces.
- `text/inverse`, `text/on-accent`, and `control/on-primary` switch from white in Light to mineral ink in Dark because their meaning is “content on the contrasting filled surface,” not “always white.”
- Disabled controls keep accessible text and borders. Disabled meaning also uses unavailable interaction, changed surface, optional icon, and platform accessibility state.

## Typography

The shared contract defines hierarchy and purpose, not identical font rendering.

### Semantic scale

| Token | Size / line height | Weight | Default expression |
| --- | --- | --- | --- |
| `display/brand-xl` | 48 / 56 | Bold | Manrope, selective brand moments |
| `heading/brand-l` | 32 / 40 | Semibold | Manrope, selected headings only |
| `heading/title-l` | 28 / 36 | Semibold | Platform system font |
| `heading/title-m` | 22 / 28 | Semibold | Platform system font |
| `body/l` | 18 / 28 | Regular | Platform system font |
| `body/m` | 16 / 24 | Regular | Platform system font |
| `body/s` | 14 / 20 | Regular | Platform system font |
| `label/l` | 14 / 20 | Medium | Platform system font |
| `label/s` | 12 / 16 | Medium | Platform system font |
| `caption` | 12 / 16 | Regular | Platform system font |
| `metric/hero` | 48 / 48 | ExtraBold | Manrope with tabular numerals |
| `metric/l` | 32 / 36 | Bold | Manrope with tabular numerals |
| `metric/m` | 24 / 28 | Bold | Manrope with tabular numerals |

### Platform mapping

- **iOS:** native SF system typography and Dynamic Type text styles for UI/body roles. Manrope is optional for selected brand/metric roles and must scale through the platform text-metrics mechanism.
- **Android:** native Android/Roboto typography for UI/body roles and user font scaling. A custom font requires a documented UX reason. Manrope remains selective for brand/metric roles.
- **Web/H5/Admin:** `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` for UI/body roles. Manrope is a selective brand/metric family and must never block essential rendering.
- **Figma preview:** SF Pro represents iOS; Roboto Flex represents Android and neutral system-preview specimens because Segoe UI is unavailable in the current Figma font list. This preview substitution is not a runtime font mandate.

Text must reflow at 200% zoom on web and with platform font scaling on mobile. Workout controls and critical feedback cannot disappear or overlap under scaling.

## Spacing, grid, and layout

### Spacing tokens

`0=0`, `2xs=2`, `xs=4`, `sm=8`, `md=12`, `lg=16`, `xl=20`, `2xl=24`, `3xl=32`, `4xl=40`, `5xl=48`, `6xl=64`, `7xl=80`.

### Layout tokens

| Role | Value |
| --- | ---: |
| Compact gutter | 16 |
| Standard mobile gutter | 20 |
| Tablet gutter | 32 |
| Laptop gutter | 40 |
| Desktop gutter | 48 |
| Readable content maximum | 720 |
| Primary desktop content maximum | 1280 |
| Wide desktop maximum | 1440 |

Compact mobile uses four conceptual columns, tablet uses eight, and desktop uses twelve. These are transformation rules rather than a requirement to duplicate each screen at every width.

## Shape, borders, targets, and elevation

- Radius: `none=0`, `xs=4`, `sm=8`, `md=12`, `lg=16`, `xl=24`, `full=999`.
- Border: `none=0`, `hairline=1`, `strong=2`.
- Icon sizes: `sm=16`, `md=20`, `lg=24`, `xl=32`.
- Minimum target: iOS `44×44 pt`; Android `48×48 dp`; workout primary controls `56×56` or larger.
- Elevation 1: `0 1 2 rgba(8,20,17,.08)`.
- Elevation 2: `0 4 12 rgba(8,20,17,.12)`.
- Elevation 3: `0 12 32 rgba(8,20,17,.16)`.

Dark elevation uses surface tone and border first. Shadows never carry the only boundary cue.

## Motion

- `instant=0 ms`, `fast=100 ms`, `standard=200 ms`, `emphasis=320 ms`, `slow=480 ms`.
- Standard easing: `cubic-bezier(.2,0,0,1)`.
- Exit easing: `cubic-bezier(.4,0,1,1)`.
- Reduced motion removes non-essential translation, scaling, and repeated pulse while retaining immediate state feedback.
- Live workout motion must never compete with the current cue or metric.

## Core component contract

All new component implementation is **FUTURE IMPLEMENTATION — OUTSIDE CURRENT STABLE BASELINE** unless a section explicitly records merged M0-B behavior. Figma components must bind to semantic color roles and dimension variables, not primitive colors or raw values.

| Component | Required states/API | Accessibility and platform behavior |
| --- | --- | --- |
| Action Button | Primary/Quiet; medium/large; default, hover where applicable, focus, pressed, loading, disabled | One highest-emphasis action per region; loading retains label context; focus ring is not color-only; 44/48 minimum targets |
| Field | Empty, filled, focused, error, disabled, loading; label, value, helper, leading/trailing slot | Persistent label; error icon plus text; keyboard type and native control behavior vary by platform |
| Navigation Item | Unselected, selected, hover/focus where applicable, pressed, disabled; icon plus label | Selected state uses shape/weight and accessible state in addition to teal |
| Metric | Neutral, positive, caution, negative; hero/large/medium; value, unit, label, trend | Tabular numerals; status includes label/icon or trend direction; no color-only trend |
| Status / Sync Badge | Neutral, success, warning, error, info; compact/regular | Icon plus short label; screen-reader status wording; sync states distinguish queued, syncing, failed, and complete |
| Workout Control | Primary, pause, resume, rest, stop; default, pressed, disabled | Oversized targets, coaching-distance legibility, explicit action text, haptic/visual response per native platform |
| State Panel | Loading, empty, offline, error, success, sync-pending | Title, explanation, optional action; offline and sync-pending remain distinct; progress is announced without continuous chatter |
| Camera Setup Status | Permission loading/required/requesting/denied/restricted, setup ready, preview inactive/active, interrupted/unavailable, manual fallback | M0-B supplies lifecycle evidence only. Future product design preserves explicit setup and fallback while adding truthful recovery, camera purpose, accessible state, and intentional action hierarchy |

Variant matrices must remain below 30 combinations. Platform-only interactions such as hover must not be forced into native-mobile variants; native sheets, dialogs, gestures, keyboard behavior, and controls remain platform-specific.

## AI interaction language

- M1 Coach/Form Check is deterministic guidance, not a generative assistant.
- Evidence and rules must be distinguishable from generated summaries.
- Generated content, if introduced in a later milestone, must be labeled and retain a deterministic fallback.
- No sparkle/robot symbol is used as a generic substitute for clear function labels.
- Live LLM coaching is not implied by the component language.

## Implementation notes

- Do not copy the Figma paired-collection workaround into production.
- Generate platform token outputs from one semantic source with Light/Dark values.
- Preserve identical semantic names across Web, H5, React Native, and Admin even where platform components differ.
- Require automated contrast tests for the pairs listed above and token-parity tests between theme objects.
- Require state tests that verify icon/text/shape cues exist where color conveys status or selection.
- M0-B is closed and this design branch has been fast-forwarded to the fetched stable `origin/main`; preserve that ancestry in later design commits.
- Do not inspect, modify, checkout, cherry-pick, or depend on M0-C work. Reconcile only against stable `main` until M0-C is merged and explicitly brought into scope.
- Production UI mutation still requires the design foundation review gate and explicit implementation authorization.
