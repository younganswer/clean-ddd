# syntax=docker/dockerfile:1.6

FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY . .
RUN pnpm install --frozen-lockfile

FROM deps AS dev
ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "pnpm --dir service/frontend dev -p ${PORT:-8080}"]

FROM deps AS build
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
RUN pnpm --dir service/frontend build

FROM node:22-alpine AS prod
WORKDIR /srv
COPY --from=build /app/service/frontend/out ./out
ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "npx --yes serve@14.2.0 -s out -l ${PORT:-8080}"]
