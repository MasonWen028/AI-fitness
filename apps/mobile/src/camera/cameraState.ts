export type CameraPermissionState =
  'loading' | 'granted' | 'denied' | 'undetermined';

export type CameraLifecycleState =
  | 'UNAVAILABLE'
  | 'READY_TO_SETUP'
  | 'REQUESTING_PERMISSION'
  | 'POSITIONING'
  | 'CALIBRATING'
  | 'READY'
  | 'COUNTDOWN'
  | 'ACTIVE'
  | 'TRACKING_LOST'
  | 'PAUSED'
  | 'SET_COMPLETE'
  | 'ERROR'
  | 'MANUAL_FALLBACK';

export type CameraTransitionCause =
  | 'init'
  | 'permission_loading'
  | 'supported_profile_available'
  | 'permission_requested'
  | 'permission_granted'
  | 'permission_denied'
  | 'permission_subsystem_failure'
  | 'setup_started'
  | 'setup_quality_eligible'
  | 'calibration_passed'
  | 'calibration_recoverable_failure'
  | 'countdown_started'
  | 'countdown_completed'
  | 'countdown_paused'
  | 'countdown_quality_lost'
  | 'setup_invalidated'
  | 'tracking_lost'
  | 'tracking_reacquired'
  | 'lifecycle_interruption'
  | 'resume_requested'
  | 'set_completed'
  | 'unsupported'
  | 'retry_requested'
  | 'technical_failure'
  | 'manual_fallback_requested'
  | 'manual_fallback_required';

