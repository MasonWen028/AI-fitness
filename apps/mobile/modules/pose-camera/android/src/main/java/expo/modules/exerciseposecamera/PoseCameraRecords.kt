package expo.modules.exerciseposecamera

data class PoseCameraHealth(
  val providerLoadAttempts: Long = 0,
  val providerLoadFailures: Long = 0,
  val framesReceived: Long = 0,
  val framesSubmitted: Long = 0,
  val framesDropped: Long = 0,
  val observationsProduced: Long = 0,
  val observationsWithLandmarks: Long = 0,
  val observationsWithoutLandmarks: Long = 0,
  val providerErrors: Long = 0,
  val trackingLossCount: Long = 0,
  val lastSequence: Long = 0,
  val lastFrameId: Long = 0,
  val lastTimestampMs: Long = 0,
  val lastInferenceMs: Long = 0,
)

data class PoseCameraConfig(
  val active: Boolean = false,
  val facing: String = "back",
  val mirrored: Boolean = false,
  val modelAssetPath: String = "pose_landmarker_lite.task",
  val delegate: String = "CPU",
)
