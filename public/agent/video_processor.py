from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np

from config import settings
from embedder import compute_embedding
from frame_extractor import extract_frames
from models import ProcessVideoRequest, ProcessVideoResponse
from storage import upsert_visual_profile


def process_product_video(request: ProcessVideoRequest) -> ProcessVideoResponse:
    frames = extract_frames(
        request.video_path,
        max_frames=request.max_frames,
        stride_seconds=settings.frame_stride_seconds,
        blur_threshold=settings.blur_threshold,
    )

    if not frames:
        raise ValueError(
            "Could not extract any frames from the video. "
            "The format may not be supported. Try using the 'Capture frames' tab "
            "to take photos directly from the camera instead."
        )

    embeddings = [compute_embedding(frame) for frame in frames]
    profile = upsert_visual_profile(
        product_id=request.product_id,
        product_name=request.product_name,
        sku=request.sku,
        barcode=request.barcode,
        embeddings=embeddings,
        frame_count=len(frames),
    )

    return ProcessVideoResponse(
        product_id=request.product_id,
        product_name=profile.get("name"),
        frame_count=len(frames),
        embedding_count=len(embeddings),
        profile_status=profile["profile_status"],
        embedding_model=settings.embedding_model,
        updated_at=datetime.now(timezone.utc),
    )


def process_product_images(
    product_id: str,
    product_name: str | None,
    sku: str | None,
    image_paths: list[str],
    barcode: str | None = None,
) -> ProcessVideoResponse:
    frames: list[np.ndarray] = []

    for path_str in image_paths:
        path = Path(path_str)
        if not path.exists():
            raise FileNotFoundError(f"Image file not found: {path}")

        image = cv2.imread(str(path))
        if image is None:
            raise ValueError(f"Could not read image file: {path}")

        frames.append(image)

    if not frames:
        raise ValueError("No valid images were provided.")

    embeddings = [compute_embedding(frame) for frame in frames]
    profile = upsert_visual_profile(
        product_id=product_id,
        product_name=product_name,
        sku=sku,
        barcode=barcode,
        embeddings=embeddings,
        frame_count=len(frames),
    )

    return ProcessVideoResponse(
        product_id=product_id,
        product_name=profile.get("name"),
        frame_count=len(frames),
        embedding_count=len(embeddings),
        profile_status=profile["profile_status"],
        embedding_model=settings.embedding_model,
        updated_at=datetime.now(timezone.utc),
    )
