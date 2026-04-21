"""
Unit tests for the VTON pipeline.
Run with:  pytest tests/ -v
"""
import io
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_dummy_png(width: int = 512, height: int = 768) -> bytes:
    """Create a synthetic RGBA PNG in memory."""
    arr = np.random.randint(0, 255, (height, width, 3), dtype=np.uint8)
    img = Image.fromarray(arr, "RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _write_dummy_image(path: Path, w: int = 256, h: int = 384) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(
        np.random.randint(0, 255, (h, w, 3), dtype=np.uint8), "RGB"
    ).save(str(path))
    return path


# ── Preprocessor tests ────────────────────────────────────────────────────────

class TestPreprocessor:
    def test_grabcut_fallback(self, tmp_path):
        """GrabCut fallback should return an RGBA PIL Image."""
        from app.pipeline.preprocessor import Preprocessor
        prep = Preprocessor(rembg_model="u2net_human_seg", target_size=(256, 384))

        src = _write_dummy_image(tmp_path / "front.jpg")
        pil = Image.open(src).convert("RGB")
        result = prep._grabcut_fallback(pil)
        assert result.mode == "RGBA"
        assert result.size == pil.size  # GrabCut doesn't resize

    def test_normalise_canvas(self, tmp_path):
        """Canvas should always be exactly target_size."""
        from app.pipeline.preprocessor import Preprocessor
        prep = Preprocessor(target_size=(512, 768))
        rgba = Image.new("RGBA", (200, 300), (128, 0, 255, 200))
        out  = prep._normalise_canvas(rgba, background=(255, 255, 255, 255))
        assert out.size == (512, 768)

    def test_run_writes_five_files(self, tmp_path):
        """run() should produce exactly 5 output PNG files."""
        from app.pipeline.preprocessor import Preprocessor
        prep = Preprocessor(rembg_model="u2net_human_seg", target_size=(128, 192))

        images = {k: _write_dummy_image(tmp_path / f"{k}.jpg")
                  for k in ("front", "back", "left", "right", "clothing")}

        out_dir = tmp_path / "processed"
        result  = prep.run(
            front_path    = images["front"],
            back_path     = images["back"],
            left_path     = images["left"],
            right_path    = images["right"],
            clothing_path = images["clothing"],
            output_dir    = out_dir,
        )

        assert set(result.keys()) == {"front", "back", "left", "right", "clothing"}
        for key, path in result.items():
            assert path.exists(), f"Missing output for '{key}'"
            assert path.suffix == ".png"


# ── VTON 2D tests ─────────────────────────────────────────────────────────────

class TestVTONPipeline:
    def test_mock_blend_creates_file(self, tmp_path):
        """_mock_blend should create a valid image file."""
        from app.pipeline.vton_2d import VTONPipeline

        user_img     = _write_dummy_image(tmp_path / "user.png")
        clothing_img = _write_dummy_image(tmp_path / "clothing.png")
        output_img   = tmp_path / "clothed.png"

        VTONPipeline._mock_blend(user_img, clothing_img, output_img)
        assert output_img.exists()
        img = Image.open(output_img)
        assert img.mode == "RGB"

    def test_run_stub_mode(self, tmp_path):
        """In stub mode (no model loaded) run() should still return valid paths."""
        from app.pipeline.vton_2d import VTONPipeline

        pipeline = VTONPipeline(
            backend="ootdiffusion",
            model_path=tmp_path / "model",
            device="cpu",
            half_precision=False,
        )
        # Do NOT call load() — stays in stub/mock mode

        user_front   = _write_dummy_image(tmp_path / "front.png")
        user_back    = _write_dummy_image(tmp_path / "back.png")
        clothing_img = _write_dummy_image(tmp_path / "clothing.png")
        out_dir      = tmp_path / "vton_out"

        results = pipeline.run(
            user_images={"front": user_front, "back": user_back},
            clothing_image=clothing_img,
            output_dir=out_dir,
        )

        assert "clothed_front" in results
        assert "clothed_back"  in results
        assert results["clothed_front"].exists()


# ── Reconstruction 3D tests ───────────────────────────────────────────────────

