# Story Lens database (Prisma + PostgreSQL).
.PHONY: \
	help db-generate db-migrate-dev db-migrate-deploy db-migrate-reset \
	db-seed db-studio

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
	@echo "$(BLUE)Database ($(RESET)packages/db$(BLUE))$(RESET)"
	@echo "  $(GREEN)db-generate$(RESET)         $(YELLOW)prisma generate$(RESET)"
	@echo "  $(GREEN)db-migrate-dev$(RESET)      $(YELLOW)prisma migrate dev$(RESET)"
	@echo "  $(GREEN)db-migrate-deploy$(RESET)   $(YELLOW)prisma migrate deploy$(RESET) ($(YELLOW)requires Postgres$(RESET))"
	@echo "  $(GREEN)db-migrate-reset$(RESET)    $(YELLOW)prisma migrate reset$(RESET)"
	@echo "  $(GREEN)db-seed$(RESET)             $(YELLOW)prisma db seed$(RESET)"
	@echo "  $(GREEN)db-studio$(RESET)           open Prisma Studio"
	@echo ""

db-generate:
	@cd "$(ROOT)" && bunx prisma generate

db-migrate-dev:
	@cd "$(ROOT)" && bunx prisma migrate dev

db-migrate-deploy:
	@cd "$(ROOT)" && bunx prisma migrate deploy

db-migrate-reset:
	@cd "$(ROOT)" && bunx prisma migrate reset

db-seed:
	@cd "$(ROOT)" && bunx prisma db seed

db-studio:
	@cd "$(ROOT)" && bunx prisma studio
