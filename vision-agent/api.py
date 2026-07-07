from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from config import ensure_cache_dirs
from matcher import match_image, match_image_bytes
from models import (
    DetectionEvent,
    HealthResponse,
    MatchImageRequest,
    MatchImageResponse,
    ProcessVideoRequest,
    ProcessVideoResponse,
    SyncProductsRequest,
    SyncProductsResponse,
)
from storage import cache_exists, upsert_product
from video_processor import process_product_images, process_product_video


app = FastAPI(title="VisionPOS Local Vision Agent", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    ensure_cache_dirs()


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="visionpos-agent",
        version="0.1.0",
        cache_ready=cache_exists(),
    )


@app.post("/sync-products", response_model=SyncProductsResponse)
def sync_products(request: SyncProductsRequest) -> SyncProductsResponse:
    product_ids: list[str] = []

    for product in request.products:
        if not product.is_active:
            continue

        upsert_product(product.id, product.name, product.sku, product.price, product.barcode)
        product_ids.append(product.id)

    return SyncProductsResponse(synced=len(product_ids), product_ids=product_ids)


@app.post("/process-video", response_model=ProcessVideoResponse)
def process_video(request: ProcessVideoRequest) -> ProcessVideoResponse:
    try:
        return process_product_video(request)
    except (FileNotFoundError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/match-image", response_model=MatchImageResponse)
def match_uploaded_image(request: MatchImageRequest) -> MatchImageResponse:
    try:
        return match_image(request)
    except (FileNotFoundError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/match-frame", response_model=MatchImageResponse)
async def match_frame(frame: UploadFile = File(...), top_k: int = Form(default=3)) -> MatchImageResponse:
    try:
        image_bytes = await frame.read()
        return match_image_bytes(image_bytes, top_k=top_k)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/process-video-upload", response_model=ProcessVideoResponse)
async def process_video_upload(
    product_id: str = Form(...),
    product_name: str | None = Form(default=None),
    sku: str | None = Form(default=None),
    barcode: str | None = Form(default=None),
    video: UploadFile = File(...),
) -> ProcessVideoResponse:
    suffix = Path(video.filename or "product-video.mp4").suffix or ".mp4"
    temp_path: str | None = None

    try:
        with NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(await video.read())
            temp_path = temp_file.name

        return process_product_video(
            ProcessVideoRequest(
                product_id=product_id,
                product_name=product_name,
                sku=sku,
                barcode=barcode,
                video_path=temp_path,
            )
        )
    except (FileNotFoundError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    finally:
        if temp_path is not None:
            try:
                Path(temp_path).unlink(missing_ok=True)
            except Exception:
                pass


@app.post("/process-images", response_model=ProcessVideoResponse)
async def process_images(
    product_id: str = Form(...),
    product_name: str | None = Form(default=None),
    sku: str | None = Form(default=None),
    barcode: str | None = Form(default=None),
    images: list[UploadFile] = File(...),
) -> ProcessVideoResponse:
    temp_paths: list[str] = []

    try:
        for image in images:
            suffix = Path(image.filename or "frame.jpg").suffix or ".jpg"
            with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(await image.read())
                temp_paths.append(tmp.name)

        return process_product_images(
            product_id=product_id,
            product_name=product_name,
            sku=sku,
            barcode=barcode,
            image_paths=temp_paths,
        )
    except (FileNotFoundError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    finally:
        for path_str in temp_paths:
            try:
                Path(path_str).unlink(missing_ok=True)
            except Exception:
                pass


@app.websocket("/detections")
async def detections(websocket: WebSocket) -> None:
    await websocket.accept()

    try:
        while True:
            event = DetectionEvent(
                type="agent_status",
                payload={"status": "standby", "message": "Camera detection stream will be connected in the next phase."},
                created_at=datetime.now(timezone.utc),
            )
            await websocket.send_json(event.model_dump(mode="json"))
            await asyncio.sleep(2)
    except Exception:
        await websocket.close()
