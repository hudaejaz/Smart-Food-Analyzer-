"""
Celery worker tasks.
Fixes:
 - image_bytes (raw bytes) cannot be JSON-serialised → pass base64 string instead
 - MiDaS was loaded a second time here; now uses singleton get_midas()
"""
import base64
import numpy as np
import torch
from datetime import datetime, timezone
from io import BytesIO
from PIL import Image

from app.worker.celery_app import celery_app
from app.database import SessionLocal
from app.models.analysis_tasks import AnalysisTask
from app.services import yolo_util, nutrition_calc
from app.services.midas_util import get_midas


def _get_depth_map(img_np: np.ndarray) -> np.ndarray:
    midas, transform, device = get_midas()
    input_batch = transform(img_np).to(device)
    with torch.no_grad():
        pred = midas(input_batch)
        pred = torch.nn.functional.interpolate(
            pred.unsqueeze(1), size=img_np.shape[:2],
            mode="bicubic", align_corners=False
        ).squeeze()
    depth = pred.cpu().numpy()
    depth_norm = (depth - depth.min()) / (depth.max() - depth.min() + 1e-8)
    table_depth = np.percentile(depth_norm, 95)
    return (depth_norm / (table_depth + 1e-8)) * 30.0  # 30 cm camera height


@celery_app.task(bind=True)
def run_food_analysis(self, task_id: str, image_b64: str, bbox_coords: dict, camera_height_cm: float):
    """
    image_b64 — base64-encoded JPEG string (JSON-serialisable).
    food.py encodes bytes → base64 before enqueuing; we decode here.
    """
    db = SessionLocal()
    try:
        task = db.query(AnalysisTask).filter(AnalysisTask.task_id == task_id).first()
        task.status = "processing"
        db.commit()

        # Decode image
        image_bytes = base64.b64decode(image_b64)
        img = Image.open(BytesIO(image_bytes)).convert("RGB")
        img_np = np.array(img)

        # MiDaS depth
        depth_map = _get_depth_map(img_np)

        # YOLOv8 classification (get class name + confidence)
        cls_result = yolo_util.classify(img_np)
        if cls_result is None:
            task.status = "failed"
            task.error_msg = "No food detected"
            task.completed_at = datetime.now(timezone.utc)
            db.commit()
            return

        class_name = cls_result["class_name"]
        confidence = cls_result["confidence"]

        # YOLOv8 segmentation (get mask only)
        seg = yolo_util.segment(img_np)
        if seg is None:
            task.status = "failed"
            task.error_msg = "No food detected"
            task.completed_at = datetime.now(timezone.utc)
            db.commit()
            return

        # Nutrition calculation
        result = nutrition_calc.calculate_nutrition(seg["mask"], depth_map, class_name, db)
        if result is None:
            task.status = "failed"
            task.error_msg = f"Food '{class_name}' not in nutrition DB"
            task.completed_at = datetime.now(timezone.utc)
            db.commit()
            return

        result["confidence"] = confidence
        result["mask_image_url"] = None

        task.status = "done"
        task.result_json = result
        task.completed_at = datetime.now(timezone.utc)
        db.commit()

    except Exception as e:
        task = db.query(AnalysisTask).filter(AnalysisTask.task_id == task_id).first()
        if task:
            task.status = "failed"
            task.error_msg = str(e)
            task.completed_at = datetime.now(timezone.utc)
            db.commit()
    finally:
        db.close()
