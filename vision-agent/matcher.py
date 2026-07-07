from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

from barcode_scanner import decode_barcode
from config import settings
from embedder import compute_embedding, cosine_similarity
from models import MatchCandidate, MatchImageRequest, MatchImageResponse
from storage import all_profiles, lookup_by_barcode


def _match_embedding(query_embedding: list[float], top_k: int) -> MatchImageResponse:
    candidates: list[MatchCandidate] = []

    for profile in all_profiles():
        embeddings = profile.get("embeddings", [])

        if not embeddings:
            continue

        score = max(cosine_similarity(query_embedding, embedding) for embedding in embeddings)
        candidates.append(
            MatchCandidate(
                product_id=profile["id"],
                product_name=profile.get("name"),
                sku=profile.get("sku"),
                score=round(score, 4),
                accepted=score >= settings.confidence_threshold,
            )
        )

    candidates.sort(key=lambda candidate: candidate.score, reverse=True)
    candidates = candidates[:top_k]
    match = candidates[0] if candidates and candidates[0].accepted else None

    return MatchImageResponse(match=match, candidates=candidates)


def match_image(request: MatchImageRequest) -> MatchImageResponse:
    image_path = Path(request.image_path)

    if not image_path.exists():
        raise FileNotFoundError(f"Image file not found: {image_path}")

    image = cv2.imread(str(image_path))

    if image is None:
        raise ValueError(f"Could not read image file: {image_path}")

    return match_image_array(image, top_k=request.top_k)


def match_image_bytes(image_bytes: bytes, top_k: int = 3) -> MatchImageResponse:
    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Could not decode image bytes")

    return match_image_array(image, top_k=top_k)


def match_image_array(image, top_k: int = 3) -> MatchImageResponse:
    barcode_value = decode_barcode(image)
    if barcode_value:
        product = lookup_by_barcode(barcode_value)
        if product:
            candidate = MatchCandidate(
                product_id=product["id"],
                product_name=product.get("name"),
                sku=product.get("sku"),
                score=1.0,
                accepted=True,
                match_type="barcode",
            )
            return MatchImageResponse(
                match=candidate,
                candidates=[candidate],
                barcode_detected=barcode_value,
            )

    query_embedding = compute_embedding(image)
    result = _match_embedding(query_embedding, top_k=top_k)
    result.barcode_detected = barcode_value
    return result
