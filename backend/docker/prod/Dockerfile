# Dockerfile.prod for FastAPI backend
FROM python:3.10-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install pip, wheel and setuptools first
RUN pip install --upgrade pip wheel setuptools

# Install dependencies
COPY /requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# Final production image
FROM python:3.10-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    fonts-liberation \
    fontconfig \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy wheels from builder stage and install dependencies
COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache /wheels/*

# Copy app files
COPY . /app/

# Copy the production entrypoint script
COPY ./docker/prod/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create a non-root user and switch to it
RUN useradd -m appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Run the app
ENTRYPOINT ["/entrypoint.sh"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]