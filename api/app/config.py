"""
Centralised settings loaded from .env (or environment variables).
Access anywhere with:  from app.config import settings
"""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Server ────────────────────────────────────────────────────────────────
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    workers: int = 1

    # ── CORS ──────────────────────────────────────────────────────────────────
    allowed_origins: str = "http://localhost:5173,http://localhost:4173"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    # ── Paths ─────────────────────────────────────────────────────────────────
    output_dir: Path = Path("./outputs")
    model_dir: Path = Path("./models/checkpoints")
    temp_dir: Path = Path("./outputs/intermediates")

    # ── 2D VTON ───────────────────────────────────────────────────────────────
    vton_model_path: Path = Path("./models/checkpoints/ootd")
    vton_backend: str = "ootdiffusion"   # "ootdiffusion" | "catvton"

    # ── 3D Reconstruction ─────────────────────────────────────────────────────
    pifuhd_repo_path: Path = Path("./models/pifuhd")
    pifuhd_checkpoint: Path = Path("./models/checkpoints/pifuhd/pifuhd_final.pt")
    reconstruction_backend: str = "pifuhd"   # "pifuhd" | "geneman"

    # ── GPU ───────────────────────────────────────────────────────────────────
    cuda_device: int = 0
    half_precision: bool = True

    # ── Image ─────────────────────────────────────────────────────────────────
    target_width: int = 512
    target_height: int = 768
    rembg_model: str = "u2net_human_seg"


settings = Settings()

# Ensure output directories exist at import time
for _dir in (settings.output_dir, settings.temp_dir, settings.model_dir):
    _dir.mkdir(parents=True, exist_ok=True)
