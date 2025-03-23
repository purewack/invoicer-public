# backend/Dockerfile

FROM node:18-alpine AS builder

WORKDIR /app

# Install backend deps
COPY ./backend/package*.json .
COPY ./backend/tsconfig.json .
RUN npm install --only=production

# Copy backend code
COPY ./backend .
COPY ./firebase-admin-key.json ./keys/

# --- Build frontend ---
RUN mkdir ./frontend
COPY ./frontend/package*.json ./frontend
COPY ./frontend/tsconfig.json ./frontend
RUN cd ./frontend && npm install
COPY ./frontend ./frontend
COPY ./backend/shared ./frontend/shared
COPY ./firebase-user-key.json ./frontend/keys/firebase-user-key.json

ARG VITE_STAGING_MODE
ENV VITE_STAGING_MODE=$VITE_STAGING_MODE
ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS=--max-old-space-size=4096

RUN cd ./frontend && npm run build

# Copy frontend build to backend public dir
RUN mkdir -p /app/public
RUN cp -r ./frontend/dist/* /app/public/

# Final image
FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app /app

CMD ["npm", "run", "start"]