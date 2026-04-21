"""
Stage 2 — 2D Virtual Try-On
============================
Supports two backends, selectable via the VTON_BACKEND env variable:

  ┌─────────────────┬──────────────────────────────────────────────────┐
  │ Backend key      │ Repository                                        │
  ├─────────────────┼──────────────────────────────────────────────────┤
  │ ootdiffusion    │ https://github.com/levihsu/OOTDiffusion           │
  │ catvton         │ https://github.com/zhengchong-li/CatVTON         │
  └─────────────────┴──────────────────────────────────────────────────┘

HOW TO ADD YOUR OWN MODEL
─────────────────────────
1. Clone the model repository into  models/  (or anywhere).
2. Set VTON_MODEL_PATH and VTON_BACKEND in .env.
3. Fill in the `_run_*` method for your backend — the rest of the
   orchestration (loading, error handling, output naming) is already done.

IMPORTANT: These methods contain detailed scaffolding / pseudo-code that
accurately mirrors the real API of each library.  You only need to uncomment
the real import lines and point the paths correctly once the model repos are
installed.
"""
from __future__ import annotations

import shutil
from pathlib import Path
from typing import Literal

import numpy as np
from loguru import logger
from PIL import Image

# ── Conditional imports (available after model repos are cloned) ──────────────

# OOTDiffusion — pip install -e ./models/ootdiffusion  (after cloning repo)
# from ootd.inference_ootd import OOTDiffusion as _OOTDModel

# CatVTON — pip install -e ./models/CatVTON  (after cloning repo)
# from mvton.pipeline import CatVTONPipeline as _CatVTONModel

# HuggingFace diffusers (used by both backends for scheduler / VAE)
try:
    import torch
    _TORCH_AVAILABLE = True
except ImportError:
    _TORCH_AVAILABLE = False
    logger.warning("torch not found — 2D VTON will run in mock mode.")


VTONBackendType = Literal["ootdiffusion", "catvton"]


