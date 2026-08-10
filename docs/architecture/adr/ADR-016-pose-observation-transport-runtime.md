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

## Pre-approved Benchmark Targets (R1, 2026-08-10)

> **Status of ADR-016 unchanged:** this section pre-approves only the *measurement targets*. The runtime option decision (A/B/C/D) remains `PROPOSED — EXPERIMENT REQUIRED` and is accepted only in **R4** after R3 device evidence. Targets below were defined from engineering first principles **before** any R3 measurement; they are **not** tuned to existing or future device results. The Huawei/HarmonyOS 83 ms inference figure in `M0-C.md` is a *data point*, not a basis for these targets.

| # | Metric | Measurement definition | Target | Failure threshold | Measurement window | Device applicability | Rationale | Source / assumption |
|---|--------|----------------------|--------|-------------------|--------------------|---------------------|-----------|---------------------|
| 1 | Effective observation rate | `observationsWithLandmarks` delivered to engine ÷ elapsed active time, excluding frames dropped before the provider | ≥ 28 obs/s | < 20 obs/s sustained | 60 s sustained active set | iOS + Android | Squat cadence is slow; 28–30 fps gives smooth phase/rep detection with margin | On-device fitness CV practice |
| 2 | Inference latency p50 | median time from frame submitted to provider → landmark result produced (`lastInferenceMs`), on-device | ≤ 40 ms | p50 > 55 ms | median over ≥ 300 inferences | iOS + Android | leaves headroom under a 30 fps frame budget for transport + engine | MediaPipe Pose Landmarker typical ranges |
| 3 | Inference latency p95 | p95 of same per-frame inference time | ≤ 60 ms | p95 > 80 ms | p95 over ≥ 300 inferences | iOS + Android | tail must stay within budget | same |
| 4 | Observation-to-display latency p95 | p95 of (raw frame capture timestamp → overlay render of corresponding observation) | ≤ 100 ms | p95 > 150 ms | p95 over sustained run | iOS + Android | keeps overlay visually coupled to motion | UI latency guidance (<100 ms perceived coupling) |
| 5 | JS responsiveness / JS load | count + max duration of JS-thread long tasks (>50 ms) attributable to pose/transport during active set | 0 long tasks > 50 ms from pose path; JS thread stays within frame budget | > 3 long tasks > 50 ms/s, or any single > 100 ms from pose path | 60 s sustained set | iOS + Android | UI must remain interactive; bridge/transport must not monopolize JS | RN performance guidance |
| 6 | Overlay smoothness | overlay render fps and dropped UI-frame ratio during active set | ≥ 50 fps with < 2% dropped UI frames | < 40 fps overlay, or > 5% dropped UI frames | 60 s sustained | iOS + Android | smooth visual feedback | 60 fps UI target with margin |
| 7 | Thermal trend | device temp delta + battery drain over sustained session; throttling/clockscale onset | no throttling within 10 min; ΔT ≤ 8 °C above ambient; sustainable | throttling observed, or ΔT > 12 °C, or forced slowdown within 10 min | 10 min sustained active session | iOS + Android | must sustain a workout-length session | device thermal envelopes; M0-ENG-007 concept |
| 8 | Memory stability | JS heap + native memory over sustained run; monotonic-growth check | stable within ±10% over run; no unbounded growth; no OOM | monotonic growth > 20% over run, or OOM/crash | 10 min sustained | iOS + Android | long sessions must not leak | mobile memory hygiene |
| 9 | Tracking recovery | after induced tracking loss, time to resume valid observations when person re-enters frame | ≤ 1.5 s to resume valid obs; no stuck state | > 3 s, or requires app restart | ≥ 5 loss/recovery cycles | iOS + Android | user movement is expected mid-set | UX expectation |
| 10 | Model/profile load | cold/warm start to provider ready + first valid observation after profile load | model load ≤ 3 s; first valid ≤ 5 s (warm) | model load > 6 s, or first valid > 10 s | median over ≥ 5 starts | iOS + Android | acceptable startup | MediaPipe model load typical 1–3 s |
| 11 | Background/foreground recovery | app backgrounded during active set then foregrounded; time to resume valid obs + state correctness | resume valid obs ≤ 2 s; correct lifecycle state; no crash | > 4 s, or stuck in error/interrupted, or requires restart | ≥ 5 bg/fg cycles | iOS + Android | interruption handling must be robust | M0-B lifecycle design |

**Three layers per metric (explicit):**

- **TARGET** — the value above that R3 evidence should meet for ADR-016 candidate acceptance in R4.
- **MEASUREMENT METHOD** — the definition column; collected via the benchmark harness on representative iOS + Android devices using canonical M0-M fixtures and the active Squat profile.
- **PASS/FAIL RULE** — a candidate option passes a metric if the measured value meets TARGET and does not breach the FAILURE threshold; breaching FAILURE → that candidate is a no-go for that metric (recorded technical evidence required to exclude it per C5).

> Metrics #2/#3 apply to provider-side inference; if a chosen runtime option (B/C/D) moves inference off the JS thread, the same on-device `lastInferenceMs` instrumentation still applies.

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
