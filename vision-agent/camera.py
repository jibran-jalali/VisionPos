from __future__ import annotations

import cv2


class CameraSession:
    def __init__(self, camera_index: int = 0) -> None:
        self.camera_index = camera_index
        self.capture: cv2.VideoCapture | None = None

    def start(self) -> None:
        if self.capture is not None:
            return

        capture = cv2.VideoCapture(self.camera_index)

        if not capture.isOpened():
            raise RuntimeError(f"Could not open camera index {self.camera_index}")

        self.capture = capture

    def read_frame(self):
        if self.capture is None:
            self.start()

        assert self.capture is not None
        success, frame = self.capture.read()

        if not success:
            raise RuntimeError("Could not read frame from camera")

        return frame

    def stop(self) -> None:
        if self.capture is not None:
            self.capture.release()
            self.capture = None
