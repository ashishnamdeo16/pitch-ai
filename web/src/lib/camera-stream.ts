/** Tracks the active mirror camera stream so it can be stopped on route change. */
let activeStream: MediaStream | null = null;

export function registerCameraStream(stream: MediaStream): void {
  stopCameraStream();
  activeStream = stream;
}

export function stopCameraStream(): void {
  activeStream?.getTracks().forEach((track) => track.stop());
  activeStream = null;
}

export function hasActiveCameraStream(): boolean {
  return activeStream !== null;
}
