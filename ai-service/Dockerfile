FROM python:3.10-slim

WORKDIR /app

# Cài đặt thư viện hệ thống cần thiết (nếu có)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy và cài đặt requirements trước để tận dụng Docker cache layer
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ mã nguồn, model và data vào container
COPY . .

# Expose port mặc định của FastAPI
EXPOSE 8000

# Chạy ứng dụng bằng Uvicorn
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]