import os
from pathlib import Path

# Base Directory of Backend
BASE_DIR = Path(__file__).resolve().parent.parent

# Storage Directories
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
OUTPUT_FOLDER = os.path.join(BASE_DIR, "outputs")
HISTORY_FILE = os.path.join(BASE_DIR, "backend", "history.json")

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Application Settings
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload size
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "bmp", "pdf"}

# OCR Settings
DEFAULT_OCR_ENGINE = os.environ.get("DEFAULT_OCR_ENGINE", "easyocr") # easyocr | pytesseract
EASYOCR_LANGUAGES = ["en"]
CONFIDENCE_THRESHOLD = 0.50  # Below 50% is flagged as low confidence

# CORS Settings
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")
