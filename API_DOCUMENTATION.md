# Image to Excel Converter - REST API Documentation

Comprehensive specifications for the Image to Excel Converter REST API backend built with Python Flask.

## Base URL
- **Local Development**: `http://localhost:5000/api`
- **Production (Render)**: `https://<your-render-app>.onrender.com/api`

---

## Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check |
| `POST` | `/convert` | Process image/PDF file to Excel & CSV |
| `POST` | `/export` | Export updated table data after UI cell edits |
| `POST` | `/merge` | Merge multiple extracted tables into single workbook |
| `GET` | `/history` | Fetch history records with search & filter |
| `DELETE`| `/history/:id` | Delete specific history entry |
| `DELETE`| `/history` | Clear entire processing history |
| `GET` | `/download/:filename` | Download generated `.xlsx` or `.csv` |
| `GET` | `/preview/:filename` | View preview of uploaded image file |

---

## 1. Health Check
Checks backend service availability and status.

- **URL**: `/health`
- **Method**: `GET`
- **Response**: `200 OK`
```json
{
  "status": "healthy",
  "service": "Image to Excel Converter API",
  "version": "1.0.0"
}
```

---

## 2. Convert Image / PDF
Uploads JPG, JPEG, PNG, BMP, or PDF file, runs OpenCV table grid detection + EasyOCR, exports `.xlsx` & `.csv`, saves history record.

- **URL**: `/convert`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`

### Form Parameters
- `file` (File, Required): Target file (Max 16MB).
- `grayscale` (Boolean, Optional): `true` (default)
- `deskew` (Boolean, Optional): `true` (default)
- `contrast` (Boolean, Optional): `true` (default)
- `denoise` (Boolean, Optional): `true` (default)
- `threshold_mode` (String, Optional): `'adaptive'` (default) | `'otsu'` | `'none'`
- `engine` (String, Optional): `'easyocr'` (default) | `'pytesseract'`

### Response Example (`200 OK`)
```json
{
  "message": "File processed successfully",
  "entry": {
    "id": "e4f8a3d1-9b12-4c56-89df-123456789abc",
    "filename": "invoice_sample.png",
    "file_type": "PNG",
    "file_size": 245120,
    "upload_date": "2026-08-06T19:15:00.000000",
    "row_count": 12,
    "col_count": 5,
    "avg_confidence": 0.94,
    "excel_filename": "a1b2c3d4_invoice_sample.xlsx",
    "csv_filename": "a1b2c3d4_invoice_sample.csv",
    "preview_filename": "a1b2c3d4_invoice_sample.png"
  },
  "sharpness": {
    "score": 342.15,
    "is_blurry": false,
    "warning": null
  },
  "table_data": [
    [
      {"text": "Item", "confidence": 0.99, "is_low_confidence": false, "bbox": [10, 10, 100, 30]},
      {"text": "Qty", "confidence": 0.98, "is_low_confidence": false, "bbox": [110, 10, 50, 30]},
      {"text": "Price", "confidence": 0.95, "is_low_confidence": false, "bbox": [160, 10, 80, 30]}
    ]
  ],
  "excel_url": "/api/download/a1b2c3d4_invoice_sample.xlsx",
  "csv_url": "/api/download/a1b2c3d4_invoice_sample.csv",
  "preview_url": "/api/preview/a1b2c3d4_invoice_sample.png"
}
```

---

## 3. Export Modified Table
Generates new downloadable Excel and CSV files after inline edits in UI table editor.

- **URL**: `/export`
- **Method**: `POST`
- **Content-Type**: `application/json`

### Request Body
```json
{
  "filename": "invoice_edited.xlsx",
  "table_data": [
    ["Item", "Qty", "Price"],
    ["Widget A", "5", "$15.00"],
    ["Widget B", "10", "$30.00"]
  ]
}
```

### Response Example (`200 OK`)
```json
{
  "message": "Export created successfully",
  "excel_url": "/api/download/789abcde_invoice_edited.xlsx",
  "csv_url": "/api/download/789abcde_invoice_edited.csv"
}
```

---

## 4. Merge Tables into Single Workbook
Merges multiple extracted table arrays into one Excel file (either as separate sheets or single stacked sheet).

- **URL**: `/merge`
- **Method**: `POST`
- **Content-Type**: `application/json`

### Request Body
```json
{
  "mode": "sheets",
  "items": [
    {"filename": "Table1.png", "table_data": [["Col1", "Col2"], ["Val1", "Val2"]]},
    {"filename": "Table2.png", "table_data": [["Col1", "Col2"], ["Val3", "Val4"]]}
  ]
}
```

---

## 5. Get History Records
Retrieves processing history with search query, file extension filter, or date filter.

- **URL**: `/history?q=invoice&type=PNG&date=2026-08-06`
- **Method**: `GET`

---

## 6. Delete History Record
- **URL**: `/history/:id`
- **Method**: `DELETE`

---

## 7. Clear All History
- **URL**: `/history`
- **Method**: `DELETE`
