# M0 Privacy Verification Plan

## Goal

Prove the M0 default privacy invariant:

`Camera frame → local processing → discard`

## Verify

- no raw video upload
- no hidden network transmission
- camera lifecycle correctness
- permission flow correctness
- failure behavior correctness
- structured result upload only

## Evidence Method

- instrument network paths during the active camera path
- inspect storage paths used during the M0 prototype
- verify terminal lifecycle states release frame resources
- verify manual fallback remains available after denial or failure

## Planned Evidence Artefact

`docs/architecture/evidence/m0/privacy-verification.md`

## Pass Criteria

- no raw frames leave the device by default
- no prohibited storage path exists in the default architecture path
- structured result payloads only are eligible for later upload
- failure paths do not silently introduce media transmission

## Fail Criteria

- any raw-frame transmission
- any hidden media stream to backend or analytics
- any storage of raw frames or per-frame landmark streams in the default path
