# Story Lens monorepo: Turbo orchestration, shared Docker infra, per-app Makefiles.
.PHONY: \
	help ensure-apps \
	install prepare init-env setup db-setup \
	docker-up docker-down docker-logs \
	db-generate db-migrate-dev db-migrate-deploy db-migrate-reset db-seed db-studio \
	storage-seed orval i18n-parse \
	dev dev-backend dev-extension dev-firefox backend extension \
	build build-seq build-backend build-extension build-firefox start-backend \
	zip zip-firefox \
	typecheck check test lint format \
	cleanup reinstall update rmdeps

ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
BACKEND := $(ROOT)/apps/backend
EXTENSION := $(ROOT)/apps/extension
DB := $(ROOT)/packages/db
STORAGE := $(ROOT)/packages/storage
API := $(ROOT)/packages/api

BUN := bun
RUN := $(BUN) run

BLUE := $(shell printf '\033[34m')
GREEN := $(shell printf '\033[32m')
YELLOW := $(shell printf '\033[33m')
RESET := $(shell printf '\033[0m')

SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c

.DEFAULT_GOAL := help

help:
	@echo ""
	@echo "$(BLUE)Setup$(RESET)"
	@echo "  $(GREEN)install$(RESET)             $(YELLOW)bun install$(RESET) at monorepo root"
	@echo "  $(GREEN)prepare$(RESET)             Husky $(YELLOW)prepare$(RESET) hook"
	@echo "  $(GREEN)init-env$(RESET)            interactive env setup ($(YELLOW)bun run scripts:init:env$(RESET))"
	@echo "  $(GREEN)setup$(RESET)                 $(YELLOW)docker-up$(RESET) + $(YELLOW)install$(RESET) + $(YELLOW)db-generate$(RESET) + migrate deploy + seed"
	@echo "  $(GREEN)db-setup$(RESET)              $(YELLOW)docker-up$(RESET) + db generate/migrate/seed ($(YELLOW)expects deps installed$(RESET))"
	@echo ""
	@echo "$(BLUE)Docker ($(RESET)root $(GREEN)docker-compose.yml$(BLUE))$(RESET)"
	@echo "  $(GREEN)docker-up$(RESET)           $(YELLOW)docker compose up -d$(RESET) — Postgres"
	@echo "  $(GREEN)docker-down$(RESET)         $(YELLOW)docker compose down$(RESET)"
	@echo "  $(GREEN)docker-logs$(RESET)         $(YELLOW)docker compose logs -f$(RESET)"
	@echo ""
	@echo "$(BLUE)Database ($(RESET)delegates to $(GREEN)packages/db/Makefile$(RESET)$(BLUE))$(RESET)"
	@echo "  $(GREEN)db-generate$(RESET)         $(GREEN)make -C packages/db db-generate$(RESET)"
	@echo "  $(GREEN)db-migrate-dev$(RESET)      $(GREEN)make -C packages/db db-migrate-dev$(RESET)"
	@echo "  $(GREEN)db-migrate-deploy$(RESET)   $(GREEN)make -C packages/db db-migrate-deploy$(RESET)"
	@echo "  $(GREEN)db-migrate-reset$(RESET)    $(GREEN)make -C packages/db db-migrate-reset$(RESET)"
	@echo "  $(GREEN)db-seed$(RESET)             $(GREEN)make -C packages/db db-seed$(RESET)"
	@echo "  $(GREEN)db-studio$(RESET)           $(GREEN)make -C packages/db db-studio$(RESET)"
	@echo ""
	@echo "$(BLUE)Storage & API$(RESET)"
	@echo "  $(GREEN)storage-seed$(RESET)        seed storage bucket ($(YELLOW)packages/storage$(RESET))"
	@echo "  $(GREEN)orval$(RESET)               regenerate API client ($(YELLOW)packages/api$(RESET); backend must expose OpenAPI)"
	@echo "  $(GREEN)i18n-parse$(RESET)          $(GREEN)make -C apps/extension i18n-parse$(RESET)"
	@echo ""
	@echo "$(BLUE)Development servers$(RESET)"
	@echo "  $(GREEN)dev$(RESET)                 $(YELLOW)turbo dev$(RESET) — all apps ($(YELLOW)or$(RESET) backend + extension in background)"
	@echo "  $(GREEN)dev-backend$(RESET), $(GREEN)backend$(RESET)   API only ($(GREEN)make -C apps/backend dev$(RESET))"
	@echo "  $(GREEN)dev-extension$(RESET), $(GREEN)extension$(RESET) Chrome extension ($(GREEN)make -C apps/extension dev$(RESET))"
	@echo "  $(GREEN)dev-firefox$(RESET)         Firefox extension dev ($(GREEN)make -C apps/extension dev-firefox$(RESET))"
	@echo ""
	@echo "$(BLUE)Build$(RESET)"
	@echo "  $(GREEN)build$(RESET)                 $(YELLOW)turbo build$(RESET) — all workspaces"
	@echo "  $(GREEN)build-seq$(RESET)             backend, then extension ($(YELLOW)sequential$(RESET))"
	@echo "  $(GREEN)build-backend$(RESET)         $(GREEN)make -C apps/backend build$(RESET)"
	@echo "  $(GREEN)build-extension$(RESET)       $(GREEN)make -C apps/extension build$(RESET)"
	@echo "  $(GREEN)build-firefox$(RESET)         $(GREEN)make -C apps/extension build-firefox$(RESET)"
	@echo "  $(GREEN)start-backend$(RESET)         build + run production API"
	@echo "  $(GREEN)zip$(RESET)                   $(GREEN)make -C apps/extension zip$(RESET)"
	@echo "  $(GREEN)zip-firefox$(RESET)           $(GREEN)make -C apps/extension zip-firefox$(RESET)"
	@echo ""
	@echo "$(BLUE)Quality$(RESET)"
	@echo "  $(GREEN)typecheck$(RESET)             $(YELLOW)turbo run typecheck$(RESET) — all workspaces"
	@echo "  $(GREEN)check$(RESET)                 $(YELLOW)biome check --write$(RESET) at root"
	@echo "  $(GREEN)lint$(RESET)                  $(YELLOW)biome lint --write$(RESET) at root"
	@echo "  $(GREEN)format$(RESET)                $(YELLOW)biome format --write$(RESET) at root"
	@echo "  $(GREEN)test$(RESET)                  $(YELLOW)turbo run test$(RESET)"
	@echo ""
	@echo "$(BLUE)Maintenance$(RESET)"
	@echo "  $(GREEN)cleanup$(RESET)               remove build artifacts ($(YELLOW)scripts/cleanup.sh$(RESET))"
	@echo "  $(GREEN)reinstall$(RESET)             fresh $(YELLOW)bun install$(RESET) ($(YELLOW)scripts/reinstall.sh$(RESET))"
	@echo "  $(GREEN)update$(RESET)                update dependencies ($(YELLOW)scripts/update.sh$(RESET))"
	@echo "  $(GREEN)rmdeps$(RESET)                remove all $(YELLOW)node_modules$(RESET)"
	@echo ""

