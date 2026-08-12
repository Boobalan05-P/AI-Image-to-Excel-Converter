import cv2
import numpy as np
import logging
import re
import math

logger = logging.getLogger(__name__)

# Lazy initialization of EasyOCR Reader to save memory on server startup
_EASYOCR_READER = None

def get_easyocr_reader():
    global _EASYOCR_READER
    if _EASYOCR_READER is None:
        try:
            import easyocr
            logger.info("Initializing EasyOCR Reader...")
            _EASYOCR_READER = easyocr.Reader(['en'], gpu=False)
        except Exception as e:
            logger.error(f"Failed to load EasyOCR: {str(e)}")
            _EASYOCR_READER = None
    return _EASYOCR_READER

def run_pytesseract_ocr(cell_crop: np.ndarray) -> dict:
    """Fallback OCR engine using PyTesseract if installed."""
    try:
        import pytesseract
        data = pytesseract.image_to_data(cell_crop, output_type=pytesseract.Output.DICT)
        text_pieces = []
        confidences = []
        for i in range(len(data['text'])):
            t = data['text'][i].strip()
            c = int(data['conf'][i])
            if t:
                text_pieces.append(t)
                if c > 0:
                    confidences.append(c / 100.0)
        text = " ".join(text_pieces)
        avg_conf = sum(confidences) / len(confidences) if confidences else 0.8
        return {"text": text, "confidence": round(avg_conf, 2)}
    except Exception as e:
        logger.warning(f"PyTesseract execution error: {str(e)}")
        return {"text": "", "confidence": 0.0}

