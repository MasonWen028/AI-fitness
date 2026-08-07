# M0 Risk Register

| ID | Risk | Severity | Impact | Mitigation | Evidence Required |
| --- | --- | --- | --- | --- | --- |
| R-01 | Pose provider performance too slow on representative devices | High | M0 runtime may fail benchmark | Compare viable runtime candidates with the same fixtures and devices | `runtime-benchmark.md` |
| R-02 | Bridge/transport overhead causes overlay or JS instability | High | Candidate runtime may be rejected | Use `ADR-016` benchmark evidence and keep semantics fixed | `runtime-benchmark.md` |
| R-03 | Camera lifecycle/backpressure implementation leaks frames | High | Privacy and memory issues | Enforce latest-frame policy and privacy verification | `privacy-verification.md` |
| R-04 | Fixture semantics drift across retries or implementations | High | Replay becomes unreliable | Freeze fixture format early and compare all candidates against identical fixtures | `squat-fixture-report.md` |
| R-05 | Calibration/tracking-loss behavior invents false confidence | High | False rep/fault behavior | Fail closed on weak evidence and test the low-confidence paths explicitly | fixture and replay tests |
| R-06 | M0 scope expands into product features | Medium | M0 becomes too large | Enforce `Bodyweight Squat` only and use gate checklist discipline | `m0-gate-checklist.md` |
| R-07 | Privacy verification becomes assumed rather than proven | High | Raw frame leakage risk remains hidden | Instrument network/storage checks and document results | `privacy-verification.md` |
| R-08 | Benchmark targets get invented too early | Medium | Misleading pass/fail criteria | Use `<VALIDATION_REQUIRED>` until approved benchmark evidence exists | `runtime-benchmark.md` |
| R-09 | M0 gate report assembled without all evidence | High | Gate result is not trustworthy | Make gate checklist depend on named evidence artifacts | `m0-gate-report.md` |
