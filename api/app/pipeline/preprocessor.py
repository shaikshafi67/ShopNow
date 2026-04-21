"""
Stage 1 — Preprocessing
========================
Responsibilities:
  • Load each uploaded image from disk (BGR via OpenCV)
  • Remove background using rembg (U2Net / RMBG-1.4 ONNX model)
  • Normalise to a standard canvas size with white or transparent fill
  • Apply optional contrast / sharpness enhancement
  • Save every result as a 4-channel RGBA PNG for downstream stages

rembg docs: https://github.com/danielgatis/rembg
OpenCV docs: https://docs.opencv.org/
"""
from __future__ import annotations

import io
from pathlib import Path
from typing import NamedTuple

import cv2
import numpy as np
from loguru import logger
from PIL import Image, ImageEnhance

# rembg is imported lazily inside the class so the server starts even if the
# ONNX model hasn't been downloaded yet — it auto-downloads on first use.
try:
    from rembg import remove, new_session
    _REMBG_AVAILABLE = True
except ImportError:
    _REMBG_AVAILABLE = False
    logger.warning("rembg not installed — background removal will be skipped.")


class ProcessedImages(NamedTuple):
    front:    Path
    back:     Path
    left:     Path
    right:    Path
    clothing: Path


class Preprocessor:
    """
    Stateful preprocessor that holds a single rembg session across calls
    so the ONNX model is loaded only once.

    Parameters
    ----------
    rembg_model : str
        One of: "u2net", "u2net_human_seg", "isnet-general-use",
                "isnet-anime", "rmbg" (RMBG-1.4, best quality).
    target_size : (width, height)
        Output canvas size for every image.
    """

    def __init__(
        self,
        rembg_model: str = "u2net_human_seg",
        target_size: tuple[int, int] = (512, 768),
    ) -> None:
        self.target_size = target_size  # (W, H)
        self._session = None

        if _REMBG_AVAILABLE:
            logger.info(f"Loading rembg session: {rembg_model} …")
            # new_session downloads the ONNX weights to ~/.u2net/ on first run
            self._session = new_session(rembg_model)
            logger.success(f"rembg session ready ({rembg_model})")
        else:
            logger.warning("Running without rembg — backgrounds will not be removed.")

    # ── Public entry-point ────────────────────────────────────────────────────

    def run(
        self,
        front_path:    Path,
        back_path:     Path,
        left_path:     Path,
        right_path:    Path,
        clothing_path: Path,
        output_dir:    Path,
    ) -> dict[str, Path]:
        """
        Process all five images and return a dict of output Paths keyed by
        "front", "back", "left", "right", "clothing".
        """
        output_dir.mkdir(parents=True, exist_ok=True)

        results: dict[str, Path] = {}

        # User body images — full background removal + normalise
        for key, src in [
            ("front",    front_path),
            ("back",     back_path),
            ("left",     left_path),
            ("right",    right_path),
        ]:
            logger.debug(f"  Preprocessing {key} image …")
            dest = output_dir / f"{key}_processed.png"
            self._process_person_image(src, dest)
            results[key] = dest

        # Clothing image — lighter processing (keep white background for VTON)
        logger.debug("  Preprocessing clothing image …")
        clothing_dest = output_dir / "clothing_processed.png"
        self._process_clothing_image(clothing_path, clothing_dest)
        results["clothing"] = clothing_dest

        return results

    # ── Private helpers ───────────────────────────────────────────────────────

    def _remove_background(self, pil_image: Image.Image) -> Image.Image:
        """
        Run rembg on a PIL Image and return an RGBA PIL Image.
        Falls back to a simple colour-threshold mask if rembg is unavailable.
        """
        if self._session is not None:
            # rembg.remove accepts bytes and returns bytes (PNG)
            buf_in = io.BytesIO()
            pil_image.save(buf_in, format="PNG")
            buf_in.seek(0)

            result_bytes = remove(
                buf_in.read(),
                session=self._session,
                alpha_matting=True,              # smoother hair / edge blending
                alpha_matting_foreground_threshold=240,
                alpha_matting_background_threshold=10,
                alpha_matting_erode_size=10,
            )
            return Image.open(io.BytesIO(result_bytes)).convert("RGBA")

        # ── Fallback: crude GrabCut via OpenCV ────────────────────────────────
        logger.warning("Using GrabCut fallback — install rembg for better results.")
        return self._grabcut_fallback(pil_image)

    def _grabcut_fallback(self, pil_image: Image.Image) -> Image.Image:
        """
        OpenCV GrabCut segmentation as a fallback when rembg is unavailable.
        Assumes the subject is roughly centred in the frame.
        """
        img_rgb = np.array(pil_image.convert("RGB"))
        img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
        h, w = img_bgr.shape[:2]

        # Seed rectangle — 10% margin around the full frame
        margin_x, margin_y = int(w * 0.10), int(h * 0.05)
        rect = (margin_x, margin_y, w - 2 * margin_x, h - 2 * margin_y)

        mask  = np.zeros((h, w), dtype=np.uint8)
        bgd   = np.zeros((1, 65), dtype=np.float64)
        fgd   = np.zeros((1, 65), dtype=np.float64)

        cv2.grabCut(img_bgr, mask, rect, bgd, fgd, iterCount=5,
                    mode=cv2.GC_INIT_WITH_RECT)

        # Pixels marked 2 (definite BG) or 0 (probable BG) become background
        fg_mask = np.where((mask == 2) | (mask == 0), 0, 255).astype(np.uint8)

        # Smooth the mask edges
        fg_mask = cv2.GaussianBlur(fg_mask, (5, 5), 0)

        rgba = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGBA)
        rgba[:, :, 3] = fg_mask
        return Image.fromarray(rgba, "RGBA")

    def _normalise_canvas(
        self,
        rgba_image: Image.Image,
        background: tuple[int, int, int, int] = (255, 255, 255, 255),
    ) -> Image.Image:
        """
        Resize + letter-box the RGBA image onto a standard canvas.
        Preserves aspect ratio; fills empty space with *background* colour.
        """
        W, H = self.target_size
        canvas = Image.new("RGBA", (W, H), background)

        # Scale to fit within the canvas while keeping aspect ratio
        img_w, img_h = rgba_image.size
        scale = min(W / img_w, H / img_h)
        new_w, new_h = int(img_w * scale), int(img_h * scale)

        rgba_resized = rgba_image.resize((new_w, new_h), Image.LANCZOS)

        # Centre-paste
        offset_x = (W - new_w) // 2
        offset_y = (H - new_h) // 2
        canvas.paste(rgba_resized, (offset_x, offset_y), rgba_resized)
        return canvas

    def _enhance(self, pil_image: Image.Image) -> Image.Image:
        """
        Subtle pre-VTON enhancement: slight contrast and sharpness boost.
        Operates on a converted RGB copy, then re-merges the alpha channel.
        """
        r, g, b, a = pil_image.split()
        rgb = Image.merge("RGB", (r, g, b))

        rgb = ImageEnhance.Contrast(rgb).enhance(1.15)
        rgb = ImageEnhance.Sharpness(rgb).enhance(1.20)

        r2, g2, b2 = rgb.split()
        return Image.merge("RGBA", (r2, g2, b2, a))

    def _process_person_image(self, src: Path, dest: Path) -> None:
        """Full pipeline for a user body image."""
        pil = Image.open(src).convert("RGB")

        # 1. Remove background → RGBA
        rgba = self._remove_background(pil)

        # 2. Normalise to target canvas (transparent background for body shots)
        rgba = self._normalise_canvas(rgba, background=(0, 0, 0, 0))

        # 3. Subtle enhancement
        rgba = self._enhance(rgba)

        rgba.save(dest, format="PNG")

    def _process_clothing_image(self, src: Path, dest: Path) -> None:
        """
        For clothing images we keep a white background (required by most VTON
        models) but still normalise resolution and optionally strip the bg.
        """
        pil = Image.open(src).convert("RGB")

        # Remove background → RGBA
        rgba = self._remove_background(pil)

        # Composite onto a white canvas (clothing models expect white bg)
        rgba = self._normalise_canvas(rgba, background=(255, 255, 255, 255))

        rgba.save(dest, format="PNG")


# ── Utility: read a processed RGBA PNG back as a numpy array ─────────────────

def load_rgba_as_numpy(path: Path) -> np.ndarray:
    """Return (H, W, 4) float32 array in [0, 1]."""
    img = Image.open(path).convert("RGBA")
    return np.array(img, dtype=np.float32) / 255.0


def load_rgb_as_numpy(path: Path) -> np.ndarray:
    """Return (H, W, 3) uint8 array."""
    img = Image.open(path).convert("RGB")
    return np.array(img, dtype=np.uint8)
