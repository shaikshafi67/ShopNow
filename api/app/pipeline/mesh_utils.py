"""
Mesh post-processing utilities
================================
Responsibilities:
  • Load the raw .obj produced by PIFuHD / GeneMAN (via trimesh)
  • Clean the mesh: remove duplicates, degenerate faces, fill small holes
  • Re-centre and normalise the mesh so it fits inside a unit bounding box
  • Export to the requested format (.obj or .glb / .gltf)
  • Generate an optional 2-D thumbnail render (headless via OpenGL / PIL)

trimesh docs: https://trimsh.org/
"""
from __future__ import annotations

from pathlib import Path
from typing import Literal

import numpy as np
from loguru import logger

# trimesh is imported lazily so the server starts even if it's not installed
try:
    import trimesh
    import trimesh.transformations as tf
    _TRIMESH_AVAILABLE = True
except ImportError:
    _TRIMESH_AVAILABLE = False
    logger.warning("trimesh not installed — mesh export will skip post-processing.")

MeshFormatType = Literal["obj", "glb"]


def export_mesh(
    input_path:  Path,
    output_path: Path,
    fmt:         MeshFormatType = "glb",
) -> Path:
    """
    Load, clean, normalise and export a mesh.

    Parameters
    ----------
    input_path  : Path to the raw .obj file from the reconstruction model.
    output_path : Destination path (extension must match *fmt*).
    fmt         : "glb" (Three.js-friendly) or "obj".

    Returns
    -------
    Path to the exported mesh file.
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if not _TRIMESH_AVAILABLE:
        # If trimesh is missing, just copy the raw .obj as-is
        logger.warning("trimesh unavailable — copying raw .obj without processing.")
        import shutil
        shutil.copy2(input_path, output_path)
        return output_path

    # ── 1. Load ───────────────────────────────────────────────────────────────
    logger.debug(f"  [Mesh] Loading {input_path.name} …")
    scene_or_mesh = trimesh.load(str(input_path), force="mesh")

    if isinstance(scene_or_mesh, trimesh.Scene):
        # Some exporters write a Scene with multiple Geometry objects
        mesh = trimesh.util.concatenate(
            [g for g in scene_or_mesh.geometry.values()
             if isinstance(g, trimesh.Trimesh)]
        )
    else:
        mesh = scene_or_mesh

    logger.debug(f"  [Mesh] Loaded: {len(mesh.vertices)} vertices, "
                 f"{len(mesh.faces)} faces")

    # ── 2. Clean ──────────────────────────────────────────────────────────────
    mesh = _clean_mesh(mesh)

    # ── 3. Normalise ─────────────────────────────────────────────────────────
    mesh = _normalise_mesh(mesh)

    # ── 4. Export ─────────────────────────────────────────────────────────────
    if fmt == "glb":
        _export_glb(mesh, output_path)
    else:
        _export_obj(mesh, output_path)

    logger.info(f"  [Mesh] Exported {fmt.upper()} → {output_path.name}")
    return output_path


# ── Internal helpers ──────────────────────────────────────────────────────────

def _clean_mesh(mesh: "trimesh.Trimesh") -> "trimesh.Trimesh":
    """
    Apply a sequence of repairs to improve mesh quality.

    Operations (in order):
    ─────────────────────
    1. Remove duplicate vertices (merge_vertices)
    2. Remove degenerate (zero-area) faces
    3. Remove duplicate faces
    4. Remove unreferenced vertices
    5. Fix face winding so normals are consistently outward-facing
    6. Fill small holes (< 100 edge boundary loops)

    PIFuHD output is usually manifold but can have isolated components —
    we keep only the largest connected component.
    """
    logger.debug("  [Mesh] Cleaning …")

    mesh.merge_vertices()
    mesh.remove_degenerate_faces()
    mesh.remove_duplicate_faces()
    mesh.remove_unreferenced_vertices()

    # Keep only the largest component (removes floating artefacts)
    components = mesh.split(only_watertight=False)
    if len(components) > 1:
        mesh = max(components, key=lambda m: len(m.faces))
        logger.debug(f"  [Mesh] Kept largest component "
                     f"({len(mesh.faces)} faces / {len(components)} total)")

    # Fix winding
    trimesh.repair.fix_winding(mesh)

    # Fill small holes (boundary edge loops with fewer than 100 edges)
    try:
        trimesh.repair.fill_holes(mesh)
    except Exception as exc:
        logger.debug(f"  [Mesh] hole-fill skipped: {exc}")

    # Recompute normals after all edits
    mesh.compute_vertex_normals()

    logger.debug(f"  [Mesh] After clean: {len(mesh.vertices)} verts, "
                 f"{len(mesh.faces)} faces, watertight={mesh.is_watertight}")
    return mesh


def _normalise_mesh(mesh: "trimesh.Trimesh") -> "trimesh.Trimesh":
    """
    Centre the mesh at the origin and scale it so the tallest dimension = 1.8
    (metres, matching a typical human height in Three.js world units).
    """
    # Translate centroid to origin
    mesh.apply_translation(-mesh.centroid)

    # Scale to ~1.8 m height (Y-axis in PIFuHD's coordinate system)
    extents = mesh.bounding_box.extents          # (dx, dy, dz)
    max_extent = extents.max()
    if max_extent > 0:
        target_height = 1.8
        scale = target_height / max_extent
        mesh.apply_scale(scale)

    # Shift so the feet are at Y = 0
    min_y = mesh.bounds[0][1]
    mesh.apply_translation([0, -min_y, 0])

    return mesh


def _export_glb(mesh: "trimesh.Trimesh", path: Path) -> None:
    """
    Export as binary glTF (.glb).
    Three.js loads .glb natively with GLTFLoader — no texture atlas required.
    Vertex colours (from PIFuHD's colour field) are preserved as
    COLOR_0 attributes.
    """
    scene = trimesh.scene.Scene(geometry={"avatar": mesh})
    glb_bytes = scene.export(file_type="glb")
    path.write_bytes(glb_bytes)


def _export_obj(mesh: "trimesh.Trimesh", path: Path) -> None:
    """
    Export as Wavefront OBJ + companion MTL.
    """
    obj_bytes = trimesh.exchange.obj.export_obj(mesh, include_texture=True)
    path.write_bytes(obj_bytes if isinstance(obj_bytes, bytes) else obj_bytes.encode())


# ── Optional: headless thumbnail render ──────────────────────────────────────

def render_thumbnail(
    mesh_path:  Path,
    output_png: Path,
    resolution: tuple[int, int] = (512, 512),
) -> Path | None:
    """
    Render a front-facing thumbnail of the mesh using trimesh's headless
    pyrender / PIL renderer (requires pyrender or xvfb on Linux servers).

    Returns the path to the PNG, or None if rendering fails.
    """
    if not _TRIMESH_AVAILABLE:
        return None

    try:
        import pyrender  # type: ignore
        import PIL.Image

        mesh_loaded = trimesh.load(str(mesh_path))
        if isinstance(mesh_loaded, trimesh.Scene):
            scene_mesh = trimesh.util.concatenate(
                list(mesh_loaded.geometry.values())
            )
        else:
            scene_mesh = mesh_loaded

        py_mesh  = pyrender.Mesh.from_trimesh(scene_mesh, smooth=True)
        scene    = pyrender.Scene(ambient_light=[0.4, 0.4, 0.4])
        scene.add(py_mesh)

        # Camera: place at eye-level, looking at the origin
        cam = pyrender.PerspectiveCamera(yfov=np.pi / 4)
        cam_pose = tf.translation_matrix([0, 0.9, 3.0])
        scene.add(cam, pose=cam_pose)

        # Key light
        light = pyrender.DirectionalLight(color=np.ones(3), intensity=3.0)
        scene.add(light, pose=cam_pose)

        r = pyrender.OffscreenRenderer(*resolution)
        color, _ = r.render(scene)
        r.delete()

        PIL.Image.fromarray(color).save(str(output_png))
        logger.info(f"  [Mesh] Thumbnail saved to {output_png.name}")
        return output_png

    except ImportError:
        logger.debug("pyrender not installed — skipping thumbnail render.")
        return None
    except Exception as exc:
        logger.warning(f"  [Mesh] Thumbnail render failed: {exc}")
        return None
