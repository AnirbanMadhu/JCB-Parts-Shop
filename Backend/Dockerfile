# Production-optimized Dockerfile for JCB Backend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install ALL dependencies (including devDependencies for build)
COPY package*.json tsconfig.json ./
RUN npm ci && npm cache clean --force

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code and build
COPY src ./src
RUN npm run build

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

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application (migrations run in docker-compose command)
CMD ["node", "dist/index.js"]
