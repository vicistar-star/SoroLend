.PHONY: help build test lint clean dev migrate seed

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Smart Contracts ─────────────────────────────────────────────────────────

build: ## Build all Soroban smart contracts (WASM)
	cd contracts && cargo build --target wasm32-unknown-unknown --release

build-contracts: build ## Alias for build

test: test-contracts ## Run all tests

test-contracts: ## Run smart contract tests
	cd contracts && cargo test

test-contracts-unit: ## Run unit tests only
	cd contracts && cargo test --lib

lint: lint-contracts ## Run all linters

lint-contracts: ## Lint smart contracts with clippy
	cd contracts && cargo clippy -- -D warnings

clean: ## Clean all build artifacts
	cd contracts && cargo clean
	rm -rf contracts/target

# ─── Development ──────────────────────────────────────────────────────────────

dev: ## Start full development stack (Docker Compose)
	docker compose up -d

dev-logs: ## Follow logs from all services
	docker compose logs -f

dev-down: ## Stop development stack
	docker compose down

dev-rebuild: ## Rebuild and restart
	docker compose up --build -d

migrate: ## Run database migrations
	docker compose exec backend npm run migration:run

seed: ## Seed development database
	docker compose exec backend npm run seed

# ─── Backend ──────────────────────────────────────────────────────────────────

backend-install: ## Install backend dependencies
	cd backend && npm install

backend-dev: ## Start backend in development mode
	cd backend && npm run start:dev

backend-build: ## Build backend for production
	cd backend && npm run build

backend-test: ## Run backend tests
	cd backend && npm run test

backend-lint: ## Lint backend
	cd backend && npm run lint

# ─── Frontend ──────────────────────────────────────────────────────────────────

frontend-install: ## Install frontend dependencies
	cd frontend && npm install

frontend-dev: ## Start frontend in development mode
	cd frontend && ng serve

frontend-build: ## Build frontend for production
	cd frontend && ng build --configuration=production

frontend-test: ## Run frontend tests
	cd frontend && ng test

frontend-lint: ## Lint frontend
	cd frontend && npm run lint

# ─── Infrastructure ────────────────────────────────────────────────────────────

docker-build: ## Build all Docker images
	docker compose build

docker-push: ## Push Docker images to registry
	@echo "Set DOCKER_REGISTRY and IMAGE_TAG environment variables"
	docker tag sorolend-backend:latest $$DOCKER_REGISTRY/backend:$$IMAGE_TAG
	docker tag sorolend-frontend:latest $$DOCKER_REGISTRY/frontend:$$IMAGE_TAG
	docker push $$DOCKER_REGISTRY/backend:$$IMAGE_TAG
	docker push $$DOCKER_REGISTRY/frontend:$$IMAGE_TAG

# ─── Utility ───────────────────────────────────────────────────────────────────

setup: ## Full project setup (install all dependencies)
	cd backend && npm install
	cd frontend && npm install
	cargo build --target wasm32-unknown-unknown --release || true

update: ## Update all dependencies
	cd contracts && cargo update
	cd backend && npm update
	cd frontend && npm update

info: ## Show project information
	@echo "SoroLend — Decentralized Lending Protocol"
	@echo "  Contracts:   Stellar Soroban (Rust)"
	@echo "  Backend:     NestJS (TypeScript)"
	@echo "  Frontend:    Angular 17 (TypeScript)"
	@echo "  Database:    PostgreSQL 15"
	@echo "  Cache:       Redis 7"
	@echo "  Queue:       RabbitMQ 3.12"
