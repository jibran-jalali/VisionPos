from __future__ import annotations

import cv2
import numpy as np
from PIL import Image


def decode_barcode(image: np.ndarray) -> str | None:
    try:
        from pyzbar.pyzbar import decode as zbar_decode

        pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        decoded = zbar_decode(pil_image)

        if decoded:
            return decoded[0].data.decode("utf-8", errors="replace")

        return None
    except Exception:
        return None
