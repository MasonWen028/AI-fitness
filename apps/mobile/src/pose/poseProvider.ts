import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';

import type { PoseObservation } from './poseContract';
import {
  adaptNativePoseObservation,
  adaptNativePoseProviderStatus,
} from './poseEventAdapters';
import {
  getUnavailablePoseProviderStatus,
  type PoseProviderStatus,
} from './poseProviderStatus';

export type {
  PoseProviderHealth,
  PoseProviderStatus,
} from './poseProviderStatus';

export type PoseProviderConfig = {
  lensFacing: 'front' | 'back';
  mirrored: boolean;
  imageWidth: number;
  imageHeight: number;
  rotationDegrees: 0 | 90 | 180 | 270;
  delegate?: 'CPU' | 'GPU';
  modelAssetPath?: string;
};

type NativePoseProviderModule = {
  getStatus(): Promise<PoseProviderStatus>;
  start(config: PoseProviderConfig): Promise<PoseProviderStatus>;
  stop(): Promise<PoseProviderStatus>;
};

const nativeModuleName = 'PoseProviderModule';
const nativeModule = NativeModules[nativeModuleName] as
  NativePoseProviderModule | undefined;
const unavailableStatus = getUnavailablePoseProviderStatus(Platform.OS);

export { getUnavailablePoseProviderStatus } from './poseProviderStatus';

export async function getPoseProviderStatus(): Promise<PoseProviderStatus> {
  if (!nativeModule) {
    return unavailableStatus;
  }

  return adaptNativePoseProviderStatus(await nativeModule.getStatus());
}

export async function startPoseProvider(
  config: PoseProviderConfig,
): Promise<PoseProviderStatus> {
  if (!nativeModule) {
    return unavailableStatus;
  }

  return adaptNativePoseProviderStatus(await nativeModule.start(config));
}

export async function stopPoseProvider(): Promise<PoseProviderStatus> {
  if (!nativeModule) {
    return unavailableStatus;
  }

  return adaptNativePoseProviderStatus(await nativeModule.stop());
}

export function observePoseProvider(
  onObservation: (observation: PoseObservation) => void,
  onStatus: (status: PoseProviderStatus) => void,
) {
  const observationSubscription = DeviceEventEmitter.addListener(
    'poseObservation',
    (observation) => {
      onObservation(adaptNativePoseObservation(observation));
    },
  );
  const statusSubscription = DeviceEventEmitter.addListener(
    'poseProviderStatus',
    (status) => {
      onStatus(adaptNativePoseProviderStatus(status));
    },
  );

  return {
    remove() {
      observationSubscription.remove();
      statusSubscription.remove();
    },
  };
}
