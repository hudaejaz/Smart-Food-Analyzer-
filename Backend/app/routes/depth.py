from fastapi import APIRouter, File, UploadFile, Form
from PIL import Image
import numpy as np
from io import BytesIO
import torch
from app.services.midas_util import get_midas

router = APIRouter(prefix="/depth", tags=["Depth"])

DEPTH_MIN = 550
DEPTH_MAX = 1200
DEPTH_TOO_NEAR = 0.75
DEPTH_TOO_FAR  = 0.25


def _run_midas(img_bytes: bytes):
    midas, transform, device = get_midas()
    img = Image.open(BytesIO(img_bytes)).convert("RGB")
    img_np = np.array(img)
    input_batch = transform(img_np).to(device)
    with torch.no_grad():
        pred = midas(input_batch)
        pred = torch.nn.functional.interpolate(
            pred.unsqueeze(1), size=img_np.shape[:2],
            mode="bicubic", align_corners=False
        ).squeeze()
    return pred.cpu().numpy()


# ── POST /depth  — called by CameraScreen every ~1.2s ────────────────────────
# Returns raw MiDaS centre-crop score; app checks 550 ≤ depth ≤ 1200
@router.post("")
@router.post("/")
async def depth_raw(file: UploadFile = File(...)):
    img_bytes = await file.read()
    depth_map = _run_midas(img_bytes)
    h, w = depth_map.shape
    centre = float(np.mean(depth_map[h // 3: 2 * h // 3, w // 3: 2 * w // 3]))
    return {"depth": centre}


# ── POST /depth/validate — legacy, kept for backward compat ──────────────────
@router.post("/validate")
async def validate_depth(
    file: UploadFile = File(...),
    x: int = Form(315), y: int = Form(505),
    w: int = Form(5),   h: int = Form(8)
):
    img_bytes = await file.read()
    depth_map = _run_midas(img_bytes)
    depth_norm = (depth_map - depth_map.min()) / (depth_map.max() - depth_map.min() + 1e-8)
    roi = depth_norm[y:y + h, x:x + w]
    score = float(np.mean(roi)) if roi.size > 0 else float(depth_norm[depth_norm.shape[0] // 2, depth_norm.shape[1] // 2])

    if score > DEPTH_TOO_NEAR:
        return {"status": "too_near", "depth_score": score, "color": "red",   "message": "Too close! Move camera back."}
    elif score < DEPTH_TOO_FAR:
        return {"status": "too_far",  "depth_score": score, "color": "red",   "message": "Too far! Move camera closer."}
    else:
        return {"status": "valid",    "depth_score": score, "color": "green", "message": "Perfect distance!"}