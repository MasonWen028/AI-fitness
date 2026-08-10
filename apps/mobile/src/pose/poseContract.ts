export const LANDMARK_NAMES = [
  'nose',
  'left_eye_inner',
  'left_eye',
  'left_eye_outer',
  'right_eye_inner',
  'right_eye',
  'right_eye_outer',
  'left_ear',
  'right_ear',
  'mouth_left',
  'mouth_right',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_pinky',
  'right_pinky',
  'left_index',
  'right_index',
  'left_thumb',
  'right_thumb',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
  'left_heel',
  'right_heel',
  'left_foot_index',
  'right_foot_index',
] as const;

export type LandmarkName = (typeof LANDMARK_NAMES)[number];

export const LANDMARK_COUNT = LANDMARK_NAMES.length;

export const LANDMARK_INDEX: Readonly<Record<string, number>> =
  Object.fromEntries(LANDMARK_NAMES.map((name, index) => [name, index]));

export function isLandmarkName(name: string): name is LandmarkName {
  return name in LANDMARK_INDEX;
}

export const SQUAT_CRITICAL_LANDMARKS = [
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
  'left_shoulder',
  'right_shoulder',
] as const;

export type PoseDelegate = 'CPU' | 'GPU' | 'NPU' | 'UNKNOWN';

export const VALID_ROTATIONS = [0, 90, 180, 270] as const;
export const VALID_DELEGATES = ['CPU', 'GPU', 'NPU', 'UNKNOWN'] as const;

export type Landmark = {
  name: LandmarkName;
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  presence?: number;
};

export type PoseObservation = {
  sequence: number;
  timestampMs: number;
  landmarksAvailable: boolean;
  landmarkCount: number;
  frameId: number;
  imageSize: {
    width: number;
    height: number;
  };
  rotationDegrees: 0 | 90 | 180 | 270;
  mirrored: boolean;
  people: Array<{
    trackingId?: string;
    imageLandmarks: Landmark[];
    worldLandmarks?: Landmark[];
    posePresence: number;
  }>;
  provider: {
    name: string;
    modelVersion: string;
    delegate: PoseDelegate;
    inferenceMs: number;
  };
};
