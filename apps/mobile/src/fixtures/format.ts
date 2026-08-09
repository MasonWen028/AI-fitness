import type { PoseObservation } from '../pose/poseContract';
import { assertValidPoseObservation } from '../pose/poseValidation';
import {
  FIXTURE_FORMAT_VERSION,
  type FixtureValidationResult,
  type PoseObservationFixture,
} from './types';

function cloneObservation(observation: PoseObservation): PoseObservation {
  return {
    ...observation,
    imageSize: { ...observation.imageSize },
    people: observation.people.map((person) => ({
      ...person,
      imageLandmarks: person.imageLandmarks.map((landmark) => ({ ...landmark })),
      worldLandmarks: person.worldLandmarks?.map((landmark) => ({ ...landmark })),
    })),
    provider: { ...observation.provider },
  };
}

export function createFixture(
  fixture: Omit<PoseObservationFixture, 'version'>,
): PoseObservationFixture {
  return {
    ...fixture,
    version: FIXTURE_FORMAT_VERSION,
    observations: fixture.observations.map(cloneObservation),
    metadata: {
      ...fixture.metadata,
      tags: fixture.metadata.tags ? [...fixture.metadata.tags] : undefined,
    },
  };
}

export function serializeFixture(fixture: PoseObservationFixture): string {
  const normalized = createFixture(fixture);
  return JSON.stringify(normalized, null, 2);
}

export function deserializeFixture(serialized: string): PoseObservationFixture {
  const parsed = JSON.parse(serialized) as PoseObservationFixture;
  const validation = validateFixture(parsed);

  if (!validation.valid) {
    throw new Error(`Invalid fixture: ${validation.errors.join('; ')}`);
  }

  return createFixture(parsed);
}

export function validateFixture(fixture: unknown): FixtureValidationResult {
  const errors: string[] = [];

  if (typeof fixture !== 'object' || fixture === null) {
    return { valid: false, errors: ['fixture is not an object'] };
  }

  const candidate = fixture as Partial<PoseObservationFixture>;

  if (candidate.version !== FIXTURE_FORMAT_VERSION) {
    errors.push(`version must be ${FIXTURE_FORMAT_VERSION}`);
  }

  if (candidate.exercise !== 'bodyweight-squat') {
    errors.push('exercise must be bodyweight-squat');
  }

  if (!candidate.metadata) {
    errors.push('metadata must be present');
  } else {
    if (typeof candidate.metadata.recordedAt !== 'string' || candidate.metadata.recordedAt.length === 0) {
      errors.push('metadata.recordedAt must be a non-empty string');
    }
    if (!['synthetic', 'device-capture', 'replay-export'].includes(candidate.metadata.source)) {
      errors.push('metadata.source must be synthetic, device-capture, or replay-export');
    }
    if (
      typeof candidate.metadata.frameIntervalMs !== 'number' ||
      !Number.isFinite(candidate.metadata.frameIntervalMs) ||
      candidate.metadata.frameIntervalMs <= 0
    ) {
      errors.push('metadata.frameIntervalMs must be a positive number');
    }
    if (
      candidate.metadata.tags !== undefined &&
      (!Array.isArray(candidate.metadata.tags) ||
        candidate.metadata.tags.some((tag) => typeof tag !== 'string'))
    ) {
      errors.push('metadata.tags must be an array of strings when present');
    }
  }

  if (!Array.isArray(candidate.observations)) {
    errors.push('observations must be an array');
  } else {
    candidate.observations.forEach((observation, index) => {
      try {
        assertValidPoseObservation(observation);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown observation error';
        errors.push(`observations[${index}] invalid: ${message}`);
      }
    });

    for (let index = 1; index < candidate.observations.length; index += 1) {
      const previous = candidate.observations[index - 1];
      const current = candidate.observations[index];
      if (current.timestampMs < previous.timestampMs) {
        errors.push(`observations timestamps must be non-decreasing at index ${index}`);
      }
      if (current.sequence < previous.sequence) {
        errors.push(`observations sequences must be non-decreasing at index ${index}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
