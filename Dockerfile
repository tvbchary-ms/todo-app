# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* tsconfig.base.json ./

# Copy package manifests first (layer caching)
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared/ packages/shared/
COPY packages/backend/ packages/backend/

# Build shared first, then backend
RUN pnpm --filter @todo/shared build
RUN pnpm --filter @todo/backend build

# ── Production stage ─────────────────────────────────────────
FROM node:20-alpine AS production

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Security: run as non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./

# Copy built packages
COPY packages/shared/package.json packages/shared/
COPY --from=builder /app/packages/shared/dist packages/shared/dist/

COPY packages/backend/package.json packages/backend/
COPY --from=builder /app/packages/backend/dist packages/backend/dist/
COPY packages/backend/src/db/migrations packages/backend/dist/db/migrations/

# Install production-only dependencies
RUN pnpm install --frozen-lockfile --prod

# Switch to non-root user
USER backend

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "packages/backend/dist/index.js"]
