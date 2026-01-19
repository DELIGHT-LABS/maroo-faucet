FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY server/package.json ./server/

# Install server dependencies only
RUN pnpm install --filter=server --frozen-lockfile

# Copy server source
COPY server/ ./server/

# Build server
RUN pnpm --filter=server build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install pnpm for production
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace config
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY server/package.json ./server/

# Install production dependencies only
RUN pnpm install --filter=server --prod --frozen-lockfile

# Copy built files
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/config.json ./server/

WORKDIR /app/server

EXPOSE 8000

CMD ["node", "dist/index.js"]
