# AI Fitness Core Component Architecture

**Status:** Component contract approved for Figma construction after foundation validation
**Implementation:** **FUTURE IMPLEMENTATION — OUTSIDE CURRENT STABLE BASELINE** unless a section explicitly records already-merged M0-B behavior.

## Principles

- Shared components express product semantics; platform wrappers express native behavior.
- Component fills, strokes, text colors, spacing, target sizes, and radii bind to semantic or dimension tokens.
- Raw palette values are prohibited inside product components.
- State is never communicated by color alone.
- Hover exists only where a pointing device exists. Focus exists where keyboard or switch navigation exists. Pressed feedback follows the platform.
- Variant sets remain below 30 combinations. Text, visibility, and icon choice use component properties rather than variant axes.

## Dependency order

1. Private icon primitives and progress indicator.
2. Action Button, Field, Navigation Item, Metric, and Status Badge.
3. Workout Control and State Panel.
4. Camera Setup Status.
5. Platform navigation, sheet/dialog, table, and screen compositions.

## Action Button

Variant axes: `Size={Medium,Large} × Emphasis={Primary,Quiet} × State={Default,Hover,Focused,Pressed,Disabled,Loading}` = 24.

Properties:

- `Label` — text.
- `Show leading icon` — boolean.
- `Leading icon` — instance swap.
- Loading indicator visibility is state-controlled and retains meaningful accessible text.

| State/style | Background | Content | Border / cue |
| --- | --- | --- | --- |
| Primary default | `control/primary` | `control/on-primary` | Shape and label establish primary action |
| Primary hover | `control/primary-hover` | `control/on-primary` | Web/Admin only |
| Primary pressed | `control/primary-pressed` | `control/on-primary` | Native pressed/ripple or opacity feedback also applies |
| Quiet default | `surface/default` | `accent/primary` | `border/default` where boundary is required |
| Focused | Style base | Style content | 2 px `focus/ring` plus non-color outline geometry |
| Disabled | `control/disabled` | `text/disabled` | `border/disabled`; unavailable accessibility state |
| Loading | Style base | Style content | Progress indicator plus retained action context; prevents duplicate activation |

Medium uses at least a 44 pt / 48 dp target through wrapper sizing. Large uses `size/target-workout=56`.

## Field

Variant axis: `State={Empty,Filled,Focused,Error,Disabled,Loading}` = 6.

Properties: label, value/placeholder, helper text, leading icon visibility/swap, trailing action visibility/swap, required indicator.

- Default boundary: `border/default`; focused: 2 px `border/focus`; error: 2 px `status/error`; disabled: `border/disabled`.
- Label remains persistent when value or error is present.
- Error always includes icon plus text and an accessible description relationship.
- Native keyboard type, autofill, secure-entry, and validation timing remain platform-specific.
- Web/Admin preserve a visible keyboard focus indicator and do not use placeholder as the only label.

## Navigation Item

Variant axis: `State={Default,Hover,Focused,Pressed,Selected,Disabled}` = 6.

Properties: label, icon instance swap, badge visibility/value.

- Selected: `selection/background` plus `selection/content`, changed icon weight/shape, and accessible selected state.
- Default: transparent/surface background with `text/secondary`.
- Focused: `focus/ring`; hover exists on Web/Admin and pointer-enabled tablet contexts only.
- Native navigation containers control layout: iOS tab/sidebar, Android adaptive bar/rail/drawer, Web/H5 responsive bar/sidebar, Admin persistent sidebar.

## Metric

Variant axes: `Size={Hero,Large,Medium} × Tone={Neutral,Positive,Caution,Negative}` = 12.

Properties: label, value, unit, supporting text, trend icon visibility/swap, trend label.

- Value uses the corresponding Manrope metric style and tabular numerals.
- Neutral uses `metric/neutral`; positive, caution, and negative use their semantic metric roles.
- Trend includes direction icon and text such as “up 4%,” never hue alone.
- Large values wrap or scale within documented bounds rather than clipping.

## Status / Sync Badge

Variant axes: `Size={Compact,Regular} × Tone={Neutral,Success,Warning,Error,Info}` = 10.

Properties: label and icon instance swap.

- Status tones pair `status/{tone}` content with `status/{tone}-subtle` background.
- Neutral pairs `text/secondary` with `surface/interactive`.
- Every badge contains icon plus label. Icon-only status is prohibited.
- Sync labels are explicit: `Queued`, `Syncing`, `Synced`, `Sync failed`. `Offline` is not synonymous with `Sync failed`.

## Workout Control

Variant axes: `Action={Pause,Resume,Rest,Stop} × State={Default,Pressed,Disabled}` = 12.

Properties: label and icon instance swap are fixed by action semantics in documented examples.

- Minimum target is `size/target-workout=56`; primary workout controls may be 64–72 on phone.
- Pause/resume use primary semantics; stop uses error semantics with explicit text; rest uses info semantics.
- Controls stay reachable one-handed and readable at coaching distance.
- Haptic, ripple, sound, and gesture behavior follows native platform settings and reduced-motion/accessibility preferences.

## State Panel

