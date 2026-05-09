import uuid
import asyncio
from datetime import datetime, timezone
from functools import partial

import torch
from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from PIL import Image
from io import BytesIO
import numpy as np

from app.database import get_db
from app.models.analysis_tasks import AnalysisTask
from app.services import yolo_util, nutrition_calc
from app.services.midas_util import get_midas
from app.utils.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/food", tags=["Food"])


FOOD_INFER_SIZE = 128  # higher than depth check (128 vs 64) for better portion accuracy

def _get_depth_map(img_np: np.ndarray) -> np.ndarray:
    from PIL import Image as PILImage
    midas, transform, device = get_midas()
    # Resize before inference to prevent CPU hang on full-res images
    pil = PILImage.fromarray(img_np).resize((FOOD_INFER_SIZE, FOOD_INFER_SIZE), PILImage.BILINEAR)
    img_small = np.array(pil)
    input_batch = transform(img_small).to(device)
    with torch.no_grad():
        pred = midas(input_batch)
        # Normalize to (1, 1, H, W) regardless of which model path returned the tensor.
        # Hub model returns (H, W); offline model returns (1, H, W).
        # Both cases are handled by squeeze() then reshaping to 4D.
        pred = pred.squeeze()               # → (H, W) in all cases
        pred = pred.unsqueeze(0).unsqueeze(0)  # → (1, 1, H, W) for interpolate
        pred = torch.nn.functional.interpolate(
            pred, size=img_np.shape[:2],
            mode="bicubic", align_corners=False
        ).squeeze()
    depth = pred.cpu().numpy()
    depth_norm = (depth - depth.min()) / (depth.max() - depth.min() + 1e-8)
    table_depth = np.percentile(depth_norm, 95)
    return (depth_norm / (table_depth + 1e-8)) * 30.0


@router.post("/analyze")
async def analyze_food(
    file: UploadFile = File(...),
    bbox_x: int = Form(315),
    bbox_y: int = Form(505),
    bbox_w: int = Form(5),
    bbox_h: int = Form(8),
    camera_height_cm: float = Form(30.0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file")

    task_id = str(uuid.uuid4())

    task = AnalysisTask(
        task_id=task_id,
        user_id=current_user.id,
        status="processing"
    )
    db.add(task)
    db.commit()

    def _run_pipeline(image_bytes_inner, task_id_inner):
        """
        CPU-bound ML pipeline — runs in a thread pool so the async event loop
        is never blocked. Returns a (status, result_or_error) tuple.
        """
        img = Image.open(BytesIO(image_bytes_inner)).convert("RGB")
        img_np = np.array(img)

        depth_map = _get_depth_map(img_np)

        cls_result = yolo_util.classify(img_np)
        if cls_result is None:
            return ("failed", "Classification model returned no result")

        food_class_name = cls_result["class_name"]
        confidence      = cls_result["confidence"]

        seg = yolo_util.segment(img_np)
        if seg is None:
            return ("failed", "Segmentation model could not detect food region")

        # nutrition_calc needs a DB session — pass db from outer scope
        result = nutrition_calc.calculate_nutrition(
            seg["mask"], depth_map, food_class_name, db
        )
        if result is None:
            return ("failed", f"Food '{food_class_name}' not in nutrition DB")

        result["confidence"]     = confidence
        result["mask_image_url"] = None
        return ("done", result)

    try:
        loop = asyncio.get_event_loop()
        status_val, payload = await loop.run_in_executor(
            None, partial(_run_pipeline, image_bytes, task_id)
        )
        task.status       = status_val
        task.completed_at = datetime.now(timezone.utc)
        if status_val == "done":
            task.result_json = payload
        else:
            task.error_msg   = payload
        db.commit()

    except Exception as e:
        task.status       = "failed"
        task.error_msg    = str(e)
        task.completed_at = datetime.now(timezone.utc)
        db.commit()

    return {"task_id": task_id}


@router.get("/result/{task_id}")
async def get_result(task_id: str, db: Session = Depends(get_db)):
    task = db.query(AnalysisTask).filter(AnalysisTask.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status in ("pending", "processing"):
        return {"status": "processing"}
    if task.status == "failed":
        return {"status": "failed", "error": task.error_msg}

    return {"status": "done", **task.result_json}


@router.post("/detect-only")
async def detect_only(file: UploadFile = File(...)):
    image_bytes = await file.read()
    img = Image.open(BytesIO(image_bytes)).convert("RGB")
    img_np = np.array(img)
    result = yolo_util.detect_only(img_np)
    if result is None:
        raise HTTPException(status_code=404, detail="No food detected")
    return result