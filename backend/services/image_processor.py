import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)

def check_image_sharpness(image: np.ndarray, threshold: float = 100.0) -> dict:
    """
    Evaluates image sharpness using the Laplacian variance method.
    Returns sharpness score and whether the image is considered blurry.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    is_blurry = variance < threshold
    return {
        "score": round(variance, 2),
        "is_blurry": is_blurry,
        "warning": "Image appears blurry and may yield low OCR accuracy." if is_blurry else None
    }

def convert_to_grayscale(image: np.ndarray) -> np.ndarray:
    """Converts image to grayscale if not already."""
    if len(image.shape) == 3 and image.shape[2] == 3:
        return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return image

def apply_contrast_enhancement(gray_image: np.ndarray) -> np.ndarray:
    """Applies Contrast Limited Adaptive Histogram Equalization (CLAHE)."""
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(gray_image)

def remove_noise(gray_image: np.ndarray) -> np.ndarray:
    """Removes image noise using median blurring."""
    return cv2.medianBlur(gray_image, 3)

def apply_thresholding(gray_image: np.ndarray, mode: str = "adaptive") -> np.ndarray:
    """
    Applies adaptive thresholding or Otsu thresholding to produce a clean binary image.
    """
    if mode == "otsu":
        _, thresh = cv2.threshold(gray_image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return thresh
    else:
        # Default adaptive thresholding
        return cv2.adaptiveThreshold(
            gray_image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )

def deskew_image(image: np.ndarray) -> np.ndarray:
    """
    Detects skew angle in degrees and rotates image back to horizontal.
    """
    try:
        gray = convert_to_grayscale(image)
        # Invert colors so text/grid is white on black background
        inv = cv2.bitwise_not(gray)
        thresh = cv2.threshold(inv, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
        
        coords = np.column_stack(np.where(thresh > 0))
        if len(coords) == 0:
            return image
            
        angle = cv2.minAreaRect(coords)[-1]
        
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
            
        # Ignore negligible rotations
        if abs(angle) < 0.5 or abs(angle) > 45:
            return image
            
        (h, w) = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
        )
        logger.info(f"Image deskewed by {angle:.2f} degrees.")
        return rotated
    except Exception as e:
        logger.warning(f"Deskew failed: {str(e)}")
        return image

def preprocess_image(
    image: np.ndarray,
    grayscale: bool = True,
    deskew: bool = True,
    contrast: bool = True,
    denoise: bool = True,
    threshold_mode: str = "adaptive"  # 'none', 'adaptive', 'otsu'
) -> dict:
    """
    Full pipeline to clean and prepare an image for OCR table extraction.
    """
    processed = image.copy()
    sharpness_info = check_image_sharpness(processed)
    
    if deskew:
        processed = deskew_image(processed)
        
    if grayscale:
        processed = convert_to_grayscale(processed)
        
    if contrast and len(processed.shape) == 2:
        processed = apply_contrast_enhancement(processed)
        
    if denoise and len(processed.shape) == 2:
        processed = remove_noise(processed)
        
    if threshold_mode in ["adaptive", "otsu"] and len(processed.shape) == 2:
        processed = apply_thresholding(processed, mode=threshold_mode)
        
    return {
        "processed_image": processed,
        "sharpness": sharpness_info
    }
