import os
import uuid
import logging
import cv2
import numpy as np
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

from config import (
    UPLOAD_FOLDER,
    OUTPUT_FOLDER,
    MAX_CONTENT_LENGTH,
    ALLOWED_EXTENSIONS,
    CORS_ORIGINS,
    DEFAULT_OCR_ENGINE
)
from services.image_processor import preprocess_image
from services.table_detector import detect_table_grid
from services.ocr_engine import get_easyocr_reader, process_table_ocr
from services.pdf_processor import convert_pdf_to_images
from services.excel_exporter import convert_matrix_to_dataframe, generate_styled_excel, generate_csv, merge_tables_to_excel
from services.history_service import (
    add_history_entry,
    search_history,
    delete_history_entry,
    clear_all_history,
    load_history
)

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ImageToExcelApp")

def clean_data(obj):
    if isinstance(obj, dict):
        return {k: clean_data(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_data(i) for i in obj]
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif hasattr(obj, 'item'):
        return obj.item()
    return obj

app = Flask(__name__)
import json
import numpy as np
from flask import Flask

# Custom JSON Encoder to convert numpy booleans/types automatically
class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, (np.bool_, bool)):
            return bool(obj)
        return super(NpEncoder, self).default(obj)

app = Flask(__name__)
app.json_encoder = NpEncoder
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER

# On Render, loading EasyOCR's neural-network weights inside the first upload
# request can consume the entire Gunicorn request timeout. We still want to
# warm the model for faster first requests, but doing the work synchronously
# can block process startup and trigger platform timeouts. Start warming in a
# background thread so the Flask app becomes responsive immediately.
if os.environ.get("WARM_OCR_ON_STARTUP", "true").lower() == "true" and DEFAULT_OCR_ENGINE == "easyocr":
    logger.info("Scheduling EasyOCR model warm-up in background thread.")
    try:
        import threading
        def _warm_reader():
            try:
                logger.info("Background: Initializing EasyOCR Reader...")
                get_easyocr_reader()
                logger.info("Background: EasyOCR warm-up complete.")
            except Exception:
                logger.exception("Background: EasyOCR warm-up failed")

        t = threading.Thread(target=_warm_reader, daemon=True)
        t.start()
    except Exception:
        logger.exception("Failed to start background thread for EasyOCR warm-up")

# Enable CORS for frontend integration
from flask import make_response

# Enable CORS for frontend integration (primary). Keep explicit after_request
# handler to ensure preflight responses always include the required headers
CORS(app, resources={r"/api/*": {"origins": CORS_ORIGINS}})
logger.info(f"CORS origins configured: {CORS_ORIGINS}")


@app.after_request
def add_cors_headers(response):
    # Always add permissive CORS headers for API routes so browser preflight
    # responses include Access-Control-Allow-Origin. This mirrors the value
    # from configuration but falls back to '*' to avoid silent failures.
    try:
        origin = request.headers.get('Origin')
        allowed = CORS_ORIGINS or '*'
        # If wildcard configured, allow all origins
        if allowed == '*':
            response.headers['Access-Control-Allow-Origin'] = '*'
        else:
            # If origin is present and allowed, echo it back
            if origin and (origin == allowed or origin in str(allowed)):
                response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
        response.headers['Access-Control-Expose-Headers'] = 'Content-Disposition'
        response.headers['Access-Control-Allow-Credentials'] = 'false'
    except Exception:
        logger.exception('Failed to add CORS headers to response')
    return response

