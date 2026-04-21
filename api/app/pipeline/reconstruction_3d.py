"""
Stage 3 — 3D Human Reconstruction
====================================
Supports two backends, selectable via RECONSTRUCTION_BACKEND in .env:

  ┌──────────────┬───────────────────────────────────────────────────────┐
  │ Backend key  │ Repository                                             │
  ├──────────────┼───────────────────────────────────────────────────────┤
  │ pifuhd       │ https://github.com/facebookresearch/pifuhd            │
  │ geneman      │ https://github.com/magic-research/GeneMan             │
  └──────────────┴───────────────────────────────────────────────────────┘

Both models take one or more clothed RGB images and output a 3D mesh (.obj).
The mesh is then passed to mesh_utils.py for cleaning and format conversion.

IMPORTANT NOTES ON PIFUHD GEOMETRY
─────────────────────────────────────
• PIFuHD reconstructs geometry from a single front-view image.
  If you supply both front AND back, the back improves normal estimation.
• Output is an isosurface mesh: typically ~300k–1M triangles.
• Texture is baked from the input image via a UV unwrap step.
• The generated .obj is in a right-handed coordinate system, Y-up.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path
from typing import Literal

import numpy as np
from loguru import logger
from PIL import Image

try:
    import torch
    _TORCH_AVAILABLE = True
except ImportError:
    _TORCH_AVAILABLE = False

ReconBackendType = Literal["pifuhd", "geneman"]


class ReconstructionPipeline:
    """
    Unified interface for single or multi-view 3D human reconstruction.

    load()  — warm up the model (called once at API startup)
    run()   — takes clothed-image Paths, returns Path to .obj mesh
    unload()— free GPU memory
    """

    def __init__(
        self,
        backend: ReconBackendType,
        repo_path: Path,
        checkpoint_path: Path,
        device: str = "cuda:0",
    ) -> None:
        self.backend         = backend
        self.repo_path       = Path(repo_path)
        self.checkpoint_path = Path(checkpoint_path)
        self.device          = device
        self._model          = None

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    def load(self) -> None:
        if not _TORCH_AVAILABLE:
            logger.warning("[Recon] Torch unavailable — running in mock/stub mode.")
            return

        if self.backend == "pifuhd":
            self._load_pifuhd()
        elif self.backend == "geneman":
            self._load_geneman()
        else:
            raise ValueError(f"Unknown reconstruction backend: '{self.backend}'")

    def unload(self) -> None:
        if self._model is not None:
            del self._model
            self._model = None
            if _TORCH_AVAILABLE:
                import torch
                torch.cuda.empty_cache()
            logger.info("[Recon] Model unloaded.")

    # ── Public inference ──────────────────────────────────────────────────────

    def run(
        self,
        clothed_front: Path,
        clothed_back:  Path | None,
        output_dir:    Path,
    ) -> Path:
        """
        Reconstruct a 3D mesh from the clothed image(s).

        Returns
        -------
        Path  —  path to the generated .obj file.
        """
        output_dir.mkdir(parents=True, exist_ok=True)

        if self._model is None:
            return self._mock_mesh(output_dir)

        if self.backend == "pifuhd":
            return self._run_pifuhd(clothed_front, clothed_back, output_dir)
        elif self.backend == "geneman":
            return self._run_geneman(clothed_front, clothed_back, output_dir)

    # ── Backend: PIFuHD ───────────────────────────────────────────────────────

    def _load_pifuhd(self) -> None:
        """
        PIFuHD model loading.

        Setup steps (do once):
        ──────────────────────
        1.  git clone https://github.com/facebookresearch/pifuhd models/pifuhd
        2.  cd models/pifuhd && pip install -r requirements.txt
        3.  Download checkpoint:
              mkdir -p models/checkpoints/pifuhd
              wget https://dl.fbaipublicfiles.com/pifuhd/checkpoints/pifuhd_final.pt
                   -O models/checkpoints/pifuhd/pifuhd_final.pt
        4.  Set PIFUHD_REPO_PATH and PIFUHD_CHECKPOINT in .env
        """
        logger.info("[Recon] Loading PIFuHD …")

        # Add PIFuHD source to Python path so its modules are importable
        pifuhd_src = self.repo_path / "lib"
        if pifuhd_src.exists() and str(pifuhd_src) not in sys.path:
            sys.path.insert(0, str(self.repo_path))
            sys.path.insert(0, str(pifuhd_src))

        # ── REAL CODE (uncomment after cloning): ──────────────────────────────
        # import torch
        # from lib.options import BaseOptions
        # from lib.mesh_util import save_obj_mesh_with_color
        # from apps.simple_test import Evaluator          # PIFuHD evaluator class
        #
        # opt = BaseOptions().parse()
        # opt.load_netMR_checkpoint_path = str(self.checkpoint_path)
        # opt.resolution = 512
        # opt.num_views  = 1
        #
        # self._model = Evaluator(opt)
        # self._model.load_networks(opt)
        # ─────────────────────────────────────────────────────────────────────

        logger.warning("[Recon] PIFuHD is in STUB mode. Clone the repo first.")

    def _run_pifuhd(
        self,
        clothed_front: Path,
        clothed_back: Path | None,
        output_dir: Path,
    ) -> Path:
        """
        PIFuHD inference — detailed scaffolding.

        PIFuHD's simple_test.py CLI interface:
        ────────────────────────────────────────
        The easiest integration is to call its simple_test.py as a subprocess,
        passing our preprocessed image. Alternatively the Evaluator class can
        be called directly (requires their exact data-loader format).

        SUBPROCESS APPROACH (recommended for isolation):
        ─────────────────────────────────────────────────
        We copy the front image into a temp input dir, run simple_test.py,
        then move the output .obj back.
        """
        import torch

        logger.info("[Recon][PIFuHD] Running inference …")

        # Prepare input directory (PIFuHD expects a folder of images)
        pifuhd_input_dir  = output_dir / "pifuhd_input"
        pifuhd_output_dir = output_dir / "pifuhd_output"
        pifuhd_input_dir.mkdir(exist_ok=True)
        pifuhd_output_dir.mkdir(exist_ok=True)

        # PIFuHD needs exactly 512×512 input (or 1024×1024 for hi-res mode)
        front_512 = _resize_for_pifuhd(clothed_front, pifuhd_input_dir / "front.png", 512)

        # ── SUBPROCESS APPROACH (uncomment) ───────────────────────────────────
        # cmd = [
        #     sys.executable,
        #     str(self.repo_path / "apps" / "simple_test.py"),
        #     "-i", str(pifuhd_input_dir),
        #     "-o", str(pifuhd_output_dir),
        #     "--checkpoint-path", str(self.checkpoint_path),
        #     "--resolution", "256",      # 256 → fast, 512 → hi-res (needs ~24 GB)
        #     "--use-rect",               # use bounding-box crop
        # ]
        # logger.debug(f"  PIFuHD cmd: {' '.join(cmd)}")
        # result = subprocess.run(cmd, capture_output=True, text=True, cwd=str(self.repo_path))
        # if result.returncode != 0:
        #     raise RuntimeError(f"PIFuHD failed:\n{result.stderr}")
        #
        # # PIFuHD writes  <output_dir>/result_<name>_256.obj
        # obj_files = list(pifuhd_output_dir.glob("*.obj"))
        # if not obj_files:
        #     raise RuntimeError("PIFuHD produced no .obj output.")
        # return obj_files[0]
        # ─────────────────────────────────────────────────────────────────────

        # ── DIRECT API APPROACH (uncomment if you imported Evaluator above) ───
        # with torch.no_grad():
        #     self._model.load_image(str(front_512), None)   # (front, back)
        #     self._model.forward()
        #     self._model.save_mesh(str(pifuhd_output_dir / "result.obj"))
        # return pifuhd_output_dir / "result.obj"
        # ─────────────────────────────────────────────────────────────────────

        # STUB
        return self._mock_mesh(output_dir)

    # ── Backend: GeneMAN ──────────────────────────────────────────────────────

    def _load_geneman(self) -> None:
        """
        GeneMAN model loading.

        GeneMAN (ECCV 2024) reconstructs a clothed human avatar from a *single*
        image using a generalised implicit function conditioned on SMPL-X body
        priors. It produces much cleaner topology than PIFuHD.

        Setup steps:
        ─────────────────────────────────────────────────────────────────
        1.  git clone https://github.com/magic-research/GeneMan models/geneman
        2.  cd models/geneman && pip install -r requirements.txt
        3.  Download SMPL-X model files from https://smpl-x.is.tue.mpg.de/
            and place in models/geneman/data/smplx/
        4.  Download GeneMan checkpoint:
              huggingface-cli download magic-research/GeneMan
                  --local-dir models/checkpoints/geneman
        """
        logger.info("[Recon] Loading GeneMAN …")

        # ── REAL CODE (uncomment after setup): ────────────────────────────────
        # import torch
        # from geneman.model import GeneManModel
        # from geneman.config import GeneManConfig
        #
        # cfg = GeneManConfig.from_pretrained(str(self.checkpoint_path))
        # self._model = GeneManModel.from_pretrained(
        #     str(self.checkpoint_path),
        #     config=cfg,
        # ).to(self.device)
        # if self.half_precision:
        #     self._model = self._model.half()
        # self._model.eval()
        # ─────────────────────────────────────────────────────────────────────

        logger.warning("[Recon] GeneMAN is in STUB mode. Clone the repo first.")

    def _run_geneman(
        self,
        clothed_front: Path,
        clothed_back: Path | None,
        output_dir: Path,
    ) -> Path:
        """
        GeneMAN inference scaffolding.

        GeneMAN pipeline overview:
        ──────────────────────────
        1. Extract SMPL-X body parameters from the front image
           (uses an off-the-shelf estimator like CLIFF or BEV).
        2. Condition the implicit network on the SMPL-X mesh + image features.
        3. March cubes over the occupancy field → raw triangle mesh.
        4. Optional texture baking from the input image.

        The real GeneMAN API:
        ──────────────────────
        import torch
        from torchvision import transforms
        from geneman.data.transforms import build_transforms

        tf = build_transforms(cfg)
        img_tensor = tf(Image.open(clothed_front)).unsqueeze(0).to(device)

        with torch.no_grad():
            output = self._model.infer(
                image       = img_tensor,
                # smplx_params can be None — model estimates them internally
                smplx_params= None,
                resolution  = 256,          # marching-cubes grid resolution
                export_mesh = True,
            )
        # output["mesh"] is a trimesh.Trimesh object
        output["mesh"].export(str(output_dir / "result.obj"))
        return output_dir / "result.obj"
        """
        logger.info("[Recon][GeneMAN] Running inference …")

        # STUB
        return self._mock_mesh(output_dir)

    # ── Mock mesh (development placeholder) ──────────────────────────────────

    @staticmethod
    def _mock_mesh(output_dir: Path) -> Path:
        """
        Write a textured OBJ cube as a visual placeholder when no real model
        is loaded.  The frontend receives *something* to load in Three.js.
        """
        obj_path = output_dir / "mesh.obj"
        mtl_path = output_dir / "mesh.mtl"

        # Minimal OBJ — a simple human-shaped box (8 vertices, 6 quads)
        obj_content = """\
