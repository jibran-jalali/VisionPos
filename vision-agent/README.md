# VisionPOS Local Vision Agent

The Vision Agent is a small Python service that runs on the cashier PC. It handles webcam/product-video computer vision locally so the cloud web app does not need GPU hosting or live video uploads.

## Current Version

This first version provides a practical REST API foundation:

```text
GET  /health
POST /sync-products
POST /process-video
POST /match-image
WS   /detections
```

The current recognizer uses OpenCV HSV color-histogram embeddings as a lightweight baseline. This is not the final AI model, but it proves the full workflow:

```text
Product video -> extracted frames -> embeddings -> reusable product profile -> image matching
```

Later, the embedding layer can be upgraded to CLIP/MobileNet/FAISS without changing the web POS workflow.

## Setup

```bash
cd "D:\Desktop\vission pos\vision-agent"
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Agent URL:

```text
http://localhost:8765
```

## Process A Product Video

```bash
curl -X POST http://localhost:8765/process-video ^
  -H "Content-Type: application/json" ^
  -d "{\"product_id\":\"coke-500\",\"product_name\":\"Coke 500ml\",\"sku\":\"COKE-500\",\"video_path\":\"D:\\\\videos\\\\coke.mp4\"}"
```

## Match A Product Image

```bash
curl -X POST http://localhost:8765/match-image ^
  -H "Content-Type: application/json" ^
  -d "{\"image_path\":\"D:\\\\images\\\\test-coke.jpg\",\"top_k\":3}"
```

## Local Cache

Profiles are stored locally in:

```text
vision-agent/local_cache/profiles.json
```

Do not commit local cache files.
