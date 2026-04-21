"""
DRAPE3D — Virtual Try-On API
FastAPI entry-point.

Run with:
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
"""
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

import aiofiles
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from loguru import logger

from app.config import settings
from app.pipeline.preprocessor import Preprocessor
from app.pipeline.vton_2d import VTONPipeline
from app.pipeline.reconstruction_3d import ReconstructionPipeline
from app.pipeline.mesh_utils import export_mesh
from app.schemas import MeshFormat, TryOnResponse, IntermediateResult


# ── Lifespan: load heavy models once at startup ───────────────────────────────

_preprocessor: Preprocessor | None = None
_vton: VTONPipeline | None = None
_recon: ReconstructionPipeline | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Warm up all ML models before the server starts serving requests.
    This avoids cold-start latency on the first request.
    """
    global _preprocessor, _vton, _recon

    logger.info("🚀 Loading models — this may take 30–120 s on first run …")

    _preprocessor = Preprocessor(
        rembg_model=settings.rembg_model,
        target_size=(settings.target_width, settings.target_height),
    )

    _vton = VTONPipeline(
        backend=settings.vton_backend,
        model_path=settings.vton_model_path,
        device=f"cuda:{settings.cuda_device}",
        half_precision=settings.half_precision,
    )
    _vton.load()

    _recon = ReconstructionPipeline(
        backend=settings.reconstruction_backend,
        repo_path=settings.pifuhd_repo_path,
        checkpoint_path=settings.pifuhd_checkpoint,
        device=f"cuda:{settings.cuda_device}",
    )
    _recon.load()

    logger.success("✅ All models loaded. API is ready.")
    yield  # ← server is live here

    # Teardown
    logger.info("Shutting down — releasing GPU memory …")
    if _vton:
        _vton.unload()
    if _recon:
        _recon.unload()


# ── App factory ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="DRAPE3D — Virtual Try-On API",
    description=(
        "Local GPU-accelerated pipeline: background removal → 2D VTON "
        "(OOTDiffusion/CatVTON) → 3D reconstruction (PIFuHD/GeneMAN) → mesh export."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,   # e.g. ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],  # lets the browser read the filename
)

# ── Static file serving (finished meshes + previews) ─────────────────────────

app.mount(
    "/outputs",
    StaticFiles(directory=str(settings.output_dir)),
    name="outputs",
)


# ── Helper: save an uploaded file to disk ─────────────────────────────────────

async def _save_upload(upload: UploadFile, dest: Path) -> Path:
    """Stream an UploadFile to *dest* asynchronously."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    async with aiofiles.open(dest, "wb") as fh:
        while chunk := await upload.read(1024 * 256):  # 256 KB chunks
            await fh.write(chunk)
    return dest


# ── Main VTON endpoint ────────────────────────────────────────────────────────

