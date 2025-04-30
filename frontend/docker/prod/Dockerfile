# Dockerfile.prod for React/Next.js frontend
FROM node:23-slim AS builder

WORKDIR /app

# Needs to be passed onto during build
ARG NEXT_PUBLIC_API_BASE_URL=/api
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

# Install build dependencies for canvas
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    build-essential \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    libpixman-1-dev \
    libpangomm-1.4-dev \
    libfreetype6-dev

# Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Copy the rest of the app
COPY . .

# Build the Next.js app
# --no-lint is used to reduce build time, prone to change
RUN npm run build -- --no-lint

# Production image, copy built files from builder stage
FROM node:23-slim

WORKDIR /app

# Install runtime dependencies for canvas
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libjpeg62 \
    libpango-1.0-0 \
    libgif7 \
    libpixman-1-0 \
    libfreetype6

# Copy from builder stage
COPY --from=builder /app/package.json /app/package-lock.json* ./
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Copy the production entrypoint script
COPY ./docker/prod/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set environment to production
ENV NODE_ENV=production

# Expose the port
EXPOSE 3000

# Run the app
ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "start"]