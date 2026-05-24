# Story Lens meta-repo: delegates to backend and extension submodules.
.PHONY: \
	help init submodules-init pull update ensure-submodules \
	backend-% extension-% \
	install setup dev dev-backend dev-extension dev-firefox \
	build build-backend build-extension build-firefox start-backend \
	typecheck test \
	db-generate db-migrate-dev db-migrate-deploy db-reset db-seed db-studio storage-seed \
	orval i18n-parse zip zip-firefox \
	docker-up docker-down docker-logs

ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
BACKEND := $(ROOT)/apps/backend
EXTENSION := $(ROOT)/apps/extension
CHILDREN := $(BACKEND) $(EXTENSION)

BLUE := $(shell printf '\033[34m')
GREEN := $(shell printf '\033[32m')
YELLOW := $(shell printf '\033[33m')
RESET := $(shell printf '\033[0m')

SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c

.DEFAULT_GOAL := help

help:
	@echo ""
	@echo "$(BLUE)Story Lens meta-repo$(RESET)"
	@echo "  $(GREEN)submodules-init$(RESET)      clone/init submodules ($(YELLOW)git submodule update --init --recursive$(RESET))"
	@echo "  $(GREEN)init$(RESET)                 alias for $(GREEN)submodules-init$(RESET)"
	@echo "  $(GREEN)pull$(RESET)                 pull umbrella + sync and pull each submodule"
	@echo "  $(GREEN)update$(RESET)               bump submodules to latest remote commits"
	@echo ""
	@echo "$(BLUE)Setup$(RESET)"
	@echo "  $(GREEN)install$(RESET)              install deps in both submodules"
	@echo "  $(GREEN)setup$(RESET)                backend setup (docker + db)"
	@echo ""
	@echo "$(BLUE)Development$(RESET)"
	@echo "  $(GREEN)dev$(RESET)                   print dev commands for both apps"
	@echo "  $(GREEN)dev-backend$(RESET)          $(YELLOW)make -C apps/backend dev$(RESET)"
	@echo "  $(GREEN)dev-extension$(RESET)        $(YELLOW)make -C apps/extension dev$(RESET)"
	@echo "  $(GREEN)dev-firefox$(RESET)          $(YELLOW)make -C apps/extension dev-firefox$(RESET)"
	@echo ""
	@echo "$(BLUE)Build$(RESET)"
	@echo "  $(GREEN)build$(RESET)                build backend + extension"
	@echo "  $(GREEN)build-backend$(RESET)        $(YELLOW)make -C apps/backend build$(RESET)"
	@echo "  $(GREEN)build-extension$(RESET)      $(YELLOW)make -C apps/extension build$(RESET)"
	@echo "  $(GREEN)build-firefox$(RESET)        $(YELLOW)make -C apps/extension build-firefox$(RESET)"
	@echo "  $(GREEN)start-backend$(RESET)        build + run production API"
	@echo "  $(GREEN)zip$(RESET)                  $(YELLOW)make -C apps/extension zip$(RESET)"
	@echo "  $(GREEN)zip-firefox$(RESET)            $(YELLOW)make -C apps/extension zip-firefox$(RESET)"
	@echo ""
	@echo "$(BLUE)Database & storage$(RESET) ($(YELLOW)backend submodule$(RESET))"
	@echo "  $(GREEN)db-generate$(RESET) db-$(GREEN)migrate-dev$(RESET) db-$(GREEN)migrate-deploy$(RESET)"
	@echo "  $(GREEN)db-reset$(RESET) db-$(GREEN)seed$(RESET) db-$(GREEN)studio$(RESET) $(GREEN)storage-seed$(RESET)"
	@echo "  $(GREEN)docker-up$(RESET) $(GREEN)docker-down$(RESET) $(GREEN)docker-logs$(RESET)"
	@echo ""
	@echo "$(BLUE)Extension tooling$(RESET)"
	@echo "  $(GREEN)orval$(RESET)                regenerate API client"
	@echo "  $(GREEN)i18n-parse$(RESET)           extract i18n keys"
	@echo ""
	@echo "$(BLUE)Quality$(RESET)"
	@echo "  $(GREEN)typecheck$(RESET)            typecheck both submodules"
	@echo "  $(GREEN)test$(RESET)                 run backend tests"
	@echo ""
	@echo "$(BLUE)Pass-through$(RESET): $(GREEN)backend-<target>$(RESET) / $(GREEN)extension-<target>$(RESET)"
	@echo "  e.g. $(YELLOW)make backend-dev$(RESET), $(YELLOW)make extension-typecheck$(RESET)"
	@echo ""