class TestReconstructionPipeline:
    def test_mock_mesh_creates_obj(self, tmp_path):
        """Stub mode should produce a valid .obj file."""
        from app.pipeline.reconstruction_3d import ReconstructionPipeline

        pipeline = ReconstructionPipeline(
            backend="pifuhd",
            repo_path=tmp_path / "pifuhd",
            checkpoint_path=tmp_path / "pifuhd_final.pt",
            device="cpu",
        )
        out_dir = tmp_path / "mesh_out"
        obj_path = pipeline._mock_mesh(out_dir)
        assert obj_path.exists()
        assert obj_path.suffix == ".obj"
        # Basic sanity: file contains vertex data
        content = obj_path.read_text()
        assert "v " in content
        assert "f " in content


# ── Mesh utils tests ──────────────────────────────────────────────────────────

class TestMeshUtils:
    def test_export_copies_when_trimesh_missing(self, tmp_path, monkeypatch):
        """export_mesh should fallback to copy when trimesh is absent."""
        import app.pipeline.mesh_utils as mu
        monkeypatch.setattr(mu, "_TRIMESH_AVAILABLE", False)

        src = tmp_path / "raw.obj"
        src.write_text("# dummy\nv 0 0 0\n")
        dest = tmp_path / "out.glb"

        result = mu.export_mesh(src, dest, fmt="glb")
        assert result.exists()

    def test_export_glb_with_trimesh(self, tmp_path):
        """export_mesh should produce a non-empty .glb file."""
        pytest.importorskip("trimesh")

        from app.pipeline.reconstruction_3d import ReconstructionPipeline
        from app.pipeline.mesh_utils import export_mesh

        # Generate a stub .obj first
        pipeline = ReconstructionPipeline("pifuhd", tmp_path, tmp_path, "cpu")
        obj_path = pipeline._mock_mesh(tmp_path / "meshes")

        glb_path = tmp_path / "out.glb"
        result   = export_mesh(obj_path, glb_path, fmt="glb")
        assert result.exists()
        assert result.stat().st_size > 0


# ── FastAPI endpoint integration test ─────────────────────────────────────────

class TestAPIEndpoint:
    @pytest.fixture
    def client(self):
        """Return a TestClient with all heavy models mocked."""
        import app.main as main_module
        from fastapi.testclient import TestClient

        # Patch model globals with stub instances so no GPU is required
        from app.pipeline.preprocessor     import Preprocessor
        from app.pipeline.vton_2d          import VTONPipeline
        from app.pipeline.reconstruction_3d import ReconstructionPipeline

        main_module._preprocessor = Preprocessor(
            rembg_model="u2net_human_seg", target_size=(64, 96)
        )
        main_module._vton = VTONPipeline(
            backend="ootdiffusion",
            model_path=Path("/tmp/model"),
            device="cpu",
            half_precision=False,
        )
        main_module._recon = ReconstructionPipeline(
            backend="pifuhd",
            repo_path=Path("/tmp/pifuhd"),
            checkpoint_path=Path("/tmp/pifuhd_final.pt"),
            device="cpu",
        )

        return TestClient(main_module.app, raise_server_exceptions=True)

    def test_health_endpoint(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"

    def test_tryon_rejects_non_image(self, client):
        fake_file = io.BytesIO(b"this is not an image")
        fake_file.name = "bad.txt"
        files = {
            "front":    ("front.txt",    fake_file, "text/plain"),
            "back":     ("back.jpg",     io.BytesIO(_make_dummy_png()), "image/jpeg"),
            "left":     ("left.jpg",     io.BytesIO(_make_dummy_png()), "image/jpeg"),
            "right":    ("right.jpg",    io.BytesIO(_make_dummy_png()), "image/jpeg"),
            "clothing": ("clothing.jpg", io.BytesIO(_make_dummy_png()), "image/jpeg"),
        }
        resp = client.post("/api/tryon", files=files)
        assert resp.status_code == 422

    def test_tryon_full_pipeline_stub(self, client):
        """End-to-end test with all models in stub mode."""
        dummy = _make_dummy_png(128, 192)
        files = {k: (f"{k}.png", io.BytesIO(dummy), "image/png")
                 for k in ("front", "back", "left", "right", "clothing")}
        resp = client.post("/api/tryon", files=files)
        assert resp.status_code == 200
        data = resp.json()
        assert "job_id" in data
        assert "mesh_url" in data
        assert data["mesh_format"] in ("obj", "glb")
