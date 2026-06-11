# ─── Build ───────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production && \
    cp -r node_modules /node_modules_prod && \
    npm ci

COPY tsconfig*.json nest-cli.json ./
COPY src/ src/
RUN npm run build

# ─── Production ──────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /node_modules_prod node_modules/
COPY --from=builder /app/dist dist/
COPY package.json ./

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/auth/challenge || exit 1

CMD ["node", "dist/main"]
