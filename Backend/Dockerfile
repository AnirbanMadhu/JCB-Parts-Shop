# syntax=docker/dockerfile:1
# Production-optimized Dockerfile for JCB Backend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install ALL dependencies (including devDependencies for build)
# Cache mount: ~/.npm persists across CI runs — packages already downloaded
# are never re-fetched from the internet. Cuts npm ci from ~60s → ~5s.
COPY package*.json tsconfig.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --no-fund

# Copy prisma schema and generate client
# Cache mount: ~/.cache/prisma stores ~50MB of query engine binaries.
# Without this, Prisma re-downloads them on every single build (~40s → ~2s).
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.cache \
    npx prisma generate

# Copy source code and build
COPY src ./src
RUN npm run build

# Prune dev dependencies so only production deps are copied forward
RUN npm prune --production

# Production stage
FROM node:20-alpine

# Add security: create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application and dependencies
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4001

# Health check — uses /api/ready (DB-only ping) instead of /api/health.
# /api/health returns 503 when SMTP is not configured, which would wrongly
# mark the container unhealthy and block the frontend from ever starting.
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD node -e "require('http').get('http://localhost:4001/api/ready', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application (migrations run in docker-compose command)
CMD ["node", "dist/index.js"]