class VTONPipeline:
    """
    Unified interface for 2D Virtual Try-On inference.

    The `load()` method warms up whichever backend is configured.
    The `run()` method takes preprocessed image Paths and returns
    a dict with keys "clothed_front" and (optionally) "clothed_back".
    """

    def __init__(
        self,
        backend: VTONBackendType,
        model_path: Path,
        device: str = "cuda:0",
        half_precision: bool = True,
    ) -> None:
        self.backend        = backend
        self.model_path     = Path(model_path)
        self.device         = device
        self.half_precision = half_precision
        self._model         = None
        self._dtype         = None  # set in load()

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    def load(self) -> None:
        """Initialise and warm-up the model. Called once at API startup."""
        if not _TORCH_AVAILABLE:
            logger.warning("[VTON] Torch unavailable — running in mock/stub mode.")
            return

        import torch
        self._dtype = torch.float16 if self.half_precision else torch.float32

        if self.backend == "ootdiffusion":
            self._load_ootdiffusion()
        elif self.backend == "catvton":
            self._load_catvton()
        else:
            raise ValueError(f"Unknown VTON backend: '{self.backend}'")

    def unload(self) -> None:
        """Free GPU memory. Called on server shutdown."""
        if self._model is not None:
            del self._model
            self._model = None
            if _TORCH_AVAILABLE:
                import torch
                torch.cuda.empty_cache()
            logger.info("[VTON] Model unloaded.")

    # ── Public inference ──────────────────────────────────────────────────────

    def run(
        self,
        user_images:    dict[str, Path],  # {"front": Path, "back": Path}
        clothing_image: Path,
        output_dir:     Path,
    ) -> dict[str, Path]:
        """
        Overlay *clothing_image* onto each user view.

        Returns
        -------
        dict with keys "clothed_front" and optionally "clothed_back".
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        results: dict[str, Path] = {}

        for view, user_path in user_images.items():
            logger.info(f"  [VTON] Processing {view} view …")
            out_path = output_dir / f"clothed_{view}.png"

            if self._model is None:
                # ── MOCK MODE (no GPU / model not loaded) ─────────────────────
                # Blend the user image with a pink tint as a visual placeholder.
                self._mock_blend(user_path, clothing_image, out_path)
            else:
                if self.backend == "ootdiffusion":
                    self._run_ootdiffusion(user_path, clothing_image, out_path)
                elif self.backend == "catvton":
                    self._run_catvton(user_path, clothing_image, out_path)

            results[f"clothed_{view}"] = out_path

        return results

    # ── Backend: OOTDiffusion ─────────────────────────────────────────────────

    def _load_ootdiffusion(self) -> None:
        """
        OOTDiffusion loading scaffolding.

        Setup steps (do once before running the API):
        ─────────────────────────────────────────────
        1.  git clone https://github.com/levihsu/OOTDiffusion models/ootdiffusion
        2.  pip install -e models/ootdiffusion
        3.  Download checkpoints:
              huggingface-cli download levihsu/OOTDiffusion
                  --local-dir models/checkpoints/ootd
        4.  Set VTON_MODEL_PATH=./models/checkpoints/ootd in .env
        """
        logger.info("[VTON] Loading OOTDiffusion …")

        # ── REAL CODE (uncomment after cloning the repo) ──────────────────────
        # from ootd.inference_ootd import OOTDiffusion
        #
        # self._model = OOTDiffusion(
        #     gpu_id     = int(self.device.split(":")[-1]),
        #     model_path = str(self.model_path),
        #     # OOTDiffusion exposes "hd" (512×768) and "dc" (512×512) modes
        #     model_type = "hd",
        # )
        # ─────────────────────────────────────────────────────────────────────

        # STUB — replace with real init above
        logger.warning("[VTON] OOTDiffusion is in STUB mode. Clone the repo first.")

    def _run_ootdiffusion(
        self,
        user_path: Path,
        clothing_path: Path,
        output_path: Path,
    ) -> None:
        """
        Single-view OOTDiffusion inference.

        The real OOTDiffusion API (from ootd/inference_ootd.py):
        ─────────────────────────────────────────────────────────
        images = self._model(
            model_type   = "hd",            # "hd" | "dc"
            category     = 0,               # 0=upper-body, 1=lower-body, 2=full
            image_garm   = PIL_clothing,    # clothing image (RGB PIL)
            image_ori    = PIL_person,      # person image   (RGB PIL)
            num_samples  = 1,
            num_steps    = 20,              # diffusion steps (20 = fast, 40 = quality)
            image_scale  = 2.0,             # clothing guidance scale
            seed         = -1,              # -1 = random
        )
        # images is a list of PIL Images
        images[0].save(str(output_path))
        """
        import torch

        pil_person   = Image.open(user_path).convert("RGB")
        pil_clothing = Image.open(clothing_path).convert("RGB")

        logger.debug(f"  [OOTDiffusion] inference on {user_path.name} …")

        with torch.inference_mode():
            # ── REAL CALL (uncomment): ─────────────────────────────────────────
            # images = self._model(
            #     model_type = "hd",
            #     category   = 0,
            #     image_garm = pil_clothing,
            #     image_ori  = pil_person,
            #     num_samples= 1,
            #     num_steps  = 20,
            #     image_scale= 2.0,
            #     seed       = -1,
            # )
            # images[0].save(str(output_path))
            # ──────────────────────────────────────────────────────────────────

            # STUB
            self._mock_blend(user_path, clothing_path, output_path)

    # ── Backend: CatVTON ──────────────────────────────────────────────────────

    def _load_catvton(self) -> None:
        """
        CatVTON loading scaffolding.

        Setup steps:
        ─────────────────────────────────────────────────────────────────
        1.  git clone https://github.com/zhengchong-li/CatVTON models/CatVTON
        2.  pip install -e models/CatVTON
        3.  Download weights:
              huggingface-cli download zhengchong-li/CatVTON
                  --local-dir models/checkpoints/catvton
        ─────────────────────────────────────────────────────────────────
        """
        logger.info("[VTON] Loading CatVTON …")

        # ── REAL CODE (uncomment after setup): ────────────────────────────────
        # from mvton.pipeline import CatVTONPipeline
        # import torch
        #
        # self._model = CatVTONPipeline(
        #     attn_ckpt_version = "mix",     # "mix" | "vitonhd" | "dresscode"
        #     attn_ckpt         = str(self.model_path),
        #     base_ckpt         = "booksforcharlie/stable-diffusion-inpainting",
        #     device            = self.device,
        #     dtype             = self._dtype,
        #     use_tf32          = True,      # faster on Ampere GPUs
        # )
        # ─────────────────────────────────────────────────────────────────────

        logger.warning("[VTON] CatVTON is in STUB mode. Clone the repo first.")

    def _run_catvton(
        self,
        user_path: Path,
        clothing_path: Path,
        output_path: Path,
    ) -> None:
        """
        Single-view CatVTON inference.

        The real CatVTON API:
        ─────────────────────
        import torch
        from torchvision import transforms

        # CatVTON requires a 768×1024 input
        tf = transforms.Compose([
            transforms.Resize((1024, 768)),
            transforms.ToTensor(),
            transforms.Normalize([0.5], [0.5]),
        ])

        person_tensor   = tf(pil_person).unsqueeze(0).to(self.device, self._dtype)
        clothing_tensor = tf(pil_clothing).unsqueeze(0).to(self.device, self._dtype)

        # Build a trivial mask (full person region)
        mask_tensor = torch.ones(1, 1, 1024, 768).to(self.device, self._dtype)

        result = self._model(
            image        = person_tensor,
            condition    = clothing_tensor,
            mask         = mask_tensor,
            num_inference_steps = 50,
            guidance_scale      = 2.5,
            generator    = torch.Generator(device=self.device).manual_seed(42),
        )
        # result.images[0] is a PIL Image
        result.images[0].save(str(output_path))
        """
        import torch

        logger.debug(f"  [CatVTON] inference on {user_path.name} …")

        # ── STUB ──────────────────────────────────────────────────────────────
        self._mock_blend(user_path, clothing_path, output_path)

    # ── Mock / fallback ───────────────────────────────────────────────────────

    @staticmethod
    def _mock_blend(user_path: Path, clothing_path: Path, output_path: Path) -> None:
        """
        Development placeholder: alpha-blends the clothing colour over the
        person silhouette so the frontend gets *something* to render.
        Replace entirely once a real model is loaded.
        """
        person   = Image.open(user_path).convert("RGBA")
        clothing = Image.open(clothing_path).convert("RGBA")

        # Resize clothing to person size
        clothing_resized = clothing.resize(person.size, Image.LANCZOS)

        # Overlay with 50% opacity on the bottom 70% of the image
        W, H = person.size
        overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        crop    = clothing_resized.crop((0, int(H * 0.10), W, int(H * 0.85)))
        overlay.paste(crop, (0, int(H * 0.10)))

        blended = Image.alpha_composite(person, overlay)
        blended.convert("RGB").save(str(output_path))
        logger.debug(f"  [VTON-MOCK] Saved placeholder to {output_path.name}")
