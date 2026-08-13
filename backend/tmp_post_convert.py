import requests
url = 'http://localhost:5000/api/convert'
files = {'file': open('backend/test_table.png', 'rb')}
data = {
    'grayscale': 'true',
    'deskew': 'true',
    'contrast': 'true',
    'denoise': 'true',
    'threshold_mode': 'adaptive',
    'engine': 'easyocr'
}
resp = requests.post(url, files=files, data=data, timeout=300)
print('STATUS', resp.status_code)
print(resp.text)
