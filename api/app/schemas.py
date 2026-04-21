"""
Pydantic request/response models for the VTON API.
"""
from enum import Enum
from pydantic import BaseModel, Field


class VTONBackend(str, Enum):
    ootdiffusion = "ootdiffusion"
    catvton = "catvton"


class ReconstructionBackend(str, Enum):
    pifuhd = "pifuhd"
    geneman = "geneman"


class MeshFormat(str, Enum):
    obj = "obj"
    glb = "glb"


class PipelineStatus(str, Enum):
    queued = "queued"
    preprocessing = "preprocessing"
    vton_2d = "vton_2d"
    reconstruction_3d = "reconstruction_3d"
    done = "done"
    failed = "failed"


# ── Response schemas ──────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    detail: str
    stage: str | None = None


class IntermediateResult(BaseModel):
    """Paths to intermediate products stored on-disk (useful for debugging)."""
    front_no_bg: str | None = None
    back_no_bg: str | None = None
    left_no_bg: str | None = None
    right_no_bg: str | None = None
    clothed_front: str | None = None
    clothed_back: str | None = None


class TryOnResponse(BaseModel):
    """
    Returned when the pipeline succeeds.
    The mesh_url is a relative path the frontend can GET to download the file.
    """
    job_id: str
    mesh_url: str = Field(..., description="GET /outputs/{job_id}/mesh.glb")
    mesh_format: MeshFormat
    preview_url: str | None = Field(
        None, description="Optional front-view render of the clothed avatar"
    )
    intermediates: IntermediateResult | None = None
    processing_time_seconds: float
