# ==============================================================================
# Stage 1: Base Alpine image with Node.js 20
# ==============================================================================
FROM node:20-alpine AS base

# ==============================================================================
# Stage 2: Dependencies - install production & build dependencies cleanly
# ==============================================================================
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --prefer-offline && \
    npm cache clean --force

# ==============================================================================
# Stage 3: Builder - compile Next.js standalone bundle
# ==============================================================================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

ARG NEXT_PUBLIC_APP_URL=https://aitoolsfinder.cloud
ARG NEXT_PUBLIC_API_BASE_URL=https://aitoolsfinder.cloud/api/v1
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN npm run build && \
    # Strip unnecessary build cache to save disk space
    rm -rf .next/cache

# ==============================================================================
# Stage 4: Runner - ultra-lean standalone runtime (no node_modules required)
# ==============================================================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public directory and standalone trace artifacts
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Zero-dependency healthcheck using BusyBox built-in wget
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