ensure-apps:
	@if [ ! -f "$(BACKEND)/package.json" ] || [ ! -f "$(EXTENSION)/package.json" ]; then \
		echo "$(YELLOW)App package.json missing under apps/. Check your checkout.$(RESET)"; \
		exit 1; \
	fi

install:
	@$(BUN) install

prepare:
	@$(RUN) prepare

init-env:
	@$(RUN) scripts:init:env

setup: docker-up install
	@$(MAKE) -C "$(DB)" db-generate
	@$(MAKE) -C "$(DB)" db-migrate-deploy
	@$(MAKE) -C "$(DB)" db-seed
	@echo "$(GREEN)Setup complete.$(RESET) Configure $(YELLOW).env$(RESET) if you have not already."

db-setup: ensure-apps docker-up
	@$(MAKE) -C "$(DB)" db-generate
	@$(MAKE) -C "$(DB)" db-migrate-deploy
	@$(MAKE) -C "$(DB)" db-seed

docker-up:
	@docker compose up -d

docker-down:
	@docker compose down

docker-logs:
	@docker compose logs -f

db-generate: ensure-apps
	@$(MAKE) -C "$(DB)" db-generate

db-migrate-dev: ensure-apps
	@$(MAKE) -C "$(DB)" db-migrate-dev

db-migrate-deploy: ensure-apps
	@$(MAKE) -C "$(DB)" db-migrate-deploy

db-migrate-reset: ensure-apps
	@$(MAKE) -C "$(DB)" db-migrate-reset

db-seed: ensure-apps
	@$(MAKE) -C "$(DB)" db-seed

db-studio: ensure-apps
	@$(MAKE) -C "$(DB)" db-studio

storage-seed:
	@$(RUN) storage:seed

orval:
	@$(RUN) orval

i18n-parse: ensure-apps
	@$(MAKE) -C "$(EXTENSION)" i18n-parse

dev:
	@$(RUN) dev

dev-backend backend: ensure-apps docker-up
	@echo "$(GREEN)Backend dev (Postgres via root Docker)$(RESET)"
	@$(MAKE) -C "$(BACKEND)" dev

dev-extension extension: ensure-apps
	@$(MAKE) -C "$(EXTENSION)" dev

dev-firefox: ensure-apps
	@$(MAKE) -C "$(EXTENSION)" dev-firefox

build:
	@$(RUN) build

build-seq: ensure-apps
	@$(MAKE) -C "$(BACKEND)" build
	@$(MAKE) -C "$(EXTENSION)" build

build-backend: ensure-apps
	@$(MAKE) -C "$(BACKEND)" build

build-extension: ensure-apps
	@$(MAKE) -C "$(EXTENSION)" build

build-firefox: ensure-apps
	@$(MAKE) -C "$(EXTENSION)" build-firefox

start-backend: build-backend
	@$(MAKE) -C "$(BACKEND)" start

zip: ensure-apps
	@$(MAKE) -C "$(EXTENSION)" zip

zip-firefox: ensure-apps
	@$(MAKE) -C "$(EXTENSION)" zip-firefox

typecheck:
	@$(RUN) typecheck

check:
	@$(RUN) check

lint:
	@$(RUN) lint

format:
	@$(RUN) format

test:
	@$(RUN) test

cleanup:
	@$(RUN) scripts:cleanup

reinstall:
	@$(RUN) scripts:reinstall

update:
	@$(RUN) scripts:update

rmdeps:
	@$(RUN) scripts:rmdeps