# DRAPE3D — Mock mesh (placeholder)
# Replace with real PIFuHD / GeneMAN output
mtllib mesh.mtl
usemtl avatar_material

# Vertices (rough human silhouette proportions)
v -0.25  0.00  0.10
v  0.25  0.00  0.10
v  0.25  1.70  0.10
v -0.25  1.70  0.10
v -0.25  0.00 -0.10
v  0.25  0.00 -0.10
v  0.25  1.70 -0.10
v -0.25  1.70 -0.10

# Normals
vn  0  0  1
vn  0  0 -1
vn  0  1  0
vn  0 -1  0
vn  1  0  0
vn -1  0  0

# Texture coords
vt 0.0 0.0
vt 1.0 0.0
vt 1.0 1.0
vt 0.0 1.0

# Faces (front, back, top, bottom, right, left)
f 1/1/1 2/2/1 3/3/1 4/4/1
f 6/1/2 5/2/2 8/3/2 7/4/2
f 4/1/3 3/2/3 7/3/3 8/4/3
f 1/1/4 5/2/4 6/3/4 2/4/4
f 2/1/5 6/2/5 7/3/5 3/4/5
f 5/1/6 1/2/6 4/3/6 8/4/6
"""
        mtl_content = """\
newmtl avatar_material
Ka 0.6 0.5 0.8
Kd 0.6 0.5 0.8
Ks 0.2 0.2 0.2
Ns 50.0
d  1.0
"""
        obj_path.write_text(obj_content)
        mtl_path.write_text(mtl_content)
        logger.warning(f"[Recon] Mock mesh written to {obj_path} (stub mode).")
        return obj_path


# ── Helper ────────────────────────────────────────────────────────────────────

def _resize_for_pifuhd(src: Path, dest: Path, size: int) -> Path:
    """
    PIFuHD requires square input. Resize + pad to *size* × *size*.
    Keeps the subject centred on a black background.
    """
    img = Image.open(src).convert("RGB")
    W, H = img.size
    scale = size / max(W, H)
    nw, nh = int(W * scale), int(H * scale)
    img = img.resize((nw, nh), Image.LANCZOS)

    canvas = Image.new("RGB", (size, size), (0, 0, 0))
    ox, oy = (size - nw) // 2, (size - nh) // 2
    canvas.paste(img, (ox, oy))
    canvas.save(str(dest))
    return dest