def is_allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for Render monitoring."""
    return jsonify({
        "status": "healthy",
        "service": "Image to Excel Converter API",
        "version": "1.0.0"
    }), 200

@app.route('/api/convert', methods=['POST'])
def convert_file():
    """
    Main endpoint: Uploads image or PDF, runs OpenCV table detection + OCR,
    generates Excel (.xlsx) and CSV files, saves history, and returns data.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Selected filename is empty"}), 400

    if not is_allowed_file(file.filename):
        return jsonify({"error": f"Invalid file format. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"}), 400

    # Parse preprocessing options from form payload
    grayscale = request.form.get('grayscale', 'true').lower() == 'true'
    deskew = request.form.get('deskew', 'true').lower() == 'true'
    contrast = request.form.get('contrast', 'true').lower() == 'true'
    denoise = request.form.get('denoise', 'true').lower() == 'true'
    threshold_mode = request.form.get('threshold_mode', 'adaptive') # 'none', 'adaptive', 'otsu'
    engine = request.form.get('engine', DEFAULT_OCR_ENGINE)

    original_filename = secure_filename(file.filename)
    ext = original_filename.rsplit('.', 1)[1].lower()
    unique_prefix = str(uuid.uuid4())[:8]
    saved_filename = f"{unique_prefix}_{original_filename}"
    upload_path = os.path.join(app.config['UPLOAD_FOLDER'], saved_filename)
    file.save(upload_path)
    file_size = os.path.getsize(upload_path)

    try:
        page_images = []
        if ext == 'pdf':
            page_images = convert_pdf_to_images(upload_path)
            if not page_images:
                return jsonify({"error": "Could not extract images from PDF file"}), 422
        else:
            img = cv2.imread(upload_path)
            if img is None:
                return jsonify({"error": "Invalid or corrupted image file"}), 422
            page_images = [img]

        all_extracted_tables = []
        overall_confidences = []
        sharpness_info = None

        for page_idx, raw_img in enumerate(page_images):
            # Preprocess image
            prep_result = preprocess_image(
                raw_img,
                grayscale=grayscale,
                deskew=deskew,
                contrast=contrast,
                denoise=denoise,
                threshold_mode=threshold_mode
            )
            processed_img = prep_result["processed_image"]
            if page_idx == 0:
                sharpness_info = prep_result["sharpness"]

            # Detect and OCR from the original pixels. Thresholded previews are
            # useful for diagnostics, but low-resolution JPEG text and pale
            # table rules lose detail after binarisation.
            grid_rows = detect_table_grid(raw_img)

            # Perform OCR on cells / layout using the same preprocessed image
            # so OCR sees the cleaned version of the table regions.
            ocr_res = process_table_ocr(raw_img, grid_rows, engine=engine)
            all_extracted_tables.extend(ocr_res["table_data"])
            overall_confidences.append(ocr_res["avg_confidence"])

        avg_confidence = round(float(np.mean(overall_confidences)), 2) if overall_confidences else 1.0

        # Convert matrix to Pandas DataFrame
        df = convert_matrix_to_dataframe(all_extracted_tables)
        row_count, col_count = df.shape

        # Output filenames
        base_name = os.path.splitext(original_filename)[0]
        excel_filename = f"{unique_prefix}_{base_name}.xlsx"
        csv_filename = f"{unique_prefix}_{base_name}.csv"

        excel_path = os.path.join(app.config['OUTPUT_FOLDER'], excel_filename)
        csv_path = os.path.join(app.config['OUTPUT_FOLDER'], csv_filename)

        # Generate files
        generate_styled_excel(df, excel_path, sheet_name="Extracted_Table", include_header=False)
        generate_csv(df, csv_path, include_header=False)

        # Add entry to history JSON backend
        history_entry = add_history_entry(
            original_filename=original_filename,
            file_type=ext.upper(),
            file_size=file_size,
            row_count=row_count,
            col_count=col_count,
            avg_confidence=avg_confidence,
            excel_filename=excel_filename,
            csv_filename=csv_filename,
            table_data=all_extracted_tables,
            preview_filename=saved_filename
        )

        # OpenCV/NumPy results (for example the blur flag in ``sharpness``)
        # can contain NumPy scalar types. Flask's JSON provider cannot encode
        # those types directly, which previously caused a successful conversion
        # to end as a 500 response before the UI could receive its Excel URL.
        response_payload = clean_data({
            "message": "File processed successfully",
            "entry": history_entry,
            "sharpness": sharpness_info,
            "table_data": all_extracted_tables,
            "excel_url": f"/api/download/{excel_filename}",
            "csv_url": f"/api/download/{csv_filename}",
            "preview_url": f"/api/preview/{saved_filename}"
        })
        return jsonify(response_payload), 200

    except Exception as e:
        logger.error(f"Error processing file {original_filename}: {str(e)}", exc_info=True)
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500

