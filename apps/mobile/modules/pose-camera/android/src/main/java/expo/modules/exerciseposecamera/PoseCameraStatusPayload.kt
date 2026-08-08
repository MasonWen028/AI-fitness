package expo.modules.exerciseposecamera

data class PoseCameraStatusPayload(
  val isAvailable: Boolean,
  val providerName: String,
  val modelVersion: String,
  val delegate: String,
  val isRunning: Boolean,
  val lastError: String?,
  val health: PoseCameraHealth,
)
