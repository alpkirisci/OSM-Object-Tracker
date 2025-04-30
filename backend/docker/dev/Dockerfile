# Dockerfile.dev for FastAPI development
FROM python:3.10

WORKDIR /app

# Install PostgreSQL client utilities
RUN apt-get update && apt-get install -y \
    fonts-liberation \
    fontconfig \
    postgresql-client

# Install dependencies
COPY /requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entrypoint script
COPY ./docker/dev/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose the FastAPI port
EXPOSE 8000