@app.route('/api/export', methods=['POST'])
def export_custom_table():
    """
    Re-generates Excel and CSV files from modified table data edited by user in UI.
    """
    data = request.get_json()
    if not data or 'table_data' not in data:
        return jsonify({"error": "Invalid request body"}), 400

    table_data = data['table_data']
    original_filename = data.get('filename', 'edited_table.xlsx')
    history_id = data.get('id')

    df = convert_matrix_to_dataframe(table_data)
    unique_prefix = str(uuid.uuid4())[:8]
    base_name = os.path.splitext(secure_filename(original_filename))[0]

    excel_filename = f"{unique_prefix}_{base_name}.xlsx"
    csv_filename = f"{unique_prefix}_{base_name}.csv"

    excel_path = os.path.join(app.config['OUTPUT_FOLDER'], excel_filename)
    csv_path = os.path.join(app.config['OUTPUT_FOLDER'], csv_filename)

    generate_styled_excel(df, excel_path, include_header=False)
    generate_csv(df, csv_path, include_header=False)

    return jsonify({
        "message": "Export created successfully",
        "excel_url": f"/api/download/{excel_filename}",
        "csv_url": f"/api/download/{csv_filename}"
    }), 200

@app.route('/api/merge', methods=['POST'])
def merge_files():
    """
    Merges multiple table datasets (or selected history items) into a single Excel workbook.
    """
    data = request.get_json()
    if not data or 'items' not in data:
        return jsonify({"error": "No items specified for merge"}), 400

    items = data['items']
    mode = data.get('mode', 'sheets') # 'sheets' or 'merged'
    output_filename = f"Merged_Workbook_{str(uuid.uuid4())[:6]}.xlsx"
    output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)

    try:
        merge_tables_to_excel(items, output_path, mode=mode)
        return jsonify({
            "message": "Workbook merged successfully",
            "excel_url": f"/api/download/{output_filename}"
        }), 200
    except Exception as e:
        logger.error(f"Merge error: {str(e)}")
        return jsonify({"error": f"Failed to merge files: {str(e)}"}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    """Returns history entries with search and filter support."""
    q = request.args.get('q', '')
    file_type = request.args.get('type', '')
    date_filter = request.args.get('date', '')

    records = search_history(query=q, file_type=file_type, date_filter=date_filter)
    return jsonify(clean_data({"history": records})), 200

@app.route('/api/history/<entry_id>', methods=['DELETE'])
def delete_history_item(entry_id):
    """Deletes a single history record and files."""
    success = delete_history_entry(entry_id)
    if success:
        return jsonify({"message": "Record deleted successfully"}), 200
    return jsonify({"error": "Record not found"}), 404

@app.route('/api/history', methods=['DELETE'])
def clear_history():
    """Clears all history records and files."""
    clear_all_history()
    return jsonify({"message": "All history cleared"}), 200

@app.route('/api/download/<filename>', methods=['GET'])
def download_file(filename):
    """Serves downloadable output Excel / CSV files."""
    file_path = os.path.join(app.config['OUTPUT_FOLDER'], filename)
    if not os.path.exists(file_path):
        logger.error(f"Requested download file not found: {file_path}")
        return jsonify({"error": "Requested file not found"}), 404
    return send_from_directory(app.config['OUTPUT_FOLDER'], filename, as_attachment=True)

@app.route('/api/preview/<filename>', methods=['GET'])
def preview_file(filename):
    """Serves uploaded preview images."""
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(file_path):
        logger.error(f"Requested preview file not found: {file_path}")
        return jsonify({"error": "Requested preview file not found"}), 404
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
