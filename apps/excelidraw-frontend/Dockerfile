FROM node:18-alpine AS base

FROM base AS builder
RUN apk add --no-libc6-compat python3 make g++
WORKDIR /app
RUN npm install -g pnpm turbo

COPY . .
RUN pnpm prune --scope=excelidraw-frontend --docker

FROM base AS installer
RUN apk add --no-libc6-compat python3 make g++
WORKDIR /app
RUN npm install -g pnpm turbo

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm turbo run build --filter=excelidraw-frontend...

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=installer /app/apps/excelidraw-frontend/public ./apps/excelidraw-frontend/public
COPY --from=installer --chown=nextjs:nodejs /app/apps/excelidraw-frontend/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/excelidraw-frontend/.next/static ./apps/excelidraw-frontend/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/excelidraw-frontend/server.js"]
