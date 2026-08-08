export type CameraPermissionState =
  'loading' | 'granted' | 'denied' | 'undetermined';

export type CameraLifecycleState =
  | 'unavailable'
  | 'ready_to_setup'
  | 'requesting_permission'
  | 'permission_denied'
  | 'preview_active'
  | 'preview_interrupted'
  | 'manual_fallback';

export type CameraScreenState = {
  permission: CameraPermissionState;
  lifecycle: CameraLifecycleState;
  canShowPreview: boolean;
  canRequestPermission: boolean;
  shouldShowManualFallback: boolean;
  statusMessage: string;
};

export type CameraPermissionSnapshot = {
  isLoading: boolean;
  granted: boolean;
  canAskAgain: boolean;
};

export type CameraInterruptReason =
  'backgrounded' | 'mount_error' | 'permission_denied' | 'unsupported';

export type CameraScreenEvent =
  | { type: 'permission_snapshot'; snapshot: CameraPermissionSnapshot | null }
  | { type: 'request_permission_started' }
  | { type: 'start_preview' }
  | { type: 'camera_ready' }
  | { type: 'camera_interrupted'; reason: CameraInterruptReason }
  | { type: 'enter_manual_fallback' };

const READY_MESSAGE =
  'Review setup guidance before starting camera validation.';
const PERMISSION_MESSAGE =
  'Camera permission is required for M0-B preview validation.';
const ACTIVE_MESSAGE = 'Camera preview active for M0-B pipeline verification.';
const INTERRUPTED_MESSAGE =
  'Camera preview interrupted. Restart or switch to manual fallback.';
const DENIED_MESSAGE =
  'Camera permission denied. Manual fallback remains available.';
const MANUAL_FALLBACK_MESSAGE =
  'Manual fallback active. Camera preview is not running.';
const UNAVAILABLE_MESSAGE = 'Camera permission state is still loading.';

export function deriveInitialCameraState(): CameraScreenState {
  return {
    permission: 'loading',
    lifecycle: 'unavailable',
    canShowPreview: false,
    canRequestPermission: false,
    shouldShowManualFallback: false,
    statusMessage: UNAVAILABLE_MESSAGE,
  };
}

export function reduceCameraScreenState(
  current: CameraScreenState,
  event: CameraScreenEvent,
): CameraScreenState {
  switch (event.type) {
    case 'permission_snapshot':
      return derivePermissionSnapshotState(event.snapshot);
    case 'request_permission_started':
      return {
        ...current,
        lifecycle: 'requesting_permission',
        canRequestPermission: false,
        statusMessage: PERMISSION_MESSAGE,
      };
    case 'start_preview':
      if (current.permission !== 'granted') {
        return current;
      }
      return {
        ...current,
        lifecycle: 'preview_active',
        canShowPreview: true,
        shouldShowManualFallback: false,
        statusMessage: ACTIVE_MESSAGE,
      };
    case 'camera_ready':
      return current;
    case 'camera_interrupted':
      return deriveInterruptedState(current.permission, event.reason);
    case 'enter_manual_fallback':
      return {
        ...current,
        lifecycle: 'manual_fallback',
        canShowPreview: false,
        shouldShowManualFallback: true,
        statusMessage: MANUAL_FALLBACK_MESSAGE,
      };
    default:
      return current;
  }
}

function derivePermissionSnapshotState(
  snapshot: CameraPermissionSnapshot | null,
): CameraScreenState {
  if (!snapshot || snapshot.isLoading) {
    return deriveInitialCameraState();
  }

  if (snapshot.granted) {
    return {
      permission: 'granted',
      lifecycle: 'ready_to_setup',
      canShowPreview: false,
      canRequestPermission: false,
      shouldShowManualFallback: false,
      statusMessage: READY_MESSAGE,
    };
  }

  return {
    permission: snapshot.canAskAgain ? 'undetermined' : 'denied',
    lifecycle: snapshot.canAskAgain ? 'ready_to_setup' : 'permission_denied',
    canShowPreview: false,
    canRequestPermission: snapshot.canAskAgain,
    shouldShowManualFallback: !snapshot.canAskAgain,
    statusMessage: snapshot.canAskAgain ? PERMISSION_MESSAGE : DENIED_MESSAGE,
  };
}

function deriveInterruptedState(
  permission: CameraPermissionState,
  reason: CameraInterruptReason,
): CameraScreenState {
  if (reason === 'permission_denied') {
    return {
      permission: 'denied',
      lifecycle: 'permission_denied',
      canShowPreview: false,
      canRequestPermission: false,
      shouldShowManualFallback: true,
      statusMessage: DENIED_MESSAGE,
    };
  }

  if (reason === 'unsupported') {
    return {
      permission: 'denied',
      lifecycle: 'manual_fallback',
      canShowPreview: false,
      canRequestPermission: false,
      shouldShowManualFallback: true,
      statusMessage: MANUAL_FALLBACK_MESSAGE,
    };
  }

  return {
    permission,
    lifecycle: 'preview_interrupted',
    canShowPreview: false,
    canRequestPermission: false,
    shouldShowManualFallback: true,
    statusMessage: INTERRUPTED_MESSAGE,
  };
}
