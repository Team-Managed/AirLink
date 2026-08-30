# Stage 1: Build Workspace & Relay Server
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configurations and manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/protocol/package.json ./packages/protocol/
COPY packages/protocol/tsconfig.json ./packages/protocol/
COPY apps/relay/package.json ./apps/relay/
COPY apps/relay/tsconfig.json ./apps/relay/

# Install dependencies for targeted packages
RUN pnpm install --frozen-lockfile --filter "@airlink/protocol..." --filter "@airlink/relay..."

# Copy source code
COPY packages/protocol ./packages/protocol
COPY apps/relay ./apps/relay

# Build protocol contract and relay server
RUN pnpm --filter "@airlink/protocol" build
RUN pnpm --filter "@airlink/relay" build

# Stage 2: Minimal Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy compiled artifacts and package definitions
COPY package.json pnpm-workspace.yaml ./
COPY --from=builder /app/packages/protocol/package.json ./packages/protocol/
COPY --from=builder /app/packages/protocol/dist ./packages/protocol/dist
COPY --from=builder /app/packages/protocol/node_modules ./packages/protocol/node_modules
COPY --from=builder /app/apps/relay/package.json ./apps/relay/
COPY --from=builder /app/apps/relay/dist ./apps/relay/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/relay/node_modules ./apps/relay/node_modules

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT}/health || exit 1

CMD ["node", "apps/relay/dist/index.js"]
