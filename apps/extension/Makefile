# Story Lens browser extension (WXT + React).
.PHONY: \
	help install dev dev-firefox build build-firefox zip zip-firefox \
	typecheck i18n-parse extension

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
	@echo "$(BLUE)Extension ($(RESET)apps/extension$(BLUE))$(RESET)"
	@echo "  $(GREEN)install$(RESET)        $(YELLOW)bun install$(RESET) from monorepo root ($(YELLOW)make install$(RESET))"
	@echo "  $(GREEN)dev$(RESET), $(GREEN)extension$(RESET)   Chrome dev server ($(YELLOW)wxt$(RESET))"
	@echo "  $(GREEN)dev-firefox$(RESET)    Firefox dev server ($(YELLOW)wxt -b firefox$(RESET))"
	@echo "  $(GREEN)build$(RESET)          Chrome production build"
	@echo "  $(GREEN)build-firefox$(RESET)  Firefox production build"
	@echo "  $(GREEN)zip$(RESET)            build + zip for Chrome"
	@echo "  $(GREEN)zip-firefox$(RESET)    build + zip for Firefox"
	@echo "  $(GREEN)typecheck$(RESET)      $(YELLOW)tsc --noEmit$(RESET)"
	@echo "  $(GREEN)i18n-parse$(RESET)     extract i18n keys ($(YELLOW)i18next-parser$(RESET))"
	@echo ""

install:
	@cd "$(abspath $(ROOT)/../..)" && bun install

dev extension:
	@cd "$(ROOT)" && bun run dev

dev-firefox:
	@cd "$(ROOT)" && bun run dev:firefox

build:
	@cd "$(ROOT)" && bun run build

build-firefox:
	@cd "$(ROOT)" && bun run build:firefox

zip: build
	@cd "$(ROOT)" && bun run zip

zip-firefox: build-firefox
	@cd "$(ROOT)" && bun run zip:firefox

typecheck:
	@cd "$(ROOT)" && bun run typecheck

i18n-parse:
	@cd "$(abspath $(ROOT)/../..)" && bun run i18n:parse
