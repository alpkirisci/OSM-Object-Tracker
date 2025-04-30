# Dockerfile.dev for React development
FROM node:23-slim

WORKDIR /app

# Set NODE_ENV explicitly to development to ensure hot reloading works
ENV NODE_ENV=development

# Install curl
RUN apt-get update && apt-get install -y curl

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the app
COPY . .

# Copy the entrypoint script
COPY ./docker/dev/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose the development server port
EXPOSE 3000