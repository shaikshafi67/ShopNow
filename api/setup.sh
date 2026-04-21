#!/usr/bin/env bash
# =============================================================================
# DRAPE3D — Python API setup script
# Run once from the project root:  bash api/setup.sh
# =============================================================================
set -euo pipefail

# ── 0. Verify prerequisites ───────────────────────────────────────────────────
echo "=== Checking prerequisites ==="
python --version   || { echo "ERROR: Python 3.11+ required"; exit 1; }
nvidia-smi         || echo "WARNING: nvidia-smi not found — GPU may not be configured"

# ── 1. Create and activate virtualenv ────────────────────────────────────────
echo ""
echo "=== Creating virtual environment ==="
python -m venv .venv
# shellcheck disable=SC1091
source .venv/Scripts/activate 2>/dev/null || source .venv/bin/activate

# ── 2. Install PyTorch with CUDA 12.1 support ────────────────────────────────
echo ""
echo "=== Installing PyTorch (CUDA 12.1) ==="
pip install torch==2.4.1 torchvision==0.19.1 \
    --index-url https://download.pytorch.org/whl/cu121 \
    --no-deps

# ── 3. Install remaining requirements ────────────────────────────────────────
echo ""
echo "=== Installing Python dependencies ==="
pip install -r requirements.txt

# ── 4. Copy .env ─────────────────────────────────────────────────────────────
echo ""
if [ ! -f .env ]; then
    cp .env.example .env
    echo "=== .env created from .env.example — edit it before starting the server ==="
else
    echo "=== .env already exists — skipping ==="
fi

# ── 5. Create output / model directories ─────────────────────────────────────
mkdir -p outputs/meshes outputs/intermediates models/checkpoints

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  Setup complete!                                                 ║"
echo "║                                                                  ║"
echo "║  NEXT STEPS — install the ML models (do once):                  ║"
echo "║                                                                  ║"
echo "║  2D VTON (OOTDiffusion):                                        ║"
echo "║    git clone https://github.com/levihsu/OOTDiffusion            ║"
echo "║            models/ootdiffusion                                   ║"
echo "║    huggingface-cli download levihsu/OOTDiffusion                ║"
echo "║            --local-dir models/checkpoints/ootd                  ║"
echo "║                                                                  ║"
echo "║  3D Reconstruction (PIFuHD):                                    ║"
echo "║    git clone https://github.com/facebookresearch/pifuhd         ║"
echo "║            models/pifuhd                                         ║"
echo "║    wget https://dl.fbaipublicfiles.com/pifuhd/checkpoints/      ║"
echo "║         pifuhd_final.pt -O models/checkpoints/pifuhd/           ║"
echo "║         pifuhd_final.pt                                          ║"
echo "║                                                                  ║"
echo "║  Then start the API:  bash api/run.sh                           ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
