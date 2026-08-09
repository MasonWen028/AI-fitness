import {
  isLandmarkName,
  LANDMARK_COUNT,
  LANDMARK_NAMES,
  type LandmarkName,
  type PoseObservation,
  type PoseDelegate,
  VALID_DELEGATES,
  VALID_ROTATIONS,
} from './poseContract';

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validatePoseObservation(obs: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof obs !== 'object' || obs === null) {
    return { valid: false, errors: ['observation is not an object'] };
  }

  const o = obs as Record<string, unknown>;

  if (typeof o.sequence !== 'number' || !Number.isFinite(o.sequence)) {
    errors.push('sequence must be a finite number');
  } else if (o.sequence < 0) {
    errors.push('sequence must be non-negative');
  }

  if (typeof o.timestampMs !== 'number' || !Number.isFinite(o.timestampMs)) {
    errors.push('timestampMs must be a finite number');
  } else if (o.timestampMs < 0) {
    errors.push('timestampMs must be non-negative');
  }

  if (typeof o.landmarksAvailable !== 'boolean') {
    errors.push('landmarksAvailable must be boolean');
  }

  if (typeof o.landmarkCount !== 'number' || !Number.isFinite(o.landmarkCount)) {
    errors.push('landmarkCount must be a finite number');
  } else if (o.landmarkCount < 0 || o.landmarkCount > LANDMARK_COUNT) {
    errors.push(`landmarkCount must be in range 0..${LANDMARK_COUNT}`);
  }

  if (typeof o.frameId !== 'number' || !Number.isFinite(o.frameId)) {
    errors.push('frameId must be a finite number');
  }

  const imageSize = o.imageSize as Record<string, unknown> | undefined;
  if (typeof imageSize !== 'object' || imageSize === null) {
    errors.push('imageSize must be an object');
  } else {
    if (typeof imageSize.width !== 'number' || imageSize.width <= 0) {
      errors.push('imageSize.width must be a positive number');
    }
    if (typeof imageSize.height !== 'number' || imageSize.height <= 0) {
      errors.push('imageSize.height must be a positive number');
    }
  }

  if (!VALID_ROTATIONS.includes(o.rotationDegrees as 0 | 90 | 180 | 270)) {
    errors.push(`rotationDegrees must be one of ${VALID_ROTATIONS.join(', ')}`);
  }

  if (typeof o.mirrored !== 'boolean') {
    errors.push('mirrored must be boolean');
  }

  if (!Array.isArray(o.people)) {
    errors.push('people must be an array');
  } else {
    o.people.forEach((person, i) => {
      validatePerson(person as Record<string, unknown>, i, errors);
    });
  }

  const provider = o.provider as Record<string, unknown> | undefined;
  if (typeof provider !== 'object' || provider === null) {
    errors.push('provider must be an object');
  } else {
    if (typeof provider.name !== 'string' || provider.name.length === 0) {
      errors.push('provider.name must be a non-empty string');
    }
    if (typeof provider.modelVersion !== 'string' || provider.modelVersion.length === 0) {
      errors.push('provider.modelVersion must be a non-empty string');
    }
    if (!VALID_DELEGATES.includes(provider.delegate as PoseDelegate)) {
      errors.push(`provider.delegate must be one of ${VALID_DELEGATES.join(', ')}`);
    }
    if (typeof provider.inferenceMs !== 'number' || !Number.isFinite(provider.inferenceMs)) {
      errors.push('provider.inferenceMs must be a finite number');
    } else if (provider.inferenceMs < 0) {
      errors.push('provider.inferenceMs must be non-negative');
    }
  }

  if (typeof o.landmarkCount === 'number' && Array.isArray(o.people)) {
    const actualCount = (o.people as Array<{ imageLandmarks?: unknown[] }>).reduce(
      (max, p) => Math.max(max, p.imageLandmarks?.length ?? 0),
      0,
    );
    if (o.landmarkCount !== actualCount && o.landmarksAvailable === true) {
      errors.push(
        `landmarkCount (${o.landmarkCount}) does not match max imageLandmarks length (${actualCount}) when landmarksAvailable is true`,
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

function validatePerson(
  person: Record<string, unknown>,
  index: number,
  errors: string[],
): void {
  const prefix = `people[${index}]`;

  if (person.trackingId !== undefined && typeof person.trackingId !== 'string') {
    errors.push(`${prefix}.trackingId must be string or undefined`);
  }

  if (!Array.isArray(person.imageLandmarks)) {
    errors.push(`${prefix}.imageLandmarks must be an array`);
  } else {
    person.imageLandmarks.forEach((lm, j) => {
      validateLandmark(lm as Record<string, unknown>, `${prefix}.imageLandmarks[${j}]`, errors);
    });
  }

  if (person.worldLandmarks !== undefined) {
    if (!Array.isArray(person.worldLandmarks)) {
      errors.push(`${prefix}.worldLandmarks must be an array or undefined`);
    } else {
      person.worldLandmarks.forEach((lm, j) => {
        validateLandmark(lm as Record<string, unknown>, `${prefix}.worldLandmarks[${j}]`, errors);
      });
    }
  }

  if (typeof person.posePresence !== 'number' || !Number.isFinite(person.posePresence)) {
    errors.push(`${prefix}.posePresence must be a finite number`);
  } else if (person.posePresence < 0 || person.posePresence > 1) {
    errors.push(`${prefix}.posePresence must be in range 0..1`);
  }
}

function validateLandmark(
  lm: Record<string, unknown>,
  prefix: string,
  errors: string[],
): void {
  if (typeof lm.name !== 'string' || !isLandmarkName(lm.name)) {
    errors.push(`${prefix}.name must be a valid LandmarkName`);
    return;
  }

  if (typeof lm.x !== 'number' || !Number.isFinite(lm.x)) {
    errors.push(`${prefix}.x must be a finite number`);
  }
  if (typeof lm.y !== 'number' || !Number.isFinite(lm.y)) {
    errors.push(`${prefix}.y must be a finite number`);
  }
  if (lm.z !== undefined && (typeof lm.z !== 'number' || !Number.isFinite(lm.z))) {
    errors.push(`${prefix}.z must be a finite number or undefined`);
  }
  if (
    lm.visibility !== undefined &&
    (typeof lm.visibility !== 'number' ||
      !Number.isFinite(lm.visibility) ||
      lm.visibility < 0 ||
      lm.visibility > 1)
  ) {
    errors.push(`${prefix}.visibility must be in range 0..1 or undefined`);
  }
  if (
    lm.presence !== undefined &&
    (typeof lm.presence !== 'number' ||
      !Number.isFinite(lm.presence) ||
      lm.presence < 0 ||
      lm.presence > 1)
  ) {
    errors.push(`${prefix}.presence must be in range 0..1 or undefined`);
  }
}

export function assertValidPoseObservation(obs: unknown): asserts obs is PoseObservation {
  const result = validatePoseObservation(obs);
  if (!result.valid) {
    throw new Error(`Invalid PoseObservation: ${result.errors.join('; ')}`);
  }
}

export function getLandmarkByName(
  observation: PoseObservation,
  name: LandmarkName,
  personIndex = 0,
): PoseObservation['people'][number]['imageLandmarks'][number] | undefined {
  const person = observation.people[personIndex];
  if (!person) return undefined;
  return person.imageLandmarks.find((lm) => lm.name === name);
}

export function getLandmarksByNames(
  observation: PoseObservation,
  names: readonly LandmarkName[],
  personIndex = 0,
): Array<{ name: LandmarkName; landmark: PoseObservation['people'][number]['imageLandmarks'][number] | undefined }> {
  const person = observation.people[personIndex];
  if (!person) {
    return names.map((name) => ({ name, landmark: undefined }));
  }
  const index = new Map(person.imageLandmarks.map((lm) => [lm.name, lm]));
  return names.map((name) => ({ name, landmark: index.get(name) }));
}

export function hasCriticalLandmarks(
  observation: PoseObservation,
  required: readonly LandmarkName[],
  personIndex = 0,
  minVisibility = 0.5,
): boolean {
  const landmarks = getLandmarksByNames(observation, required, personIndex);
  return landmarks.every(({ landmark }) => {
    if (!landmark) return false;
    if (landmark.visibility !== undefined && landmark.visibility < minVisibility) return false;
    return true;
  });
}

export function createEmptyObservation(
  overrides: Partial<PoseObservation> = {},
): PoseObservation {
  return {
    sequence: 0,
    timestampMs: 0,
    landmarksAvailable: false,
    landmarkCount: 0,
    frameId: 0,
    imageSize: { width: 1, height: 1 },
    rotationDegrees: 0,
    mirrored: false,
    people: [],
    provider: {
      name: 'unknown',
      modelVersion: 'unknown',
      delegate: 'UNKNOWN',
      inferenceMs: 0,
    },
    ...overrides,
  };
}

export function createSyntheticObservation(
  sequence: number,
  landmarks: Partial<Record<LandmarkName, { x: number; y: number; z?: number; visibility?: number }>>,
  overrides: Partial<PoseObservation> = {},
): PoseObservation {
  const hasLandmarks = Object.values(landmarks).some((v) => v !== undefined);

  if (!hasLandmarks) {
    return {
      sequence,
      timestampMs: sequence * 33,
      landmarksAvailable: false,
      landmarkCount: 0,
      frameId: sequence,
      imageSize: { width: 720, height: 1280 },
      rotationDegrees: 0,
      mirrored: false,
      people: [{ imageLandmarks: [], posePresence: 0 }],
      provider: {
        name: 'synthetic',
        modelVersion: 'test-fixture',
        delegate: 'CPU',
        inferenceMs: 0,
      },
      ...overrides,
    };
  }

  const imageLandmarks = LANDMARK_NAMES.map((name) => {
    const lm = landmarks[name];
    if (!lm) {
      return { name, x: 0, y: 0, visibility: 0 };
    }
    return { name, x: lm.x, y: lm.y, z: lm.z, visibility: lm.visibility ?? 1 };
  });

  return {
    sequence,
    timestampMs: sequence * 33,
    landmarksAvailable: true,
    landmarkCount: LANDMARK_NAMES.length,
    frameId: sequence,
    imageSize: { width: 720, height: 1280 },
    rotationDegrees: 0,
    mirrored: false,
    people: [
      {
        imageLandmarks,
        posePresence: 0.9,
      },
    ],
    provider: {
      name: 'synthetic',
      modelVersion: 'test-fixture',
      delegate: 'CPU',
      inferenceMs: 0,
    },
    ...overrides,
  };
}
