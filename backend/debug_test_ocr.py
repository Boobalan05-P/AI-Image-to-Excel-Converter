import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

from services.image_processor import preprocess_image
from services.table_detector import detect_table_grid
from services.ocr_engine import process_table_ocr
from services.excel_exporter import convert_matrix_to_dataframe
import cv2

if __name__ == '__main__':
    sample_path = Path(__file__).resolve().parents[0].parent / 'uploads' / '00cae56c_test.jpeg'
    print('sample_path', sample_path)
    assert sample_path.exists(), 'Sample image not found'

    img = cv2.imread(str(sample_path))
    print('img loaded', img is not None, 'shape', None if img is None else img.shape)
    if img is None:
        raise SystemExit('Failed to read sample image')

    prep = preprocess_image(img)
    proc_img = prep['processed_image']
    print('prep processed_image type', type(proc_img), 'shape', proc_img.shape)
    print('sharpness', prep['sharpness'])

    grid = detect_table_grid(proc_img)
    print('detected rows', len(grid))
    for i, row in enumerate(grid[:5]):
        print('row', i, row)

    result = process_table_ocr(proc_img, grid)
    print('ocr table_data rows', len(result['table_data']), 'avg_conf', result['avg_confidence'])
    for i, row in enumerate(result['table_data'][:10]):
        print('row', i, [cell['text'] for cell in row])

    df = convert_matrix_to_dataframe(result['table_data'])
    print('dataframe shape', df.shape)
    print(df.head())