submodules-init:
	@git submodule update --init --recursive

init: submodules-init

pull:
	@echo "$(BLUE)Pulling umbrella$(RESET) ..."
	@cd "$(ROOT)" && git pull --ff-only
	@$(MAKE) submodules-init
	@echo "$(BLUE)Pulling submodules$(RESET) ..."
	@git submodule foreach --recursive 'git pull --ff-only'

update: ensure-submodules
	@git submodule update --remote --merge

ensure-submodules:
	@missing=0; \
	for child in $(CHILDREN); do \
		if [ ! -f "$$child/Makefile" ]; then \
			echo "$(YELLOW)Missing $$child — run $(GREEN)make submodules-init$(RESET)"; \
			missing=1; \
		fi; \
	done; \
	[ "$$missing" -eq 0 ]

install: ensure-submodules
	@$(MAKE) -C "$(BACKEND)" install
	@$(MAKE) -C "$(EXTENSION)" install

setup: ensure-submodules
	@$(MAKE) -C "$(BACKEND)" setup

dev: ensure-submodules
	@echo "$(YELLOW)Start each app in its own terminal:$(RESET)"
	@echo "  $(GREEN)make dev-backend$(RESET)"
	@echo "  $(GREEN)make dev-extension$(RESET)"

dev-backend: ensure-submodules
	@$(MAKE) -C "$(BACKEND)" dev

dev-extension: ensure-submodules
	@$(MAKE) -C "$(EXTENSION)" dev

dev-firefox: ensure-submodules
	@$(MAKE) -C "$(EXTENSION)" dev-firefox

build: ensure-submodules build-backend build-extension

build-backend: ensure-submodules
	@$(MAKE) -C "$(BACKEND)" build

build-extension: ensure-submodules
	@$(MAKE) -C "$(EXTENSION)" build

build-firefox: ensure-submodules
	@$(MAKE) -C "$(EXTENSION)" build-firefox

start-backend: ensure-submodules build-backend
	@$(MAKE) -C "$(BACKEND)" start

typecheck: ensure-submodules
	@$(MAKE) -C "$(BACKEND)" typecheck
	@$(MAKE) -C "$(EXTENSION)" typecheck

test: ensure-submodules
	@$(MAKE) -C "$(BACKEND)" test

docker-up: ensure-submodules
	@$(MAKE) -C "$(BACKEND)" docker-up

docker-down: ensure-submodules
	@$(MAKE) -C "$(BACKEND)" docker-down

docker-logs: ensure-submodules
	@$(MAKE) -C "$(BACKEND)" docker-logs

db-generate: ensure-submodules
	@$(MAKE) -C "$(BACKEND)" db-generate

db-migrate-dev: ensure-submodules
	@$(MAKE) -C "$(BACKEND)" db-migrate-dev

db-migrate-deploy: ensure-submodules
	@$(MAKE) -C "$(BACKEND)" db-migrate-deploy

db-reset: ensure-submodules
	@$(MAKE) -C "$(BACKEND)" db-reset

db-seed: ensure-submodules
	@$(MAKE) -C "$(BACKEND)" db-seed

db-studio: ensure-submodules
	@$(MAKE) -C "$(BACKEND)" db-studio

storage-seed: ensure-submodules
	@$(MAKE) -C "$(BACKEND)" storage-seed

orval: ensure-submodules
	@$(MAKE) -C "$(EXTENSION)" orval

i18n-parse: ensure-submodules
	@$(MAKE) -C "$(EXTENSION)" i18n-parse

zip: ensure-submodules
	@$(MAKE) -C "$(EXTENSION)" zip

zip-firefox: ensure-submodules
	@$(MAKE) -C "$(EXTENSION)" zip-firefox

backend-%: ensure-submodules
	@$(MAKE) -C "$(BACKEND)" $(patsubst backend-%,%,$@)

extension-%: ensure-submodules
	@$(MAKE) -C "$(EXTENSION)" $(patsubst extension-%,%,$@)
