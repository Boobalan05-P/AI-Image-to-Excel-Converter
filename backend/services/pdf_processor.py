import os
import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)

def convert_pdf_to_images(pdf_path: str) -> list:
    """
    Converts PDF pages into OpenCV image format (numpy arrays).
    Tries pdf2image first, with PyMuPDF (fitz) fallback.
    """
    images = []
    
    # Try pdf2image first
    try:
        from pdf2image import convert_from_path
        pil_images = convert_from_path(pdf_path)
        for pil_img in pil_images:
            open_cv_image = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            images.append(open_cv_image)
        logger.info(f"Converted PDF to {len(images)} images via pdf2image.")
        return images
    except Exception as e:
        logger.warning(f"pdf2image conversion failed: {str(e)}. Trying PyMuPDF / fitz fallback.")

    # Try PyMuPDF / fitz fallback
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(pdf_path)
        for page in doc:
            pix = page.get_pixmap(dpi=200)
            img_np = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.h, pix.w, pix.n))
            if pix.n == 4: # RGBA
                img_np = cv2.cvtColor(img_np, cv2.COLOR_RGBA2BGR)
            elif pix.n == 3: # RGB
                img_np = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
            images.append(img_np)
        doc.close()
        logger.info(f"Converted PDF to {len(images)} images via PyMuPDF.")
        return images
    except Exception as e:
        logger.error(f"PyMuPDF conversion failed: {str(e)}.")

    return images
