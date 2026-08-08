import * as React from 'react';
import { requireNativeViewManager } from 'expo-modules-core';

import type { PoseObservation } from '../../../src/pose/poseContract';
import type { PoseProviderStatus } from '../../../src/pose/poseProviderStatus';

export type PoseCameraStatusEvent = {
  nativeEvent: PoseProviderStatus;
};

export type PoseCameraObservationEvent = {
  nativeEvent: PoseObservation;
};

export type PoseCameraErrorEvent = {
  nativeEvent: {
    message: string;
  };
};

export type PoseCameraViewProps = {
  facing?: 'front' | 'back';
  mirrored?: boolean;
  modelAssetPath?: string;
  delegate?: 'CPU' | 'GPU';
  active?: boolean;
  onProviderStatus?: (event: PoseCameraStatusEvent) => void;
  onPoseObservation?: (event: PoseCameraObservationEvent) => void;
  onProviderError?: (event: PoseCameraErrorEvent) => void;
  style?: object;
};

const NativePoseCameraView =
  requireNativeViewManager<PoseCameraViewProps>('ExercisePoseCamera');

export default function PoseCameraView(props: PoseCameraViewProps) {
  return <NativePoseCameraView {...props} />;
}
