from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from config import ensure_cache_dirs, settings


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _empty_db() -> dict[str, Any]:
    return {
        "version": 1,
        "embedding_model": settings.embedding_model,
        "products": {},
    }


def load_db() -> dict[str, Any]:
    ensure_cache_dirs()

    if not settings.profiles_path.exists():
        return _empty_db()

    with settings.profiles_path.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_db(db: dict[str, Any]) -> None:
    ensure_cache_dirs()
    temp_path = settings.profiles_path.with_suffix(".tmp")

    with temp_path.open("w", encoding="utf-8") as file:
        json.dump(db, file, indent=2)

    temp_path.replace(settings.profiles_path)


def upsert_product(
    product_id: str,
    name: str,
    sku: str | None = None,
    price: float | None = None,
    barcode: str | None = None,
) -> dict[str, Any]:
    db = load_db()
    existing = db["products"].get(product_id, {})
    profile = {
        **existing,
        "id": product_id,
        "name": name,
        "sku": sku,
        "barcode": barcode if barcode is not None else existing.get("barcode"),
        "price": price,
        "updated_at": utc_now_iso(),
        "embeddings": existing.get("embeddings", []),
        "frame_count": existing.get("frame_count", 0),
        "profile_status": existing.get("profile_status", "NOT_STARTED"),
    }
    db["products"][product_id] = profile
    save_db(db)
    return profile


def lookup_by_barcode(barcode: str) -> dict[str, Any] | None:
    db = load_db()
    for product in db["products"].values():
        if product.get("barcode") == barcode:
            return product
    return None


def upsert_visual_profile(
    product_id: str,
    product_name: str | None,
    sku: str | None,
    embeddings: list[list[float]],
    frame_count: int,
    barcode: str | None = None,
) -> dict[str, Any]:
    db = load_db()
    existing = db["products"].get(product_id, {})
    profile = {
        **existing,
        "id": product_id,
        "name": product_name or existing.get("name") or product_id,
        "sku": sku if sku is not None else existing.get("sku"),
        "barcode": barcode if barcode is not None else existing.get("barcode"),
        "embeddings": embeddings,
        "frame_count": frame_count,
        "embedding_model": settings.embedding_model,
        "profile_status": "READY" if embeddings else "FAILED",
        "updated_at": utc_now_iso(),
    }
    db["products"][product_id] = profile
    save_db(db)
    return profile


def all_profiles() -> list[dict[str, Any]]:
    db = load_db()
    return list(db["products"].values())


def cache_exists() -> bool:
    ensure_cache_dirs()
    return Path(settings.cache_dir).exists()
