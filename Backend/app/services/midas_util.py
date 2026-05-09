"""
Singleton MiDaS loader — loaded once on first use, reused everywhere.
Using MiDaS_small for faster inference on CPU.
"""
import torch
import numpy as np
from PIL import Image as PILImage

MODEL_PATH = "app/models/midas_v21_small-70d6b9c8.pt"

_midas = None
_transform = None
_device = None


def _build_transform_pil():
    """
    MiDaS_small transform using only PIL + torchvision.
    Resizes to 256x256 (small model uses 256, not 384).
    """
    import torchvision.transforms as T

    def pil_resize_to_numpy(img_np):
        pil = PILImage.fromarray(img_np.astype(np.uint8)).resize((256, 256), PILImage.BICUBIC)
        return np.array(pil).astype(np.float32) / 255.0

    return T.Compose([
        pil_resize_to_numpy,
        lambda img: np.transpose(img, (2, 0, 1)),
        lambda img: torch.from_numpy(np.ascontiguousarray(img)).unsqueeze(0),
        T.Normalize(mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]),
    ])


def get_midas():
    global _midas, _transform, _device

    if _midas is not None and _transform is not None:
        return _midas, _transform, _device

    _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # ── Load MiDaS_small architecture + weights ────────────────────────────────
    _midas = torch.hub.load(
        "intel-isl/MiDaS", "MiDaS_small",  # ← changed from DPT_Hybrid
        pretrained=False,
        trust_repo=True
    )
    state = torch.load(MODEL_PATH, map_location=_device, weights_only=True)
    _midas.load_state_dict(state)
    _midas.to(_device)
    _midas.eval()

    # ── Load transform: hub first, PIL fallback ────────────────────────────────
    try:
        midas_transforms = torch.hub.load(
            "intel-isl/MiDaS", "transforms", trust_repo=True
        )
        candidate = midas_transforms.small_transform  # ← changed from dpt_transform
        if callable(candidate):
            _transform = candidate
            print("✅ MiDaS transform loaded via torch.hub")
        else:
            raise ValueError("small_transform is not callable")
    except Exception as e:
        print(f"⚠️  torch.hub transform failed ({e}), using PIL fallback")
        _transform = _build_transform_pil()

    print(f"✅ MiDaS_small model loaded on {_device}")
    return _midas, _transform, _device