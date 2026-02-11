SHELL := /bin/bash

# Load local environment variables from .env (optional)
# - Supports lines like: KEY=VALUE
# - Ignores blank lines and comments
ENV_FILE ?= .env
ifneq (,$(wildcard $(ENV_FILE)))
	include $(ENV_FILE)
	export $(shell sed -E -n 's/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=.*$$/\1/p' $(ENV_FILE))
endif

DEPS_COMPOSE := infra/compose/docker-compose.deps.yml
LOCAL_COMPOSE := infra/compose/docker-compose.local.yml
LOCAL_DEV_COMPOSE := infra/compose/docker-compose.local.dev.yml

ifeq ($(NGINX_HTTP_PORT),80)
	NGINX_BASE_URL := http://localhost
else
	NGINX_BASE_URL := http://localhost:$(NGINX_HTTP_PORT)
endif

ifeq ($(NODE_ENV),prod)
  LOCAL_EXTRA_FILES :=
else ifeq ($(NODE_ENV),production)
  LOCAL_EXTRA_FILES :=
else
  LOCAL_EXTRA_FILES := -f $(LOCAL_DEV_COMPOSE)
endif

COMPOSE := docker compose -f $(DEPS_COMPOSE) -f $(LOCAL_COMPOSE) $(LOCAL_EXTRA_FILES)

up:
	@$(COMPOSE) up -d --build --remove-orphans

down:
	@$(COMPOSE) down --remove-orphans

prune:
	@$(COMPOSE) down -v --remove-orphans
	@docker system prune -af --volumes 2>&1 || true

ps:
	@$(COMPOSE) ps

logs:
	@$(COMPOSE) logs -f --tail=200

build:
	@$(COMPOSE) build

restart:
	@$(COMPOSE) restart

migrate:
	@$(COMPOSE) exec -T backend-api pnpm --dir service/backend db:migrate

health:
	@$(COMPOSE) exec -T backend-api pnpm --dir service/backend health:local

e2e: up health
	@for i in {1..180}; do \
		curl -sf $(NGINX_BASE_URL)/api/v1/app/health-check >/dev/null && break; \
		if (( i % 10 == 0 )); then echo "waiting for $(NGINX_BASE_URL)/api/v1/app/health-check (${i}s)"; fi; \
		sleep 1; \
	done
	@curl -sf $(NGINX_BASE_URL)/api/v1/app/health-check >/dev/null || ( \
		echo "nginx->backend health-check still failing"; \
		@$(COMPOSE) logs --tail=200 nginx backend-api; \
		exit 1; \
	)
	@$(COMPOSE) exec -T backend-api pnpm --dir service/backend test:e2e

TARGETS := up down ps logs build prune restart migrate health e2e

.PHONY:
.NOTPARALLEL: $(TARGETS)