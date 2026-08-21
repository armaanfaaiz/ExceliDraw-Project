FROM node:18-alpine AS base

FROM base AS builder
WORKDIR /app
RUN npm install -g pnpm turbo

COPY . .
RUN pnpm prune --scope=ws-backend --docker

FROM base AS installer
WORKDIR /app
RUN npm install -g pnpm turbo

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# Generate Prisma Client
RUN pnpm --filter @repo/db run build || pnpm --filter @repo/db exec prisma generate
RUN pnpm turbo run build --filter=ws-backend...

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 wsuser

COPY --from=installer /app .

USER wsuser

EXPOSE 8080

ENV PORT=8080

CMD ["node", "apps/ws-backend/dist/index.js"]