export type CameraScreenState = {
  permission: CameraPermissionState;
  lifecycle: CameraLifecycleState;
  cause: CameraTransitionCause;
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

export type CameraScreenEvent =
  | { type: 'permission_snapshot'; snapshot: CameraPermissionSnapshot | null }
  | { type: 'request_permission_started' }
  | { type: 'start_setup' }
  | { type: 'setup_quality_eligible' }
  | { type: 'calibration_passed' }
  | { type: 'calibration_recoverable_failure' }
  | { type: 'start_countdown' }
  | { type: 'countdown_completed' }
  | { type: 'countdown_paused' }
  | { type: 'countdown_quality_lost' }
  | { type: 'setup_invalidated' }
  | { type: 'tracking_lost' }
  | { type: 'tracking_reacquired' }
  | { type: 'pause_requested' }
  | { type: 'resume_requested' }
  | { type: 'set_completed' }
  | {
      type: 'enter_manual_fallback';
      cause?: Extract<
        CameraTransitionCause,
        | 'manual_fallback_requested'
        | 'manual_fallback_required'
        | 'permission_denied'
        | 'unsupported'
      >;
    }
  | { type: 'technical_error' }
  | { type: 'retry_setup' }
  | { type: 'unsupported' };

const STATUS_MESSAGES: Record<CameraLifecycleState, string> = {
  UNAVAILABLE:
    'AI Form Check is unavailable while permissions or capability are unresolved.',
  READY_TO_SETUP: 'Form Check is ready to set up.',
  REQUESTING_PERMISSION: 'Camera permission is being requested.',
  POSITIONING: 'Position yourself in frame and follow setup guidance.',
  CALIBRATING: 'Hold still while setup quality is verified.',
  READY: 'Setup is valid. Start the countdown when ready.',
  COUNTDOWN: 'Countdown in progress. Reps are not recorded yet.',
  ACTIVE: 'Analysis active. Phase, reps, faults, and feedback may advance.',
  TRACKING_LOST: 'Tracking lost. Reposition to resume analysis safely.',
  PAUSED: 'Analysis paused. Resume restarts with countdown.',
  SET_COMPLETE: 'Set complete. Camera resources are released.',
  ERROR: 'A technical failure occurred. Retry setup or use manual fallback.',
  MANUAL_FALLBACK: 'Manual fallback active. AI analysis is stopped.',
};

const MANUAL_FALLBACK_STATES = new Set<CameraLifecycleState>([
  'MANUAL_FALLBACK',
]);
const PREVIEW_STATES = new Set<CameraLifecycleState>([
  'POSITIONING',
  'CALIBRATING',
  'READY',
  'COUNTDOWN',
  'ACTIVE',
  'TRACKING_LOST',
]);

type TransitionRule = {
  from: readonly CameraLifecycleState[];
  to: CameraLifecycleState;
  cause: CameraTransitionCause;
};

const TRANSITIONS: Record<
  Exclude<
    CameraScreenEvent['type'],
    'permission_snapshot' | 'enter_manual_fallback'
  >,
  TransitionRule
> = {
  request_permission_started: {
    from: ['READY_TO_SETUP'],
    to: 'REQUESTING_PERMISSION',
    cause: 'permission_requested',
  },
  start_setup: {
    from: ['READY_TO_SETUP'],
    to: 'POSITIONING',
    cause: 'setup_started',
  },
  setup_quality_eligible: {
    from: ['POSITIONING'],
    to: 'CALIBRATING',
    cause: 'setup_quality_eligible',
  },
  calibration_passed: {
    from: ['CALIBRATING'],
    to: 'READY',
    cause: 'calibration_passed',
  },
  calibration_recoverable_failure: {
    from: ['CALIBRATING'],
    to: 'POSITIONING',
    cause: 'calibration_recoverable_failure',
  },
  start_countdown: {
    from: ['READY'],
    to: 'COUNTDOWN',
    cause: 'countdown_started',
  },
  countdown_completed: {
    from: ['COUNTDOWN'],
    to: 'ACTIVE',
    cause: 'countdown_completed',
  },
  countdown_paused: {
    from: ['COUNTDOWN'],
    to: 'PAUSED',
    cause: 'countdown_paused',
  },
  countdown_quality_lost: {
    from: ['COUNTDOWN'],
    to: 'POSITIONING',
    cause: 'countdown_quality_lost',
  },
  setup_invalidated: {
    from: ['READY'],
    to: 'POSITIONING',
    cause: 'setup_invalidated',
  },
  tracking_lost: {
    from: ['ACTIVE'],
    to: 'TRACKING_LOST',
    cause: 'tracking_lost',
  },
  tracking_reacquired: {
    from: ['TRACKING_LOST'],
    to: 'ACTIVE',
    cause: 'tracking_reacquired',
  },
  pause_requested: {
    from: ['ACTIVE', 'TRACKING_LOST'],
    to: 'PAUSED',
    cause: 'lifecycle_interruption',
  },
  resume_requested: {
    from: ['PAUSED'],
    to: 'COUNTDOWN',
    cause: 'resume_requested',
  },
  set_completed: {
    from: ['ACTIVE', 'TRACKING_LOST', 'PAUSED'],
    to: 'SET_COMPLETE',
    cause: 'set_completed',
  },
  technical_error: {
    from: [
      'REQUESTING_PERMISSION',
      'POSITIONING',
      'CALIBRATING',
      'ACTIVE',
      'TRACKING_LOST',
    ],
    to: 'ERROR',
    cause: 'technical_failure',
  },
  retry_setup: {
    from: ['ERROR'],
    to: 'READY_TO_SETUP',
    cause: 'retry_requested',
  },
  unsupported: {
    from: ['UNAVAILABLE', 'READY_TO_SETUP'],
    to: 'MANUAL_FALLBACK',
    cause: 'unsupported',
  },
};

export function deriveInitialCameraState(): CameraScreenState {
  return createState('loading', 'UNAVAILABLE', 'permission_loading');
}

export function reduceCameraScreenState(
  current: CameraScreenState,
  event: CameraScreenEvent,
): CameraScreenState {
  if (event.type === 'permission_snapshot') {
    return derivePermissionSnapshotState(current, event.snapshot);
  }

  if (event.type === 'enter_manual_fallback') {
    const cause = event.cause ?? 'manual_fallback_requested';
    return createState(
      current.permission,
      'MANUAL_FALLBACK',
      cause,
      current.canRequestPermission,
    );
  }

  const rule = TRANSITIONS[event.type];
  if (!rule.from.includes(current.lifecycle)) {
    return current;
  }

  return createState(
    current.permission,
    rule.to,
    rule.cause,
    current.canRequestPermission,
  );
}

export function isPreviewLifecycleState(
  lifecycle: CameraLifecycleState,
): boolean {
  return PREVIEW_STATES.has(lifecycle);
}

function derivePermissionSnapshotState(
  current: CameraScreenState,
  snapshot: CameraPermissionSnapshot | null,
): CameraScreenState {
  if (!snapshot || snapshot.isLoading) {
    if (
      MANUAL_FALLBACK_STATES.has(current.lifecycle) ||
      current.lifecycle === 'SET_COMPLETE'
    ) {
      return {
        ...current,
        permission: 'loading',
        canRequestPermission: false,
      };
    }

    return createState('loading', 'UNAVAILABLE', 'permission_loading');
  }

  if (snapshot.granted) {
    if (current.lifecycle === 'REQUESTING_PERMISSION') {
      return createState('granted', 'POSITIONING', 'permission_granted');
    }

    if (
      current.lifecycle === 'POSITIONING' ||
      current.lifecycle === 'CALIBRATING' ||
      current.lifecycle === 'READY' ||
      current.lifecycle === 'COUNTDOWN' ||
      current.lifecycle === 'ACTIVE' ||
      current.lifecycle === 'TRACKING_LOST' ||
      current.lifecycle === 'PAUSED' ||
      current.lifecycle === 'SET_COMPLETE' ||
      current.lifecycle === 'MANUAL_FALLBACK'
    ) {
      return {
        ...current,
        permission: 'granted',
        canRequestPermission: false,
      };
    }

    return createState(
      'granted',
      'READY_TO_SETUP',
      'supported_profile_available',
    );
  }

  const permission = snapshot.canAskAgain ? 'undetermined' : 'denied';

  if (current.lifecycle === 'REQUESTING_PERMISSION') {
    return createState(
      permission,
      snapshot.canAskAgain ? 'MANUAL_FALLBACK' : 'MANUAL_FALLBACK',
      'permission_denied',
      snapshot.canAskAgain,
    );
  }

  if (
    current.lifecycle === 'ACTIVE' ||
    current.lifecycle === 'TRACKING_LOST' ||
    current.lifecycle === 'COUNTDOWN' ||
    current.lifecycle === 'READY' ||
    current.lifecycle === 'POSITIONING' ||
    current.lifecycle === 'CALIBRATING'
  ) {
    return createState(
      permission,
      snapshot.canAskAgain ? 'READY_TO_SETUP' : 'MANUAL_FALLBACK',
      snapshot.canAskAgain ? 'setup_invalidated' : 'permission_denied',
      snapshot.canAskAgain,
    );
  }

  if (current.lifecycle === 'MANUAL_FALLBACK') {
    return createState(
      permission,
      'MANUAL_FALLBACK',
      current.cause,
      snapshot.canAskAgain,
    );
  }

  return createState(
    permission,
    snapshot.canAskAgain ? 'READY_TO_SETUP' : 'MANUAL_FALLBACK',
    snapshot.canAskAgain ? 'supported_profile_available' : 'permission_denied',
    snapshot.canAskAgain,
  );
}

function createState(
  permission: CameraPermissionState,
  lifecycle: CameraLifecycleState,
  cause: CameraTransitionCause,
  canRequestPermission = false,
): CameraScreenState {
  return {
    permission,
    lifecycle,
    cause,
    canShowPreview: isPreviewLifecycleState(lifecycle),
    canRequestPermission,
    shouldShowManualFallback:
      lifecycle === 'MANUAL_FALLBACK' ||
      lifecycle === 'ERROR' ||
      lifecycle === 'READY_TO_SETUP' ||
      lifecycle === 'UNAVAILABLE',
    statusMessage: STATUS_MESSAGES[lifecycle],
  };
}
