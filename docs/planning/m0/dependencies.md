# M0 Dependencies

## High-level Dependency Graph

```mermaid
flowchart TD
    A[M0-A Technical Shell] --> B[M0-B Camera Pipeline]
    B --> C[M0-C Pose Provider]
    C --> D[M0-D PoseObservation]
    D --> E[M0-E Skeleton Overlay]
    D --> F[M0-F Normalization]
    F --> G[M0-G Squat Metrics]
    G --> H[M0-H Squat Phase FSM]
    H --> I[M0-I Rep Detection]
    I --> J[M0-J Candidate Fault 1]
    I --> K[M0-K Candidate Fault 2]
    J --> L[M0-L Feedback Selector]
    K --> L
    D --> M[M0-M Fixture Format]
    M --> N[M0-N Replay Simulator]
    C --> O[M0-O Benchmark Harness]
    N --> O
    B --> P[M0-P Privacy Verification]
    N --> Q[M0-Q M0 Gate Report]
    O --> Q
    P --> Q
```

## Module Dependency Rules

- `M0-D PoseObservation` is the stable semantic boundary.
- `M0-F` through `M0-L` may depend on `PoseObservation`, but not on UI components.
- `M0-N` depends on fixtures and runtime semantics, not on benchmark results.
- `M0-O` depends on replay and the provider candidate.
- `M0-Q` depends on benchmark, privacy, and replay evidence.

## Runtime Dependency Rules

- Camera owns frame acquisition and backpressure.
- Pose provider owns inference only.
- Exercise runtime owns normalization, metrics, phase, rep, rules, and feedback.
- UI owns presentation only.

## Testing Dependency Rules

- geometry tests precede fixtures
- fixtures precede replay
- replay precedes benchmark comparison
- privacy verification can run alongside replay/benchmark once the camera path exists
- gate review requires all evidence inputs
