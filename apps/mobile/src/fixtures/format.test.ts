import { describe, expect, it } from 'vitest';

import { createSyntheticObservation } from '../pose/poseValidation';
import { createFixture, deserializeFixture, serializeFixture, validateFixture } from './format';
import { FIXTURE_FORMAT_VERSION } from './types';

function createValidFixture() {
  return createFixture({
    exercise: 'bodyweight-squat',
    metadata: {
      recordedAt: '2026-08-09T22:00:00.000Z',
      source: 'synthetic',
      frameIntervalMs: 33,
      tags: ['m0', 'squat'],
    },
    observations: [
      createSyntheticObservation(0, {
        left_hip: { x: 0.4, y: 0.5 },
        right_hip: { x: 0.6, y: 0.5 },
      }),
      createSyntheticObservation(1, {
        left_hip: { x: 0.41, y: 0.52 },
        right_hip: { x: 0.59, y: 0.52 },
      }),
    ],
  });
}

describe('fixture format', () => {
  it('creates a versioned replayable fixture', () => {
    const fixture = createValidFixture();

    expect(fixture.version).toBe(FIXTURE_FORMAT_VERSION);
    expect(fixture.exercise).toBe('bodyweight-squat');
    expect(fixture.observations).toHaveLength(2);
  });

  it('serializes and deserializes deterministically', () => {
    const fixture = createValidFixture();

    const first = serializeFixture(fixture);
    const second = serializeFixture(deserializeFixture(first));

    expect(second).toBe(first);
  });

  it('returns deep-cloned observations to avoid mutation leaks', () => {
    const fixture = createValidFixture();
    fixture.observations[0].provider.name = 'changed';

    const recreated = createValidFixture();

    expect(recreated.observations[0].provider.name).toBe('synthetic');
  });

  it('rejects invalid fixture metadata and invalid observations', () => {
    const result = validateFixture({
      version: FIXTURE_FORMAT_VERSION,
      exercise: 'bodyweight-squat',
      metadata: {
        recordedAt: '',
        source: 'synthetic',
        frameIntervalMs: 0,
      },
      observations: [
        {
          sequence: -1,
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'metadata.recordedAt must be a non-empty string',
        'metadata.frameIntervalMs must be a positive number',
      ]),
    );
    expect(result.errors.some((error) => error.includes('observations[0] invalid'))).toBe(true);
  });

  it('rejects non-monotonic timestamps and sequences', () => {
    const fixture = createValidFixture();
    fixture.observations[1].timestampMs = fixture.observations[0].timestampMs - 1;
    fixture.observations[1].sequence = fixture.observations[0].sequence - 1;

    const result = validateFixture(fixture);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'observations timestamps must be non-decreasing at index 1',
        'observations sequences must be non-decreasing at index 1',
      ]),
    );
  });

  it('throws when deserializing invalid JSON fixture content', () => {
    const invalid = JSON.stringify({ version: 'wrong', observations: [] });

    expect(() => deserializeFixture(invalid)).toThrowError(/Invalid fixture/);
  });
});
