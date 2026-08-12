# 📊 Image to Excel Converter (AI & OpenCV Powered)

> A production-ready, full-stack web application that automatically detects tables from images (JPG, JPEG, PNG, BMP) and PDFs, extracts data using EasyOCR, provides an interactive UI table editor, and exports styled Excel (`.xlsx`) & CSV files.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/frontend-React%2018%20%2B%20Vite-61DAFB)
![Tailwind](https://img.shields.io/badge/styling-Tailwind%20CSS-38B2AC)
![Python](https://img.shields.io/badge/backend-Python%20Flask-3776AB)
![OpenCV](https://img.shields.io/badge/computer--vision-OpenCV-5C3EE8)
![OCR](https://img.shields.io/badge/OCR-EasyOCR%20%2F%20PyTesseract-green)

---

## 🌟 Core Features

- 📁 **Multi-Format Support**: Upload JPG, JPEG, PNG, BMP, and PDF files up to 16MB.
- 🎯 **Drag & Drop Upload**: Modern drag and drop file interface with instant preview & size validation.
- 📐 **OpenCV Image Preprocessing**: Automatic deskewing, noise reduction, grayscale conversion, and adaptive thresholding.
- 🔍 **Morphological Table Grid Detection**: Detects horizontal & vertical table lines to extract exact cell bounding boxes.
- 🤖 **AI OCR Engine & Auto-Correction**: Powered by EasyOCR with low-confidence visual highlighting and heuristic correction (currency, dates, number formatting).
- ✏️ **Interactive Table Editor**: Edit extracted cells inline, add/delete rows & columns, and apply AI table cleaning before exporting.
- 📦 **Batch Upload & Workbook Merge**: Combine multiple uploaded files or tables into a single multi-sheet Excel workbook (`.xlsx`).
- 🕒 **Searchable Processing History**: Persistent JSON backend history with instant search by filename or cell text, date filter, re-download, and bulk deletion.
- 🌓 **Dark Mode / Light Mode**: Full theme toggle with persistent user preference.
- ⚡ **REST API Architecture**: Clean, modular API ready for Render (Backend) and Vercel (Frontend).

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React Icons, Axios |
| **Backend** | Python 3.9+, Flask, Flask-CORS, Gunicorn |
| **Computer Vision** | OpenCV (`opencv-python-headless`), NumPy |
| **OCR Engines** | EasyOCR (primary), PyTesseract (fallback) |
| **Data & Excel** | Pandas, OpenPyXL (styled headers, gridlines, auto column widths) |
| **PDF Support** | PyPDF2, `pdf2image`, PyMuPDF (`fitz`) |

---

## 📁 Complete Folder Structure

```
image-to-excel-converter/
├── backend/
│   ├── app.py                  # Flask REST API routes & controllers
│   ├── config.py               # Application configuration & env paths
│   ├── requirements.txt        # Backend dependencies
│   ├── Procfile                # Heroku/Render execution entry
│   ├── render.yaml             # Render deployment config
│   ├── history.json            # History database storage
│   └── services/
│       ├── __init__.py
│       ├── ocr_engine.py       # EasyOCR & PyTesseract wrapper with confidence scores
│       ├── image_processor.py  # OpenCV preprocessing (deskew, CLAHE, threshold, blur check)
│       ├── table_detector.py   # Morphological table grid & cell bounding box extraction
│       ├── pdf_processor.py    # PDF to image rasterization
│       ├── excel_exporter.py   # Pandas & OpenPyXL Excel styling & CSV exporter
│       └── history_service.py  # Search, filter, delete, and history manager
├── frontend/
│   ├── package.json            # Node dependencies
│   ├── vite.config.js          # Vite build & proxy settings
│   ├── tailwind.config.js      # Tailwind theme configuration
│   ├── postcss.config.js       # PostCSS plugins setup
│   ├── index.html              # HTML entry point
│   └── src/
│       ├── main.jsx            # React root mount
│       ├── App.jsx             # Main application layout & state
│       ├── index.css           # Design tokens, custom scrollbars, animations
│       ├── components/
│       │   ├── Navbar.jsx          # Top bar with logo, page tabs, theme toggle
│       │   ├── FileUploader.jsx    # Drag-and-drop zone & file queue
│       │   ├── PreprocessModal.jsx # Image preprocessing controls
│       │   ├── TableEditor.jsx     # Interactive editable grid & export actions
│       │   ├── BatchMergeModal.jsx # Multi-image workbook merge modal
│       │   ├── HistoryView.jsx     # History table with search & filters
│       │   ├── Toast.jsx           # Notification alert popups
│       │   └── ApiDocsModal.jsx    # Embedded API documentation viewer
│       ├── services/
│       │   └── api.js              # Axios API service client
│       └── utils/
│           └── helpers.js          # Formatting & utility functions
├── uploads/                    # Temporary uploaded image storage
├── outputs/                    # Processed .xlsx and .csv files storage
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore definitions
├── API_DOCUMENTATION.md        # Comprehensive REST API specifications
└── README.md                   # Project documentation
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Python 3.9+** installed
- **Node.js 18+** and `npm` installed
- Optional: Tesseract OCR installed locally (`tesseract` in PATH)

### 1. Clone Repository & Setup Backend
```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install backend requirements
pip install -r requirements.txt

# Run Flask backend server
python app.py
```
> Backend runs at: `http://localhost:5000`

---

### 2. Setup & Run Frontend
```bash
# Navigate to frontend directory (in new terminal)
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```
> Frontend runs at: `http://localhost:5173`

---

## 🚀 Deployment Guide

### Backend Deployment (Render)
1. Push project to a GitHub repository.
2. Go to [Render.com](https://render.com/) -> **New Web Service**.
3. Select your GitHub repository.
4. Set Root Directory to `backend`.
5. Set Build Command: `pip install -r requirements.txt`
6. Set Start Command: `gunicorn app:app`
7. Add Environment Variable: `CORS_ORIGINS` = `https://<your-vercel-domain>.vercel.app`

### Frontend Deployment (Vercel)
1. Go to [Vercel.com](https://vercel.com/) -> **New Project**.
2. Select your GitHub repository.
3. Set Framework Preset: `Vite`.
4. Set Root Directory: `frontend`.
5. Add Environment Variable: `VITE_API_BASE_URL` = `https://<your-render-backend>.onrender.com/api`
6. Click **Deploy**.

---

## 📸 Screenshots & UI Design

### Dark Mode Converter Interface
> Clean glassmorphism uploader zone, real-time preprocessing settings, and live table preview.

### Interactive Table Editor
> Highlight low-confidence OCR cells, edit inline values, add/remove rows, and trigger AI auto-correct.

### Processing History Page
> Real-time search by filename or cell text, filter by file format or date, preview images, and download past conversions.

---

## 🔮 Future Improvements

- [ ] Support handwriting OCR engine integration.
- [ ] Export to Google Sheets directly via OAuth API.
- [ ] Multilingual auto-translation for extracted tables.
- [ ] Cloud S3 / Cloudinary image storage driver.

---

## 📄 License
Distributed under the MIT License.
