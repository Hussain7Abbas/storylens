# Story Lens API client (Orval-generated React Query hooks).
.PHONY: help orval typecheck

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
	@echo "$(BLUE)API ($(RESET)packages/api$(BLUE))$(RESET)"
	@echo "  $(GREEN)orval$(RESET)        regenerate client from backend OpenAPI ($(YELLOW)backend must be running$(RESET))"
	@echo "  $(GREEN)typecheck$(RESET)    $(YELLOW)tsc --noEmit$(RESET)"
	@echo ""

orval:
	@cd "$(ROOT)" && bun run oeval

typecheck:
	@cd "$(ROOT)" && bun run typecheck
