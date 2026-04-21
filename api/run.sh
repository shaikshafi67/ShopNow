#!/usr/bin/env bash
# =============================================================================
# DRAPE3D — Start the FastAPI server
# Usage:  bash api/run.sh [--reload] [--port 8000]
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")"   # ensure we run from the api/ directory

# Activate virtualenv
source .venv/Scripts/activate 2>/dev/null || source .venv/bin/activate

# Parse optional flags
RELOAD=""
PORT=8000
while [[ $# -gt 0 ]]; do
    case "$1" in
        --reload) RELOAD="--reload"; shift ;;
        --port)   PORT="$2"; shift 2 ;;
        *)        echo "Unknown option: $1"; exit 1 ;;
    esac
done

echo "Starting DRAPE3D API on http://localhost:${PORT} ..."
echo "Interactive docs: http://localhost:${PORT}/docs"
echo ""

# CUDA_VISIBLE_DEVICES controls which GPU is used (set in .env or here)
export CUDA_VISIBLE_DEVICES="${CUDA_DEVICE:-0}"

# Start uvicorn
uvicorn app.main:app \
    --host 0.0.0.0 \
    --port "${PORT}" \
    --workers 1 \
    --log-level info \
    ${RELOAD}
