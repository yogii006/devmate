# Repo-root Dockerfile: builds frontend and backend into a single image

# Frontend build stage
FROM node:18-alpine as frontend-build
WORKDIR /frontend
COPY devmate-frontend/package.json devmate-frontend/package-lock.json* ./
RUN npm ci --silent || npm install --silent
COPY devmate-frontend/ .
RUN npm run build

# Final image (Python + Nginx + Supervisor)
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libpq-dev \
    libjpeg-dev \
    zlib1g-dev \
    ffmpeg \
    libmagic1 \
    nginx \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Python deps
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy backend source
COPY backend/ /app

# Copy frontend build into nginx html directory
COPY --from=frontend-build /frontend/build /var/www/html

# Copy nginx and supervisor configs
COPY deploy/nginx.conf /etc/nginx/sites-available/default
COPY deploy/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY deploy/entrypoint.sh /deploy/entrypoint.sh
RUN chmod +x /deploy/entrypoint.sh

# Expose port 80
EXPOSE 80

# Entrypoint writes runtime env.js and starts supervisord
ENTRYPOINT ["/deploy/entrypoint.sh"]
