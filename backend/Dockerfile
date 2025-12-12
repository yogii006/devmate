FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install build dependencies for some Python packages (Pillow, PyMuPDF, etc.)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       gcc \
       libpq-dev \
       libjpeg-dev \
       zlib1g-dev \
       ffmpeg \
       libmagic1 \
       git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt ./
RUN pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

# Copy app source
COPY . /app

EXPOSE 8000

# Default command (can be overridden in docker-compose for development)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
