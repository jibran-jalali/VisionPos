from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent


@dataclass(frozen=True)
class AgentSettings:
    host: str = os.getenv("VISIONPOS_AGENT_HOST", "127.0.0.1")
    port: int = int(os.getenv("VISIONPOS_AGENT_PORT", "8767"))
    cache_dir: Path = Path(os.getenv("VISIONPOS_AGENT_CACHE", str(BASE_DIR / "local_cache")))
    embedding_model: str = "hsv_histogram_v1"
    confidence_threshold: float = float(os.getenv("VISIONPOS_CONFIDENCE_THRESHOLD", "0.82"))
    max_frames_per_video: int = int(os.getenv("VISIONPOS_MAX_FRAMES", "80"))
    frame_stride_seconds: float = float(os.getenv("VISIONPOS_FRAME_STRIDE_SECONDS", "0.35"))
    blur_threshold: float = float(os.getenv("VISIONPOS_BLUR_THRESHOLD", "45"))

    @property
    def profiles_path(self) -> Path:
        return self.cache_dir / "profiles.json"


settings = AgentSettings()


def ensure_cache_dirs() -> None:
    settings.cache_dir.mkdir(parents=True, exist_ok=True)
    (settings.cache_dir / "frames").mkdir(parents=True, exist_ok=True)
