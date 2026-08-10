# ADR-016 — PoseObservation Transport and Exercise Engine Runtime

Status

`PROPOSED — EXPERIMENT REQUIRED`

Date

2026-08-07

Milestone

`M0`

Decision Owners

- Principal Software Architect
- Mobile runtime owner
- Native iOS owner
- Native Android owner
- Exercise-analysis owner

## Context

The architecture needs a canonical `PoseObservation` contract and a deterministic exercise engine, but the SRS explicitly leaves the hot-path runtime placement unresolved until benchmark evidence exists. TypeScript portability is desirable, but not at the cost of unacceptable latency, GC pressure, overlay instability, or thermal behavior.

The runtime decision materially affects M0 viability and therefore gates later exercise expansion.

## SRS Constraints

- final answer is not already known
- benchmark option A and every viable B–D candidate
- compare p50/p95 latency, effective FPS, JS load, serialization, allocations/GC where observable, overlay smoothness, thermal behavior, maintainability, and parity
- no unbounded queueing
- preserve one profile schema and one conformance suite across platforms even if implementations differ

## Decision

No final runtime option is selected in this ADR.

The project will benchmark the viable candidates and decide only after evidence review.

## Alternatives

### Option A — Native pose → standard React Native bridge → TypeScript exercise engine

**Hypothesis:** simplest maintenance path may be sufficient at bounded observation rates.

**Pros:**

- simplest conceptual ownership
- TypeScript semantics are straightforward to share and test
- lowest implementation novelty if performance is acceptable

**Cons:**

- highest serialization risk
- possible bridge pressure and JS responsiveness issues
- potential overlay lag or GC churn on lower devices

### Option B — Native pose → JSI/equivalent → TypeScript exercise engine

**Hypothesis:** lower transport overhead may preserve TS semantics while reducing bridge cost.

**Pros:**

- keeps portable engine semantics in TS
- lower overhead than standard bridge paths
- better fit for high-frequency observation delivery if implemented well

**Cons:**

- more complex native boundary
- parity/debuggability burden rises
- still leaves hot-path numeric work in JS/TS

### Option C — Native/worklet hot path → semantic events → JavaScript application

**Hypothesis:** moving high-frequency transforms off application JS may improve responsiveness while keeping the UI boundary small.

**Pros:**

- reduced JS application pressure
- smaller semantic event stream to UI
- overlay and runtime behavior may be smoother under load

**Cons:**

- analysis logic may split across runtime layers
- conformance discipline becomes more important
- debugging may be more complex

### Option D — Native pose + native hot exercise engine + shared declarative ExercisePoseProfile

**Hypothesis:** maximum hot-path control may be necessary if TS/JS paths do not meet latency/thermal goals.

**Pros:**

- strongest control of latency/allocation path
- least transport pressure
- best theoretical hot-path performance

**Cons:**

- highest implementation and parity complexity
- increased risk of duplicated platform logic
- greater long-term maintenance burden

## Trade-offs

- Simplicity favors Option A, but only if evidence says it works.
- Performance control increases toward Option D, but so does maintenance cost.
- The architecture must not mistake “portable TypeScript” for “must run every hot-path calculation in TypeScript.”

## Risks

- selecting too early based on taste rather than evidence
- choosing the simplest path and discovering unacceptable device behavior too late
- choosing the most powerful native path and carrying unnecessary cross-platform complexity forever
- divergence between platforms if semantics are not anchored by shared fixtures and profile schema

## Validation / Evidence

Evidence pending M0 spike.

### Benchmark plan

All viable candidates must be exercised with the same:

- canonical observation fixtures,
- active Squat profile semantics,
- expected phase/rep/rule outputs,
- representative iOS and Android physical devices,
- overlay behavior expectations.

### Per-candidate responsibility matrix

