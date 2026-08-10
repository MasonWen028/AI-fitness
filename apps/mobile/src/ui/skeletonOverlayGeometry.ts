import type {
  Landmark,
  LandmarkName,
  PoseObservation,
} from '../pose/poseContract';
import { getLandmarkByName } from '../pose/poseValidation';

export type OverlayPoint = {
  x: number;
  y: number;
};

export type SkeletonSegment = {
  from: LandmarkName;
  to: LandmarkName;
  start: OverlayPoint;
  end: OverlayPoint;
};

export const SQUAT_SKELETON_CONNECTIONS: ReadonlyArray<
  readonly [LandmarkName, LandmarkName]
> = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['right_hip', 'right_knee'],
  ['left_knee', 'left_ankle'],
  ['right_knee', 'right_ankle'],
] as const;

export function clampNormalizedCoordinate(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 1);
}

export function projectLandmarkToOverlay(
  landmark: Landmark,
  width: number,
  height: number,
): OverlayPoint {
  return {
    x: clampNormalizedCoordinate(landmark.x) * width,
    y: clampNormalizedCoordinate(landmark.y) * height,
  };
}

export function buildSkeletonSegments(
  observation: PoseObservation | null,
  width: number,
  height: number,
  personIndex = 0,
): SkeletonSegment[] {
  if (
    !observation ||
    !observation.landmarksAvailable ||
    width <= 0 ||
    height <= 0
  ) {
    return [];
  }

  return SQUAT_SKELETON_CONNECTIONS.flatMap(([from, to]) => {
    const fromLandmark = getLandmarkByName(observation, from, personIndex);
    const toLandmark = getLandmarkByName(observation, to, personIndex);

    if (!fromLandmark || !toLandmark) {
      return [];
    }

    return [
      {
        from,
        to,
        start: projectLandmarkToOverlay(fromLandmark, width, height),
        end: projectLandmarkToOverlay(toLandmark, width, height),
      },
    ];
  });
}

export function buildSkeletonJoints(
  observation: PoseObservation | null,
  width: number,
  height: number,
  personIndex = 0,
): Array<{ name: LandmarkName; point: OverlayPoint }> {
  if (
    !observation ||
    !observation.landmarksAvailable ||
    width <= 0 ||
    height <= 0
  ) {
    return [];
  }

  const jointNames = new Set<LandmarkName>(
    SQUAT_SKELETON_CONNECTIONS.flatMap(([from, to]) => [from, to]),
  );

  return [...jointNames].flatMap((name) => {
    const landmark = getLandmarkByName(observation, name, personIndex);
    if (!landmark) {
      return [];
    }

    return [{ name, point: projectLandmarkToOverlay(landmark, width, height) }];
  });
}
