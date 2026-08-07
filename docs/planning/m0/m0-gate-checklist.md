# M0 Gate Checklist

## Gate States

### Pass

All of the following are satisfied:

- M0 technical shell works
- camera path works with permission and lifecycle handling
- pose provider candidate works on representative devices
- `PoseObservation` is stable
- squat metrics, phase, rep, faults, and feedback behave deterministically
- fixtures and replay are complete
- benchmark evidence is complete
- privacy verification is complete
- no extra AI exercise has started
- required evidence artefacts exist and are linked

### Conditional Pass

Allowed only if:

- the architecture goal is technically viable,
- the selected runtime path is acceptable for M0 with documented caveats,
- the remaining issues are not blockers for completing the M0 proof-of-architecture objective,
- every caveat is explicitly tied to SRS / architecture / ADR / test / evidence references.

### Fail

Any of the following occurs:

- privacy evidence fails
- benchmark evidence fails
- replay or fixture determinism fails
- the runtime path is not technically viable
- the selected candidate violates the architecture boundary model
- M0 scope expands beyond Squat
- required evidence artifacts are missing

## Gate Inputs

- SRS: `docs/SRS.md`
- Architecture: `docs/architecture/*`
- ADRs: `docs/architecture/adr/*`
- Test evidence: `docs/architecture/evidence/m0/*`

## Gate Evidence Links

- `runtime-benchmark.md`
- `squat-fixture-report.md`
- `privacy-verification.md`
- `m0-gate-report.md`

## Final Gate Rule

`M0-GATE-001` passes only when the evidence package demonstrates that the AI Exercise Analysis architecture is technically viable for Bodyweight Squat and that the privacy/runtime constraints are respected.