| Responsibility | Option A — Bridge → TS engine | Option B — JSI/equivalent → TS engine | Option C — Native/worklet hot path → semantic events | Option D — Native pose + native hot exercise engine |
| --- | --- | --- | --- | --- |
| camera / frame ownership | native camera layer | native camera layer | native camera layer | native camera layer |
| frame dropping / backpressure | native camera/provider boundary before bridge | native camera/provider boundary before JSI delivery | native/worklet hot path before semantic reduction | native hot path before native analysis |
| pose inference | native provider | native provider | native provider / native hot path | native provider |
| `PoseObservation` transport | full canonical observation crosses standard RN bridge | full canonical observation crosses JSI/equivalent path | canonical observation consumed off app JS thread; reduced semantic stream reaches JS app | canonical observation consumed in native hot path; JS receives reduced semantic stream |
| smoothing | TypeScript exercise runtime | TypeScript exercise runtime | native/worklet hot path | native hot exercise runtime |
| normalization | TypeScript exercise runtime | TypeScript exercise runtime | native/worklet hot path | native hot exercise runtime |
| metric calculation | TypeScript exercise runtime | TypeScript exercise runtime | native/worklet hot path | native hot exercise runtime |
| phase / rep / rule execution | TypeScript exercise runtime | TypeScript exercise runtime | native/worklet hot path unless explicitly reduced further | native hot exercise runtime |
| event reduction | none before JS; JS app/runtime handles all observations | minimal before TS runtime unless profiling requires bounded coalescing | required before JS application boundary | required before JS application boundary |
| overlay transform / cadence | JS/UI layer from transported observations or runtime outputs | JS/UI layer from lower-overhead transported observations or runtime outputs | native/worklet layer should own cadence reduction; JS/UI consumes bounded overlay updates | native layer should own cadence reduction; JS/UI consumes bounded overlay updates |
| UI semantic events | TypeScript / React Native application layer | TypeScript / React Native application layer | JavaScript application layer receives reduced semantic events | JavaScript application layer receives reduced semantic events |
| `ExercisePoseProfile` ownership | shared declarative asset; interpreted by TS runtime | shared declarative asset; interpreted by TS runtime | shared declarative asset; semantics must remain conformance-equivalent across hot-path layer | shared declarative asset; native runtime must remain conformance-equivalent to shared schema |

### Option A qualitative go / no-go categories

Numeric thresholds remain governed by the approved M0 benchmark plan. The standard bridge option should therefore be judged with qualitative categories:

- **Go:** sustained runs show stable observation delivery, bounded queue depth, acceptable overlay continuity, acceptable JS responsiveness, and no material evidence that bridge serialization is the primary bottleneck.
- **Conditional:** works functionally but shows notable bridge pressure, visible UI/overlay instability, or platform asymmetry that may still be acceptable only if lower-overhead options do not materially outperform it.
- **No-go:** repeated evidence shows bridge serialization or JS-thread pressure as a dominant bottleneck, causing unstable overlay cadence, unacceptable latency trend, poor lower-tier device behavior, or clear loss of maintainability due to compensating complexity.

### Measure

- effective observation FPS
- p50 observation-to-engine-result latency
- p95 observation-to-engine-result latency
- queue depth and dropped-observation behavior
- JS thread responsiveness during active set
- allocations/GC where observable
- overlay smoothness / stutter notes
- thermal trend over sustained runs
- maintainability and parity assessment

### Benchmark rules

- no unbounded frame or observation queue
- same semantic expectations for all candidates
- no fabricated results
- excluded candidates MUST have recorded technical evidence demonstrating non-viability, not schedule preference (per C5, M0-R0 reconciliation)

## Consequences

- M0 architecture proceeds with a provider-neutral observation boundary and shared declarative profile semantics
- implementation teams must budget for disposable benchmark adapters where necessary
- no additional AI exercise begins until the runtime decision evidence is accepted as part of `M0-GATE-001`

## Revisit Trigger

Revisit when:

- benchmark evidence identifies a clear winner,
- or when a selected runtime later fails maintainability, parity, or device-envelope requirements.

## Related Requirements

- FR-TRANSPORT-001 through FR-TRANSPORT-006
- FR-AIFC-001 through FR-AIFC-009 — *mandatory M0 (confirmed by M0-R0 reconciliation, 2026-08-10)*
- FR-POSE-001 through FR-POSE-006, FR-POSE-007a, FR-POSE-008, FR-POSE-009a (M0); FR-POSE-007b, FR-POSE-009b (M1) — *split by M0-R0 reconciliation (2026-08-10)*
- NFR-PERF-004 through NFR-PERF-008
- M0-ENG-001 through M0-ENG-008
- `M0-GATE-001`
- AC-AIFC-001
- AC-TRANSPORT-001
- AC-GATE-001
- AC-PERF-002
