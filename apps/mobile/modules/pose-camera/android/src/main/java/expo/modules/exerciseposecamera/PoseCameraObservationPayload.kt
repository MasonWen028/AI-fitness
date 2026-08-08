package expo.modules.exerciseposecamera

data class PoseCameraObservationPayload(
  val sequence: Long,
  val timestampMs: Long,
  val landmarksAvailable: Boolean,
  val landmarkCount: Int,
  val frameId: Long,
  val imageSize: Map<String, Int>,
  val rotationDegrees: Int,
  val mirrored: Boolean,
  val people: List<Map<String, Any?>>, 
  val provider: Map<String, Any?>,
)
