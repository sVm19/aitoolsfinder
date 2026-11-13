.PHONY: help install test lint format build up down

help:
	@echo "AIToolsFinder Development Commands:"
	@echo "  make install      - Install frontend and backend dependencies"
	@echo "  make test         - Run backend and frontend test suites"
	@echo "  make lint         - Run linters (ruff, typecheck)"
	@echo "  make format       - Format codebase"
	@echo "  make build        - Build Next.js production bundle"
	@echo "  make up           - Start local Docker Compose environment"
	@echo "  make down         - Stop local Docker Compose environment"

test:
	@cd backend && .venv/Scripts/pytest -v tests
	@cd frontend && npm run typecheck

lint:
	@cd backend && .venv/Scripts/ruff check src tests
	@cd frontend && npm run typecheck

format:
	@cd backend && .venv/Scripts/ruff format src tests

build:
	@cd frontend && npm run build

up:
	docker compose -f deploy/docker-compose.yml up -d

down:
	docker compose -f deploy/docker-compose.yml down

docker-push:
	@powershell -ExecutionPolicy Bypass -File scripts/build-and-push.ps1 -Username $(DOCKERHUB_USERNAME)
