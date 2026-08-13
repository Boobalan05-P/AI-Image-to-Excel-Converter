import cv2
import numpy as np

img = np.ones((400, 600, 3), dtype=np.uint8) * 255
rows, cols = 5, 4
r_h = img.shape[0] // rows
c_w = img.shape[1] // cols

for i in range(rows + 1):
    y = i * r_h
    cv2.line(img, (0, y), (img.shape[1], y), (0, 0, 0), 2)
for j in range(cols + 1):
    x = j * c_w
    cv2.line(img, (x, 0), (x, img.shape[0]), (0, 0, 0), 2)

for i in range(rows):
    for j in range(cols):
        text = f"R{i+1}C{j+1}"
        (w, h), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
        cx = j * c_w + (c_w - w) // 2
        cy = i * r_h + (r_h + h) // 2
        cv2.putText(img, text, (cx, cy), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)

cv2.imwrite('backend/test_table.png', img)
print('Wrote backend/test_table.png')
