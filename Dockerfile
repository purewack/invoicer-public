# Multi-stage Dockerfile to build frontend and backend and produce a single runtime image

# Builder stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install backend production deps
COPY ./backend/package*.json ./backend/
COPY ./backend/tsconfig.json ./backend/
RUN cd ./backend && npm ci --omit=dev --prefer-offline --no-audit --progress=false

# Copy backend source
COPY ./backend ./backend

# Build frontend (needs dev deps)
COPY ./frontend/package*.json ./frontend/
COPY ./frontend/tsconfig.json ./frontend/
RUN cd ./frontend && npm ci --prefer-offline --no-audit --progress=false

# Copy frontend source and shared resources
COPY ./frontend ./frontend
COPY ./backend/shared ./frontend/shared

ENV VITE_STAGING_MODE=development
ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS=--max-old-space-size=4096

RUN cd ./frontend && npm run build

# Copy frontend build into backend public dir
RUN mkdir -p /app/backend/public
RUN cp -r ./frontend/dist/* /app/backend/public/

# Final runtime image
FROM node:18-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=development

# Copy only the backend folder (including public assets and node_modules from builder)
COPY --from=builder /app/backend /app

# # Use a non-root user for security (optional)
# RUN addgroup -S appgroup && adduser -S appuser -G appgroup || true
# USER appuser

# The app listens on process.env.PORT (Render sets PORT) or PROD_PORT fallback
CMD ["npm", "run", "start"]
