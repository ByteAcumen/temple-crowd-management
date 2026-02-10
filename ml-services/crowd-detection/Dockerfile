# Use official Python runtime with CUDA support (optional)
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# System dependencies removed for lightweight mock service

# Copy requirements first (optimization)
COPY requirements.txt .

# Install curl for healthcheck and dependencies
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/* && \
    pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ src/

# Create models directory (will be populated by training or mounted volume)
RUN mkdir -p models

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run the app
CMD ["uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8000"]
