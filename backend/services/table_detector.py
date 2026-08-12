import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)


def _cluster_positions(positions: list[int], tolerance: int = 2) -> list[int]:
    """Collapse multiple Hough detections of the same drawn line."""
    if not positions:
        return []
    groups = [[positions[0]]]
    for position in sorted(positions[1:]):
        if position - groups[-1][-1] <= tolerance:
            groups[-1].append(position)
        else:
            groups.append([position])
    return [round(sum(group) / len(group)) for group in groups]


def _detect_ruled_grid(gray: np.ndarray) -> list:
    """Detect faint ruled tables (including tables with no vertical separators)."""
    height, width = gray.shape
    # JPEG screenshots often have pale grey rules. Otsu discards those rules, so
    # retain them explicitly before looking for long straight segments.
    rule_mask = cv2.inRange(gray, 0, 240)
    horizontal_lines = cv2.HoughLinesP(
        rule_mask, 1, np.pi / 180, threshold=max(35, width // 8),
        minLineLength=max(30, int(width * 0.65)), maxLineGap=8,
    )
    vertical_lines = cv2.HoughLinesP(
        rule_mask, 1, np.pi / 180, threshold=max(25, height // 4),
        minLineLength=max(20, int(height * 0.55)), maxLineGap=4,
    )
    if horizontal_lines is None:
        return []

    horizontal = []
    vertical = []
    for x1, y1, x2, y2 in horizontal_lines[:, 0]:
        if abs(y2 - y1) <= 2 and abs(x2 - x1) >= width * 0.65:
            horizontal.append(round((y1 + y2) / 2))
    if vertical_lines is not None:
        for x1, y1, x2, y2 in vertical_lines[:, 0]:
            if abs(x2 - x1) <= 2 and abs(y2 - y1) >= height * 0.55:
                vertical.append(round((x1 + x2) / 2))

    horizontal = _cluster_positions(sorted(horizontal))
    vertical = _cluster_positions(sorted(vertical))
    if len(horizontal) < 3:
        return []

    # A border can be absent in cropped images. The image edges are reliable
    # final boundaries in that case.
    x_lines = _cluster_positions(sorted([0, *vertical, width]))
    y_lines = _cluster_positions(sorted([0, *horizontal, height]))
    if len(x_lines) < 2 or len(y_lines) < 3:
        return []

    rows = []
    for y1, y2 in zip(y_lines, y_lines[1:]):
        if y2 - y1 < 8:
            continue
        row = []
        for x1, x2 in zip(x_lines, x_lines[1:]):
            if x2 - x1 >= 15:
                row.append((x1, y1, x2 - x1, y2 - y1))
        if row:
            rows.append(row)
    return rows

def detect_table_grid(image: np.ndarray) -> list:
    """
    Detects table cells using OpenCV morphological kernel operations.
    Returns a 2D matrix of bounding boxes: [[(x,y,w,h), ...], [(x,y,w,h), ...]]
    representing rows and columns.
    """
    try:
        # Convert to gray if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        ruled_grid = _detect_ruled_grid(gray)
        if ruled_grid:
            logger.info("Detected %d table rows using ruled-line analysis.", len(ruled_grid))
            return ruled_grid

        # Invert image (white grid lines on black background)
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
        thresh = cv2.medianBlur(thresh, 3)

        # Kernel dimensions based on image width/height
        img_h, img_w = gray.shape
        scale = 30
        horiz_kernel_size = max(10, img_w // scale)
        vert_kernel_size = max(10, img_h // scale)

        # Detect horizontal lines
        horiz_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (horiz_kernel_size, 1))
        horiz_lines = cv2.erode(thresh, horiz_kernel, iterations=2)
        horiz_lines = cv2.dilate(horiz_lines, horiz_kernel, iterations=2)

        # Detect vertical lines
        vert_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, vert_kernel_size))
        vert_lines = cv2.erode(thresh, vert_kernel, iterations=2)
        vert_lines = cv2.dilate(vert_lines, vert_kernel, iterations=2)

        # Table grid mask (combine horizontal and vertical lines)
        table_grid = cv2.bitwise_or(horiz_lines, vert_lines)
        table_grid = cv2.dilate(table_grid, cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3)), iterations=1)

        # Find contours of grid cells
        contours, _ = cv2.findContours(table_grid, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

        boxes = []
        min_cell_w, min_cell_h = 15, 10
        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            # Filter out tiny noise contours or the entire image boundary
            if w > min_cell_w and h > min_cell_h and not (w > img_w * 0.98 and h > img_h * 0.98):
                boxes.append((x, y, w, h))

        if not boxes:
            logger.info("No explicit table grid lines detected. Falling back to whole layout area.")
            return []

        # Sort bounding boxes into rows and columns
        boxes = sorted(boxes, key=lambda b: (b[1], b[0]))
        
        # Group into rows by y coordinate similarity
        rows = []
        current_row = []
        row_y_threshold = 12  # Margin of pixels to consider cells in the same row

        for box in boxes:
            if not current_row:
                current_row.append(box)
            else:
                last_y = current_row[0][1]
                if abs(box[1] - last_y) <= row_y_threshold:
                    current_row.append(box)
                else:
                    # Sort current row left to right by x
                    current_row.sort(key=lambda b: b[0])
                    rows.append(current_row)
                    current_row = [box]

        if current_row:
            current_row.sort(key=lambda b: b[0])
            rows.append(current_row)

        logger.info(f"Detected {len(rows)} table rows using OpenCV grid analysis.")
        return rows

    except Exception as e:
        logger.error(f"Error in table grid detection: {str(e)}")
        return []
