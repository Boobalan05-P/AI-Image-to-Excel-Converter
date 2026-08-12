workers = 1
threads = 1
timeout = 180
graceful_timeout = 30

# EasyOCR is memory-intensive. One worker keeps the free Render instance
# within its memory limit while allowing a single image conversion to finish.