def ocr_crop(crop_img: np.ndarray, engine: str = "easyocr") -> dict:
    """
    Runs OCR on an cropped image cell region and computes confidence score.
    """
    if crop_img is None or crop_img.size == 0:
        return {"text": "", "confidence": 1.0}

    # Ensure crop has reasonable size
    h, w = crop_img.shape[:2]
    if h < 5 or w < 5:
        return {"text": "", "confidence": 1.0}

    # Resize small cell crops for better OCR recognition
    if h < 30 or w < 30:
        scale = max(2.0, 60.0 / max(h, w))
        crop_img = cv2.resize(crop_img, (0, 0), fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

    text = ""
    confidence = 0.0

    if engine == "easyocr":
        reader = get_easyocr_reader()
        if reader:
            try:
                if crop_img.ndim == 2:
                    crop_img = cv2.cvtColor(crop_img, cv2.COLOR_GRAY2BGR)
                elif crop_img.shape[2] == 4:
                    crop_img = cv2.cvtColor(crop_img, cv2.COLOR_BGRA2BGR)

                results = reader.readtext(crop_img)
                if results:
                    texts = [res[1] for res in results]
                    confs = [float(res[2]) for res in results]
                    text = " ".join(texts).strip()
                    confidence = float(np.mean(confs))
                else:
                    text = ""
                    confidence = 1.0
            except Exception as e:
                logger.warning(f"EasyOCR crop processing failed: {str(e)}. Falling back to PyTesseract.")
                return run_pytesseract_ocr(crop_img)
        else:
            return run_pytesseract_ocr(crop_img)
    else:
        return run_pytesseract_ocr(crop_img)

    return {
        "text": text,
        "confidence": round(confidence, 2)
    }

def auto_correct_cell_value(text: str) -> str:
    """
    Applies heuristic / AI logic to clean common OCR mistakes:
    - Replace OCR artifacts ('l' or 'I' instead of '1' in numeric patterns)
    - Clean trailing symbols
    - Normalize currencies ($1,000.00)
    """
    if not text:
        return ""
    
    cleaned = text.strip()
    
    # Currency / Number correction heuristics
    # Example: O/o -> 0 if surrounding digits (e.g. 1O00 -> 1000)
    num_pattern_check = re.sub(r'[O|o]', '0', cleaned)
    if re.match(r'^\$?\d+[\d,.]*$', num_pattern_check):
        cleaned = num_pattern_check
        
    # Replace pipe '|' with space or empty
    cleaned = cleaned.replace("|", "").strip()
    
    return cleaned


def split_compound_cell(cell: dict) -> list[dict]:
    """Split a phone-number-and-name OCR result into its two table values."""
    match = re.match(r"^(\d{10})\s+(.+)$", cell["text"])
    if not match:
        return [cell]
    x, y, w, h = cell["bbox"]
    midpoint = x + max(1, int(w * 0.35))
    first = dict(cell, text=match.group(1), bbox=[x, y, midpoint - x, h])
    name = match.group(2).strip()
    # In alphabetic names EasyOCR can mistake a terminal capital B for 8.
    if re.fullmatch(r"[A-Za-z ]*", name.replace("8", "B")):
        name = name.replace("8", "B")
    second = dict(cell, text=name, bbox=[midpoint, y, x + w - midpoint, h])
    return [first, second]

def process_table_ocr(image: np.ndarray, grid_rows: list, engine: str = "easyocr") -> dict:
    """
    Runs OCR across detected table grid cells and builds matrix structure.
    """
    table_data = []
    cell_confidences = []
    
    if grid_rows:
        for row_idx, row_boxes in enumerate(grid_rows):
            row_data = []
            for col_idx, (x, y, w, h) in enumerate(row_boxes):
                img_h, img_w = image.shape[:2]
                # Keep table rules out of the crop; they otherwise get read as
                # characters and can join adjacent values together.
                inset = min(3, max(1, min(w, h) // 5))
                x1 = max(x + inset, 0)
                y1 = max(y + inset, 0)
                x2 = min(x + w - inset, img_w)
                y2 = min(y + h - inset, img_h)
                cell_crop = image[y1:y2, x1:x2]
                result = ocr_crop(cell_crop, engine=engine)
                
                # Retry with thresholding if confidence is low
                if result["confidence"] < 0.4 and result["text"] != "":
                    gray_crop = cv2.cvtColor(cell_crop, cv2.COLOR_BGR2GRAY) if len(cell_crop.shape) == 3 else cell_crop
                    _, thresh_crop = cv2.threshold(gray_crop, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                    retry_res = ocr_crop(thresh_crop, engine=engine)
                    if retry_res["confidence"] > result["confidence"]:
                        result = retry_res

                cleaned_text = auto_correct_cell_value(result["text"])
                row_data.append({
                    "text": cleaned_text,
                    "confidence": result["confidence"],
                    "is_low_confidence": bool(result["confidence"] < 0.5) and cleaned_text != "",
                    "bbox": [x, y, w, h]
                })
                if cleaned_text != "":
                    cell_confidences.append(result["confidence"])
            # Some scanned tables only draw horizontal rules. EasyOCR then sees
            # a phone number and its following name as one text block. Preserve
            # the original three-column layout for this common data format.
            if len(row_data) == 2:
                row_data = [*split_compound_cell(row_data[0]), row_data[1]]
            table_data.append(row_data)
    else:
        # Fallback layout-based full image OCR if no grid was found
        reader = get_easyocr_reader()
        full_results = []
        if reader and engine == "easyocr":
            try:
                full_results = reader.readtext(image)
            except Exception as e:
                logger.error(f"Full OCR fallback failed: {str(e)}")

        if full_results:
            # Sort detected text boxes by top-to-bottom then left-to-right
            full_results = sorted(full_results, key=lambda res: (res[0][0][1], res[0][0][0]))
            
            # Simple line grouping
            rows = []
            current_row = []
            last_y = -1
            for bbox, text, conf in full_results:
                y = bbox[0][1]
                cleaned = auto_correct_cell_value(text)
                cell_item = {
                    "text": cleaned,
                    "confidence": round(float(conf), 2),
                    "is_low_confidence": bool(float(conf) < 0.5),
                    "bbox": [int(bbox[0][0]), int(bbox[0][1]), int(bbox[1][0] - bbox[0][0]), int(bbox[2][1] - bbox[0][1])]
                }
                if last_y == -1 or abs(y - last_y) <= 15:
                    current_row.append(cell_item)
                else:
                    rows.append(current_row)
                    current_row = [cell_item]
                last_y = y
                cell_confidences.append(float(conf))
            if current_row:
                rows.append(current_row)
            table_data = rows

    avg_table_confidence = round(float(np.mean(cell_confidences)), 2) if cell_confidences else 1.0

    return {
        "table_data": table_data,
        "avg_confidence": avg_table_confidence
    }