@app.post(
    "/api/tryon",
    response_model=TryOnResponse,
    status_code=status.HTTP_200_OK,
    summary="Run the full 3D Virtual Try-On pipeline",
    tags=["Virtual Try-On"],
)
async def tryon(
    # ── Four user body images ──────────────────────────────────────────────────
    front: UploadFile  = File(..., description="User photo — front view"),
    back:  UploadFile  = File(..., description="User photo — back view"),
    left:  UploadFile  = File(..., description="User photo — left side"),
    right: UploadFile  = File(..., description="User photo — right side"),
    # ── Clothing image from the product catalogue ───────────────────────────────
    clothing: UploadFile = File(..., description="Flat-lay or mannequin clothing image"),
    # ── Optional overrides from the frontend ─────────────────────────────────
    mesh_format: MeshFormat = Form(MeshFormat.glb, description="Output mesh format"),
    include_intermediates: bool = Form(False, description="Return intermediate image paths"),
):
    """
    ### Full VTON Pipeline

    1. **Validate** all five uploads are images.
    2. **Preprocess**: strip backgrounds, normalise resolution (OpenCV + rembg).
    3. **2D Try-On**: overlay the clothing onto the user's front/back views
       via a local diffusion model (OOTDiffusion or CatVTON).
    4. **3D Reconstruction**: lift the clothed 2D images into a 3D mesh
       (PIFuHD or GeneMAN).
    5. **Export & respond** with the mesh file URL.
    """
    # ── Validate MIME types ────────────────────────────────────────────────────
    allowed_mime = {"image/jpeg", "image/png", "image/webp"}
    for upload in (front, back, left, right, clothing):
        if upload.content_type not in allowed_mime:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"'{upload.filename}' is not an accepted image type "
                       f"({upload.content_type}). Accepted: {allowed_mime}",
            )

    # ── Create per-request working directory ─────────────────────────────────
    job_id = uuid.uuid4().hex
    job_dir = settings.temp_dir / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    out_dir = settings.output_dir / job_id
    out_dir.mkdir(parents=True, exist_ok=True)

    t_start = time.perf_counter()

    try:
        # ── Stage 0: Save raw uploads ─────────────────────────────────────────
        logger.info(f"[{job_id}] Saving uploads …")
        raw_front    = await _save_upload(front,    job_dir / "raw_front.jpg")
        raw_back     = await _save_upload(back,     job_dir / "raw_back.jpg")
        raw_left     = await _save_upload(left,     job_dir / "raw_left.jpg")
        raw_right    = await _save_upload(right,    job_dir / "raw_right.jpg")
        raw_clothing = await _save_upload(clothing, job_dir / "raw_clothing.jpg")

        # ── Stage 1: Preprocessing ────────────────────────────────────────────
        logger.info(f"[{job_id}] Stage 1 — Preprocessing & background removal …")
        processed = _preprocessor.run(
            front_path    = raw_front,
            back_path     = raw_back,
            left_path     = raw_left,
            right_path    = raw_right,
            clothing_path = raw_clothing,
            output_dir    = job_dir,
        )
        # processed is a dict[str, Path] with keys:
        # front, back, left, right, clothing (all PNG with transparent bg)

        # ── Stage 2: 2D Virtual Try-On ────────────────────────────────────────
        logger.info(f"[{job_id}] Stage 2 — 2D Virtual Try-On …")
        vton_results = _vton.run(
            user_images={
                "front":    processed["front"],
                "back":     processed["back"],
            },
            clothing_image = processed["clothing"],
            output_dir     = job_dir,
        )
        # vton_results: dict[str, Path] — "clothed_front", "clothed_back"

        # ── Stage 3: 3D Reconstruction ────────────────────────────────────────
        logger.info(f"[{job_id}] Stage 3 — 3D reconstruction …")
        raw_mesh_path = _recon.run(
            clothed_front = vton_results["clothed_front"],
            clothed_back  = vton_results.get("clothed_back"),
            output_dir    = out_dir,
        )
        # raw_mesh_path: Path to .obj file produced by PIFuHD/GeneMAN

        # ── Stage 4: Export mesh ──────────────────────────────────────────────
        logger.info(f"[{job_id}] Stage 4 — Exporting mesh as {mesh_format} …")
        final_mesh = export_mesh(
            input_path  = raw_mesh_path,
            output_path = out_dir / f"mesh.{mesh_format.value}",
            fmt         = mesh_format.value,
        )

        elapsed = round(time.perf_counter() - t_start, 2)
        logger.success(f"[{job_id}] Pipeline done in {elapsed}s → {final_mesh}")

        # ── Build response ────────────────────────────────────────────────────
        intermediates = None
        if include_intermediates:
            intermediates = IntermediateResult(
                front_no_bg   = str(processed["front"]),
                back_no_bg    = str(processed["back"]),
                left_no_bg    = str(processed["left"]),
                right_no_bg   = str(processed["right"]),
                clothed_front = str(vton_results["clothed_front"]),
                clothed_back  = str(vton_results.get("clothed_back")),
            )

        return TryOnResponse(
            job_id                  = job_id,
            mesh_url                = f"/outputs/{job_id}/mesh.{mesh_format.value}",
            mesh_format             = mesh_format,
            intermediates           = intermediates,
            processing_time_seconds = elapsed,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"[{job_id}] Pipeline failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pipeline error at job {job_id}: {str(exc)}",
        )


# ── Convenience: direct mesh download by job ID ───────────────────────────────

@app.get(
    "/api/tryon/{job_id}/mesh",
    summary="Download the generated mesh file",
    tags=["Virtual Try-On"],
)
async def download_mesh(job_id: str, fmt: MeshFormat = MeshFormat.glb):
    mesh_path = settings.output_dir / job_id / f"mesh.{fmt.value}"
    if not mesh_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mesh for job '{job_id}' not found. "
                   "The job may still be processing or the ID is incorrect.",
        )
    return FileResponse(
        path         = str(mesh_path),
        media_type   = "model/gltf-binary" if fmt == MeshFormat.glb else "application/octet-stream",
        filename     = f"drape3d_{job_id}.{fmt.value}",
    )


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["Meta"])
async def health():
    import torch
    return {
        "status": "ok",
        "cuda_available": torch.cuda.is_available(),
        "cuda_device":    torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "vton_backend":   settings.vton_backend,
        "recon_backend":  settings.reconstruction_backend,
    }
