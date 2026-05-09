from ultralytics import YOLO
import numpy as np
import cv2

# ── Segmentation model (epoch8.pt) — used for mask / portion estimation ────────
SEG_MODEL_PATH = "app/models/epoch8.pt"

# ── Classification model (best/) — used for food label / confidence ────────────
CLS_MODEL_PATH = "app/models/best.pt"

_seg_model = None
_cls_model = None


def load_model():
    """Pre-load both YOLO models at startup."""
    _load_seg_model()
    _load_cls_model()


def _load_seg_model():
    global _seg_model
    if _seg_model is None:
        print("Loading YOLO segmentation model (epoch8.pt)...")
        _seg_model = YOLO(SEG_MODEL_PATH)
        print("Segmentation model loaded.")
    return _seg_model


def _load_cls_model():
    global _cls_model
    if _cls_model is None:
        print("Loading YOLO classification model (best/)...")
        _cls_model = YOLO(CLS_MODEL_PATH)
        print("Classification model loaded.")
    return _cls_model


def classify(img_np: np.ndarray):
    """
    Run YOLOv8 classification using the 'best' model weights.
    Returns top-1 class name and confidence, or None if inference fails.
    """
    model = _load_cls_model()
    results = model(img_np, verbose=False)
    probs = results[0].probs
    if probs is None:
        return None
    top1_idx = int(probs.top1)
    top1_conf = float(probs.top1conf.cpu().item())
    class_name = results[0].names[top1_idx]
    return {
        "class_name": class_name,
        "confidence": top1_conf,
    }


def detect_only(img_np: np.ndarray):
    """Fast detection using segmentation model. Returns top class, confidence, bbox."""
    model = _load_seg_model()
    results = model(img_np, conf=0.05, iou=0.7, verbose=False)
    boxes = results[0].boxes
    if len(boxes) == 0:
        return None
    class_names = results[0].names
    idx = int(np.argmax(boxes.conf.cpu().numpy()))
    cls = int(boxes.cls.cpu().numpy()[idx])
    conf = float(boxes.conf.cpu().numpy()[idx])
    bbox = boxes.xyxy.cpu().numpy()[idx].tolist()
    return {
        "detected_class": class_names[cls],
        "confidence": conf,
        "bbox": {"x": bbox[0], "y": bbox[1], "w": bbox[2] - bbox[0], "h": bbox[3] - bbox[1]}
    }


def segment(img_np: np.ndarray):
    """
    Full segmentation using epoch8.pt. Returns mask only.
    Class name and confidence are sourced from classify() in the pipeline.
    """
    model = _load_seg_model()
    results = model(img_np, conf=0.05, iou=0.7, verbose=False)
    boxes = results[0].boxes
    if len(boxes) == 0 or results[0].masks is None:
        return None
    idx = int(np.argmax(boxes.conf.cpu().numpy()))
    mask = results[0].masks.data.cpu().numpy()[idx]
    if mask.shape != img_np.shape[:2]:
        mask = cv2.resize(mask, (img_np.shape[1], img_np.shape[0]))
    return {
        "mask": mask,
    }
