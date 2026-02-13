
# Sử dụng base image Python 3.10 slim
FROM python:3.11-slim

# Thiết lập thư mục làm việc
WORKDIR /app

# Cài đặt các dependencies hệ thống cần thiết cho MySQL và build tools
RUN apt-get update && apt-get install -y \
    pkg-config \
    default-libmysqlclient-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy file requirements.txt vào container
COPY requirements.txt .

# Cài đặt các thư viện Python từ requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ mã nguồn vào container
COPY . .

# Expose port mặc định của Flask
EXPOSE 5000

# Biến môi trường để Flask lắng nghe trên tất cả các interfaces
ENV FLASK_APP=run:app
ENV FLASK_RUN_HOST=0.0.0.0

# Chạy ứng dụng trực tiếp bằng python
CMD ["python", "run.py"]
