from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

from config import settings
from embedder import blur_score


def extract_frames(
    video_path: str,
    max_frames: int | None = None,
    stride_seconds: float | None = None,
    blur_threshold: float | None = None,
) -> list[np.ndarray]:
    path = Path(video_path)

    if not path.exists():
        raise FileNotFoundError(f"Video file not found: {path}")

    capture = cv2.VideoCapture(str(path))

    if not capture.isOpened():
        raise ValueError(f"Could not open video file: {path}")

    fps = capture.get(cv2.CAP_PROP_FPS) or 30
    frame_interval = max(1, int(fps * (stride_seconds or settings.frame_stride_seconds)))
    frame_limit = max_frames or settings.max_frames_per_video
    min_blur = blur_threshold or settings.blur_threshold

    frames: list[np.ndarray] = []
    frame_index = 0

    try:
        while len(frames) < frame_limit:
            success, frame = capture.read()

            if not success:
                break

            if frame_index % frame_interval == 0 and blur_score(frame) >= min_blur:
                frames.append(frame)

            frame_index += 1
    finally:
        capture.release()

    return frames
