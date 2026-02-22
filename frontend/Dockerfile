# syntax=docker/dockerfile:1
# Production-optimized Dockerfile for JCB Frontend (Next.js)
#
# Single builder stage (no separate deps stage) so the /root/.npm cache mount
# is active for BOTH install and build — splitting into two stages loses the mount.
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies.
# Cache mount: ~/.npm persists across CI runs — never re-downloads packages.
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js.
# Cache mount: /app/.next/cache stores compiled page chunks and webpack module
# graphs. Unchanged pages are NOT recompiled. This is the biggest win:
# a one-file change goes from ~4 min full recompile → ~30-60s incremental.
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Set the correct permission for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# Copy build artifacts with correct permissions
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Next.js
CMD ["node", "server.js"]
