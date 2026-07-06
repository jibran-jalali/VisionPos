from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    cache_ready: bool


class ProductSyncItem(BaseModel):
    id: str
    name: str
    sku: str | None = None
    barcode: str | None = None
    price: float | None = None
    is_active: bool = True


class SyncProductsRequest(BaseModel):
    products: list[ProductSyncItem]


class SyncProductsResponse(BaseModel):
    synced: int
    product_ids: list[str]


class ProcessVideoRequest(BaseModel):
    product_id: str
    video_path: str
    product_name: str | None = None
    sku: str | None = None
    barcode: str | None = None
    max_frames: int | None = Field(default=None, ge=1, le=400)


class ProcessVideoResponse(BaseModel):
    product_id: str
    product_name: str | None
    frame_count: int
    embedding_count: int
    profile_status: str
    embedding_model: str
    updated_at: datetime


class MatchImageRequest(BaseModel):
    image_path: str
    top_k: int = Field(default=3, ge=1, le=10)


class MatchCandidate(BaseModel):
    product_id: str
    product_name: str | None
    sku: str | None
    score: float
    accepted: bool
    match_type: str = "vision"


class MatchImageResponse(BaseModel):
    match: MatchCandidate | None
    candidates: list[MatchCandidate]
    barcode_detected: str | None = None


class DetectionEvent(BaseModel):
    type: str
    payload: dict[str, Any]
    created_at: datetime
