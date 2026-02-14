SHELL := /bin/bash

# Load environment variables from .env (optional)
# - Supports lines like: KEY=VALUE
# - Ignores blank lines and comments
ENV_FILE ?= .env
ifneq (,$(wildcard $(ENV_FILE)))
	include $(ENV_FILE)
	export $(shell sed -E -n 's/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=.*$$/\1/p' $(ENV_FILE))
endif

# Ensure `make` and Docker Compose share the same project.
# Override via `.env`: COMPOSE_PROJECT=...
COMPOSE_PROJECT ?= clean-ddd

COMPOSE := stack/compose/docker-compose.yml
DEV_COMPOSE := stack/compose/docker-compose.dev.yml

COMPOSE_BASE := docker compose -p $(COMPOSE_PROJECT) -f $(COMPOSE)
COMPOSE_DEV := $(COMPOSE_BASE) -f $(DEV_COMPOSE)

ifeq ($(NGINX_HTTP_PORT),80)
	NGINX_BASE_URL := http://localhost
else
	NGINX_BASE_URL := http://localhost:$(NGINX_HTTP_PORT)
endif

dev:
	@$(COMPOSE_DEV) up -d --build --remove-orphans

serve:
	@$(COMPOSE_BASE) up -d --build --remove-orphans

up:
	@$(COMPOSE_BASE) up -d --build --remove-orphans

down:
	@$(COMPOSE_BASE) down -v --remove-orphans

start:
	@$(COMPOSE_BASE) start

stop:
	@$(COMPOSE_BASE) stop

ps:
	@$(COMPOSE_BASE) ps

logs:
	@$(COMPOSE_BASE) logs -f --tail=200

restart:
	@$(COMPOSE_BASE) restart

# DB 초기화: 같은 compose project의 postgres 볼륨만 삭제 후 재생성
init:
	@set -euo pipefail; \
	project="$(COMPOSE_PROJECT)"; \
	volume="$${project}_postgres_data"; \
	if docker volume inspect "$$volume" >/dev/null 2>&1; then \
		lbl_project="$$(docker volume inspect "$$volume" -f '{{ index .Labels "com.docker.compose.project" }}')"; \
		lbl_volume="$$(docker volume inspect "$$volume" -f '{{ index .Labels "com.docker.compose.volume" }}')"; \
		if [ "$$lbl_project" != "$$project" ] || [ "$$lbl_volume" != "postgres_data" ]; then \
			echo "refusing to remove volume $$volume (labels mismatch: project=$$lbl_project volume=$$lbl_volume)"; \
			exit 1; \
		fi; \
	fi; \
	$(COMPOSE_BASE) rm -f -s -v postgres >/dev/null 2>&1 || true; \
	docker volume rm -f "$$volume" >/dev/null 2>&1 || true; \
	$(COMPOSE_BASE) up -d --remove-orphans postgres localstack; \
	$(COMPOSE_BASE) run --rm --build backend-api pnpm db:init

# 시스템 전체 빌드: 항상 DB 초기화 선행
build: init
	@$(COMPOSE_BASE) build

health:
	@curl -sf $(NGINX_BASE_URL)/healthz >/dev/null

e2e: init serve health
	@$(COMPOSE_BASE) exec -T backend-api pnpm test:e2e

# 프로젝트 범위 정리 (base-only)
prune:
	@docker system prune -af --volumes 2>/dev/null || true

TARGETS := up serve dev down ps logs build init health e2e prune restart

.PHONY: $(TARGETS)
.NOTPARALLEL: $(TARGETS)