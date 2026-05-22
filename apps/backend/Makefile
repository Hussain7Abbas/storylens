# Story Lens backend API (Elysia.js).
.PHONY: help install dev build start typecheck test

ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))

BLUE := $(shell printf '\033[34m')
GREEN := $(shell printf '\033[32m')
YELLOW := $(shell printf '\033[33m')
RESET := $(shell printf '\033[0m')

SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c

.DEFAULT_GOAL := help

help:
	@echo ""
	@echo "$(BLUE)Backend ($(RESET)apps/backend$(BLUE))$(RESET)"
	@echo "  $(GREEN)install$(RESET)      $(YELLOW)bun install$(RESET) from monorepo root ($(YELLOW)make install$(RESET))"
	@echo "  $(GREEN)dev$(RESET)          $(YELLOW)bun run dev$(RESET) — watch mode"
	@echo "  $(GREEN)build$(RESET)        production build ($(YELLOW)tsc$(RESET) + $(YELLOW)bun build$(RESET))"
	@echo "  $(GREEN)start$(RESET)        run $(YELLOW)dist/index.js$(RESET) ($(YELLOW)requires build$(RESET))"
	@echo "  $(GREEN)typecheck$(RESET)    $(YELLOW)tsc --noEmit$(RESET)"
	@echo "  $(GREEN)test$(RESET)         $(YELLOW)bun test$(RESET)"
	@echo ""

install:
	@cd "$(abspath $(ROOT)/../..)" && bun install

dev:
	@cd "$(ROOT)" && bun run dev

build:
	@cd "$(ROOT)" && bun run build

start:
	@cd "$(ROOT)" && bun run start

typecheck:
	@cd "$(ROOT)" && bun run typecheck

test:
	@cd "$(ROOT)" && bun run test
