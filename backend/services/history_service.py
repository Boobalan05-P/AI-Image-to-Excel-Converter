import os
import json
import uuid
from datetime import datetime
import logging
from config import HISTORY_FILE, OUTPUT_FOLDER, UPLOAD_FOLDER

logger = logging.getLogger(__name__)

def load_history() -> list:
    """Reads history records from JSON backend file."""
    if not os.path.exists(HISTORY_FILE):
        save_history([])
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to read history JSON file: {str(e)}")
        return []

def save_history(data: list):
    """Writes history records list to JSON backend file."""
    try:
        os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Failed to write history JSON file: {str(e)}")

def add_history_entry(
    original_filename: str,
    file_type: str,
    file_size: int,
    row_count: int,
    col_count: int,
    avg_confidence: float,
    excel_filename: str,
    csv_filename: str,
    table_data: list,
    preview_filename: str = None
) -> dict:
    """
    Creates and persists a new conversion history entry.
    """
    history = load_history()
    entry_id = str(uuid.uuid4())
    now_iso = datetime.now().isoformat()
    
    entry = {
        "id": entry_id,
        "filename": original_filename,
        "file_type": file_type,
        "file_size": file_size,
        "upload_date": now_iso,
        "row_count": row_count,
        "col_count": col_count,
        "avg_confidence": avg_confidence,
        "excel_filename": excel_filename,
        "csv_filename": csv_filename,
        "preview_filename": preview_filename or original_filename,
        "table_data": table_data
    }
    
    # Prepend to history so newest is first
    history.insert(0, entry)
    save_history(history)
    return entry

def search_history(query: str = "", file_type: str = "", date_filter: str = "") -> list:
    """
    Filters history records based on search term, file type, or date criteria.
    """
    history = load_history()
    results = history

    if query:
        q = query.lower()
        filtered = []
        for item in results:
            # Check filename match
            if q in item["filename"].lower():
                filtered.append(item)
                continue
            # Check content in table_data
            found = False
            for row in item.get("table_data", []):
                for cell in row:
                    cell_text = cell.get("text", "") if isinstance(cell, dict) else str(cell)
                    if q in cell_text.lower():
                        found = True
                        break
                if found:
                    break
            if found:
                filtered.append(item)
        results = filtered

    if file_type and file_type != "all":
        results = [item for item in results if item.get("file_type", "").lower() == file_type.lower()]

    if date_filter:
        # Expected date format YYYY-MM-DD
        results = [item for item in results if item.get("upload_date", "").startswith(date_filter)]

    return results

def delete_history_entry(entry_id: str) -> bool:
    """Deletes a specific history record and its associated excel/csv output files."""
    history = load_history()
    target = None
    updated = []
    
    for item in history:
        if item["id"] == entry_id:
            target = item
        else:
            updated.append(item)
            
    if target:
        # Cleanup files
        for fname in [target.get("excel_filename"), target.get("csv_filename")]:
            if fname:
                file_path = os.path.join(OUTPUT_FOLDER, fname)
                if os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                    except Exception as e:
                        logger.warning(f"Could not remove output file {fname}: {str(e)}")
        save_history(updated)
        return True
    return False

def clear_all_history() -> bool:
    """Clears all history records and deletes all output files."""
    history = load_history()
    for item in history:
        for fname in [item.get("excel_filename"), item.get("csv_filename")]:
            if fname:
                file_path = os.path.join(OUTPUT_FOLDER, fname)
                if os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                    except Exception as e:
                        logger.warning(f"Could not remove file {fname}: {str(e)}")
    save_history([])
    return True
