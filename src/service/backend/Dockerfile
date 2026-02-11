# syntax=docker/dockerfile:1.6

FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY . .
RUN pnpm install --frozen-lockfile

FROM deps AS dev
EXPOSE 3000
CMD ["pnpm", "--dir", "service/backend", "dev"]

FROM deps AS build
RUN pnpm --dir service/backend build

FROM node:22-alpine AS prod
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/service/backend ./service/backend
WORKDIR /app/service/backend
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
