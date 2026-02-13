# syntax=docker/dockerfile:1.6

FROM node:22-alpine AS base
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

FROM base AS deps
COPY . .
RUN pnpm install --frozen-lockfile --filter ./service/backend...

FROM deps AS dev
EXPOSE 3000
CMD ["pnpm", "--dir", "service/backend", "dev"]

FROM deps AS build
RUN pnpm --dir service/backend build

FROM node:22-alpine AS prod
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@9.15.5 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/service/backend ./service/backend
WORKDIR /app/service/backend
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
