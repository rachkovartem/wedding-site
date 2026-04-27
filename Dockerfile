# ── Stage 1: build frontend ────────────────────────────────────────────
FROM node:20-alpine AS build-client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# ── Stage 2: production server ─────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Install server dependencies (production only)
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy server source and built frontend
COPY server/ ./server/
COPY --from=build-client /app/client/dist ./client/dist

# Persistent data directory (mount a volume here for SQLite)
RUN mkdir -p /data

EXPOSE 3001
ENV NODE_ENV=production
ENV DB_PATH=/data/data.db

CMD ["node", "server/index.js"]