Variant axis: `State={Loading,Empty,Offline,Error,Success,SyncPending}` = 6.

Properties: title, message, illustration/icon swap, primary action label/visibility, secondary action label/visibility.

- Loading uses determinate progress when known; indefinite animation has a reduced-motion presentation.
- Empty states explain what creates content rather than blaming the user.
- Offline preserves local completion and describes what remains available.
- Error states name a recoverable action where possible.
- Sync-pending does not imply failure and must remain visually distinct from error.

## Camera Setup Status

### M0-B IMPLEMENTED BEHAVIOUR

The stable M0-B baseline is a technical React Native camera shell and reducer, not the approved product UI. Its implemented contract is:

| Implemented state/condition | Stable behavior |
| --- | --- |
| Permission snapshot loading | Lifecycle remains `unavailable`; preview is not mounted. |
| Permission granted | Lifecycle becomes `ready_to_setup`; permission alone never mounts the preview. |
| Permission undetermined and requestable | The user may explicitly request permission; lifecycle passes through `requesting_permission`. |
| Permission denied and not requestable | Lifecycle becomes `permission_denied`; manual fallback is available. |
| Explicit camera start with permission granted | Lifecycle becomes `preview_active` and mounts `CameraView`. |
| App backgrounding, preview mount failure, or permission revocation while active | Preview is unmounted and the lifecycle becomes `preview_interrupted` or returns to a permission state. |
| Resume while still permitted | The user can explicitly reactivate the preview. |
| Manual fallback | Lifecycle becomes `manual_fallback`; the camera is not required to continue the milestone flow. |

The prototype action priority is permission request → start camera → resume preview → manual fallback. In states without one of the first three actions, its technical shell defaults to manual fallback. The merged screen uses hard-coded dark styling, native `Button`, milestone/engineering copy, and a generic OS permission string. These details are implementation evidence only and are not design-system precedent.

M0-B evidence does not claim physical-device verification of the OS prompt, blocked-permission path, live camera output, background interruption, mount failure, or iOS native behavior. Designs must not present those paths as validated merely because reducer tests exist.

### DESIGN RECOMMENDATION FOR FUTURE IMPLEMENTATION

**FUTURE IMPLEMENTATION — OUTSIDE CURRENT STABLE BASELINE. NO PRODUCTION CODE CHANGES IN THIS DESIGN PHASE.**

Variant axis: `State={PermissionLoading,PermissionRequired,PermissionRequesting,Denied,Restricted,SetupReady,PreviewInactive,PreviewActive,Interrupted,Unavailable,ManualFallback}` = 11.

Properties: title, explanation, primary/secondary action labels, status icon swap.

- Permission request explains camera purpose before the system prompt.
- Denied, restricted, revoked, unsupported, and mount-failure outcomes map to truthful, platform-appropriate recovery. Restricted does not promise a settings action that the OS cannot provide.
- Preview starts only after the explicit setup gate.
- Requesting permission has a visible progress state and prevents duplicate requests.
- Background/interruption recovery states say whether preview is inactive and whether resume is currently possible.
- Manual fallback preserves the current set and is never visually subordinate to an unusable camera path.
- Primary/secondary action hierarchy is intentional per state; the technical shell's default-fallback behavior is not copied automatically.
- Product copy removes milestone names, reducer labels, and pipeline terminology.
- Status text and accessible announcements accompany visual indicators.

Anything beyond permission, preview lifecycle, interruption recovery, and manual fallback is **FUTURE IMPLEMENTATION — OUTSIDE CURRENT STABLE BASELINE**, including calibration, skeleton overlay, rep counting, form cues, scoring, and result summaries.

## Platform wrappers

| Concern | iOS | Android | Web/H5 | Admin |
| --- | --- | --- | --- | --- |
| Typography | SF system + Dynamic Type | Android system/Roboto + font scaling | CSS system stack | CSS system stack, denser labels |
| Navigation | Tab bar/sidebar; native back | Adaptive bar/rail/drawer; system back | Responsive bar/sidebar | Persistent sidebar |
| Press feedback | Native highlight/haptic | Ripple/haptic | Hover/active | Hover/active, dense focus traversal |
| Focus | External keyboard/switch where applicable | Keyboard/accessibility focus | Always visible for keyboard | Always visible, table-aware |
| Modal behavior | Sheet/presentation conventions | Bottom sheet/dialog conventions | Dialog/drawer based on viewport | Dialog or side panel |
| Targets/density | 44 pt minimum | 48 dp minimum | 44 CSS px target where practical | Dense rows allowed; actions retain 44 px target |
| Tables | Avoid for consumer flows | Avoid for consumer flows | Responsive lists before tables | Semantic, sortable, keyboard-operable tables |

## Required Figma validation per component

1. Confirm variant count and axes.
2. Confirm text/boolean/instance-swap properties are wired to children.
3. Inspect bound variables; no raw color and no `ALL_SCOPES` token.
4. Confirm Light and Dark presentations use the same component structure and corresponding semantic collection.
5. Screenshot the complete variant grid and inspect clipping, wrapping, state differentiation, focus, and disabled legibility.
6. Confirm platform-inapplicable states are documented rather than forced into every wrapper.
