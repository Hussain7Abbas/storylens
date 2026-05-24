# Story Lens meta-repo: delegates to backend and extension submodules.
.PHONY: \
	help init update \
	backend-% extension-% \
	install setup dev dev-backend dev-extension dev-firefox \
	build build-backend build-extension build-firefox start-backend \
	typecheck test \
	db-generate db-migrate-dev db-migrate-deploy db-reset db-seed db-studio storage-seed \
	orval i18n-parse zip zip-firefox \
	docker-up docker-down docker-logs

ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
BACKEND := $(ROOT)/backend
EXTENSION := $(ROOT)/extension

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
	@echo "  $(GREEN)init$(RESET)                 clone/init submodules ($(YELLOW)git submodule update --init --recursive$(RESET))"
	@echo "  $(GREEN)update$(RESET)               pull latest submodule commits"
	@echo ""
	@echo "$(BLUE)Setup$(RESET)"
	@echo "  $(GREEN)install$(RESET)              install deps in both submodules"
	@echo "  $(GREEN)setup$(RESET)                backend setup (docker + db)"
	@echo ""
	@echo "$(BLUE)Development$(RESET)"
	@echo "  $(GREEN)dev-backend$(RESET)          $(YELLOW)make -C backend dev$(RESET)"
	@echo "  $(GREEN)dev-extension$(RESET)        $(YELLOW)make -C extension dev$(RESET)"
	@echo "  $(GREEN)dev-firefox$(RESET)          $(YELLOW)make -C extension dev-firefox$(RESET)"
	@echo ""
	@echo "$(BLUE)Build$(RESET)"
	@echo "  $(GREEN)build$(RESET)                build backend + extension"
	@echo "  $(GREEN)build-backend$(RESET)        $(YELLOW)make -C backend build$(RESET)"
	@echo "  $(GREEN)build-extension$(RESET)      $(YELLOW)make -C extension build$(RESET)"
	@echo "  $(GREEN)build-firefox$(RESET)        $(YELLOW)make -C extension build-firefox$(RESET)"
	@echo "  $(GREEN)start-backend$(RESET)        build + run production API"
	@echo "  $(GREEN)zip$(RESET)                  $(YELLOW)make -C extension zip$(RESET)"
	@echo "  $(GREEN)zip-firefox$(RESET)            $(YELLOW)make -C extension zip-firefox$(RESET)"
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

init:
	@git submodule update --init --recursive

update:
	@git submodule update --remote --merge

install:
	@$(MAKE) -C "$(BACKEND)" install
	@$(MAKE) -C "$(EXTENSION)" install

setup:
	@$(MAKE) -C "$(BACKEND)" setup

dev-backend:
	@$(MAKE) -C "$(BACKEND)" dev

dev-extension:
	@$(MAKE) -C "$(EXTENSION)" dev

dev-firefox:
	@$(MAKE) -C "$(EXTENSION)" dev-firefox

build: build-backend build-extension

build-backend:
	@$(MAKE) -C "$(BACKEND)" build

build-extension:
	@$(MAKE) -C "$(EXTENSION)" build

build-firefox:
	@$(MAKE) -C "$(EXTENSION)" build-firefox

start-backend: build-backend
	@$(MAKE) -C "$(BACKEND)" start

typecheck:
	@$(MAKE) -C "$(BACKEND)" typecheck
	@$(MAKE) -C "$(EXTENSION)" typecheck

test:
	@$(MAKE) -C "$(BACKEND)" test

docker-up:
	@$(MAKE) -C "$(BACKEND)" docker-up

docker-down:
	@$(MAKE) -C "$(BACKEND)" docker-down

docker-logs:
	@$(MAKE) -C "$(BACKEND)" docker-logs

db-generate:
	@$(MAKE) -C "$(BACKEND)" db-generate

db-migrate-dev:
	@$(MAKE) -C "$(BACKEND)" db-migrate-dev

db-migrate-deploy:
	@$(MAKE) -C "$(BACKEND)" db-migrate-deploy

db-reset:
	@$(MAKE) -C "$(BACKEND)" db-reset

db-seed:
	@$(MAKE) -C "$(BACKEND)" db-seed

db-studio:
	@$(MAKE) -C "$(BACKEND)" db-studio

storage-seed:
	@$(MAKE) -C "$(BACKEND)" storage-seed

orval:
	@$(MAKE) -C "$(EXTENSION)" orval

i18n-parse:
	@$(MAKE) -C "$(EXTENSION)" i18n-parse

zip:
	@$(MAKE) -C "$(EXTENSION)" zip

zip-firefox:
	@$(MAKE) -C "$(EXTENSION)" zip-firefox

backend-%:
	@$(MAKE) -C "$(BACKEND)" $(patsubst backend-%,%,$@)

extension-%:
	@$(MAKE) -C "$(EXTENSION)" $(patsubst extension-%,%,$@)
