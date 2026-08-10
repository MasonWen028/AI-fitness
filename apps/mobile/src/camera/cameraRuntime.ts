import { normalizeObservation } from '../analysis/normalization';
import type { PoseObservation } from '../pose/poseContract';
import { validatePoseObservation } from '../pose/poseValidation';
import type { CameraLifecycleState } from './cameraState';

export function shouldKeepNativeCameraActive(
  lifecycle: CameraLifecycleState,
): boolean {
  return (
    lifecycle === 'POSITIONING' ||
    lifecycle === 'CALIBRATING' ||
    lifecycle === 'READY' ||
    lifecycle === 'COUNTDOWN' ||
    lifecycle === 'ACTIVE' ||
    lifecycle === 'TRACKING_LOST'
  );
}

export function shouldAdvanceAnalysis(
  lifecycle: CameraLifecycleState,
): boolean {
  return lifecycle === 'ACTIVE';
}

export function shouldAttemptTrackingReacquisition(
  lifecycle: CameraLifecycleState,
): boolean {
  return lifecycle === 'TRACKING_LOST';
}

export function shouldEnterManualFallbackFromProviderMessage(
  message: string | undefined,
): boolean {
  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();
  return (
    normalized.includes('integrity') ||
    normalized.includes('manifest') ||
    normalized.includes('unsupported rotation')
  );
}

export function isTrackableObservation(observation: PoseObservation): boolean {
  const validation = validatePoseObservation(observation);
  if (!validation.valid) {
    return false;
  }

  const normalized = normalizeObservation(observation);
  return Boolean(
    normalized?.quality.personDetected &&
    normalized.quality.hasCriticalLandmarks,
  );
}
