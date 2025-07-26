# MercadoSniper Makefile
# Convenient commands for development and deployment

# Variables
DOCKER_COMPOSE = docker-compose
DOCKER_COMPOSE_DEV = docker-compose -f docker-compose.dev.yml
BACKEND_DIR = backend
FRONTEND_DIR = frontend

# Default target
.DEFAULT_GOAL := help

# Colors for output
RESET = \033[0m
BOLD = \033[1m
RED = \033[31m
GREEN = \033[32m
YELLOW = \033[33m
BLUE = \033[34m

.PHONY: help
help: ## Show this help message
	@echo "$(BOLD)MercadoSniper Development Commands$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# =============================================================================
# Development Commands
# =============================================================================

.PHONY: install
install: ## Install all dependencies (backend and frontend)
	@echo "$(GREEN)Installing backend dependencies...$(RESET)"
	cd $(BACKEND_DIR) && python -m venv venv && \
		source venv/bin/activate && \
		pip install -r requirements.txt
	@echo "$(GREEN)Installing frontend dependencies...$(RESET)"
	cd $(FRONTEND_DIR) && npm install
	@echo "$(GREEN)✅ Installation complete!$(RESET)"

.PHONY: dev
dev: ## Start development servers (local)
	@echo "$(GREEN)Starting development servers...$(RESET)"
	@$(MAKE) -j2 dev-backend dev-frontend

.PHONY: dev-backend
dev-backend: ## Start backend development server
	@echo "$(GREEN)Starting backend server...$(RESET)"
	cd $(BACKEND_DIR) && \
		source venv/bin/activate && \
		uvicorn main:socket_app --reload --host 0.0.0.0 --port 8000

.PHONY: dev-frontend
dev-frontend: ## Start frontend development server
	@echo "$(GREEN)Starting frontend server...$(RESET)"
	cd $(FRONTEND_DIR) && npm run dev

# =============================================================================
# Docker Commands
# =============================================================================

.PHONY: docker-build
docker-build: ## Build Docker images
	@echo "$(GREEN)Building Docker images...$(RESET)"
	$(DOCKER_COMPOSE) build

.PHONY: docker-up
docker-up: ## Start all services with Docker
	@echo "$(GREEN)Starting all services with Docker...$(RESET)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✅ All services started!$(RESET)"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"

.PHONY: docker-dev
docker-dev: ## Start development environment with Docker
	@echo "$(GREEN)Starting development environment...$(RESET)"
	$(DOCKER_COMPOSE_DEV) up -d
	@echo "$(GREEN)✅ Development environment started!$(RESET)"
	@$(MAKE) docker-logs

.PHONY: docker-down
docker-down: ## Stop all Docker services
	@echo "$(YELLOW)Stopping all services...$(RESET)"
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE_DEV) down 2>/dev/null || true

.PHONY: docker-logs
docker-logs: ## View Docker logs
	$(DOCKER_COMPOSE) logs -f

.PHONY: docker-restart
docker-restart: ## Restart all Docker services
	@echo "$(YELLOW)Restarting all services...$(RESET)"
	$(DOCKER_COMPOSE) restart

.PHONY: docker-clean
docker-clean: ## Clean Docker containers, images, and volumes
	@echo "$(RED)Cleaning Docker resources...$(RESET)"
	$(DOCKER_COMPOSE) down -v --remove-orphans
	docker system prune -f
	docker volume prune -f

# =============================================================================
# Testing Commands
# =============================================================================

.PHONY: test
test: test-backend test-frontend ## Run all tests

.PHONY: test-backend
test-backend: ## Run backend tests
	@echo "$(GREEN)Running backend tests...$(RESET)"
	cd $(BACKEND_DIR) && \
		source venv/bin/activate && \
		pytest tests/ -v

.PHONY: test-backend-coverage
test-backend-coverage: ## Run backend tests with coverage
	@echo "$(GREEN)Running backend tests with coverage...$(RESET)"
	cd $(BACKEND_DIR) && \
		source venv/bin/activate && \
		pytest --cov=. --cov-report=html --cov-report=term tests/

.PHONY: test-frontend
test-frontend: ## Run frontend tests
	@echo "$(GREEN)Running frontend tests...$(RESET)"
	cd $(FRONTEND_DIR) && npm test

# =============================================================================
# Code Quality Commands
# =============================================================================

.PHONY: lint
lint: lint-backend lint-frontend ## Run linting for all code

.PHONY: lint-backend
lint-backend: ## Lint backend code
	@echo "$(GREEN)Linting backend code...$(RESET)"
	cd $(BACKEND_DIR) && \
		source venv/bin/activate && \
		black . && \
		isort . && \
		flake8 .

.PHONY: lint-frontend
lint-frontend: ## Lint frontend code
	@echo "$(GREEN)Linting frontend code...$(RESET)"
	cd $(FRONTEND_DIR) && \
		npm run lint && \
		npm run type-check

.PHONY: format
format: ## Format all code
	@echo "$(GREEN)Formatting code...$(RESET)"
	cd $(BACKEND_DIR) && \
		source venv/bin/activate && \
		black . && \
		isort .
	cd $(FRONTEND_DIR) && \
		npx prettier --write .

# =============================================================================
# Database Commands
# =============================================================================

.PHONY: db-start
db-start: ## Start only database services
	@echo "$(GREEN)Starting database services...$(RESET)"
	$(DOCKER_COMPOSE) up -d mongo redis

.PHONY: db-stop
db-stop: ## Stop database services
	@echo "$(YELLOW)Stopping database services...$(RESET)"
	$(DOCKER_COMPOSE) stop mongo redis

.PHONY: db-reset
db-reset: ## Reset database (WARNING: This will delete all data!)
	@echo "$(RED)⚠️  WARNING: This will delete all database data!$(RESET)"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	$(DOCKER_COMPOSE) down -v
	$(DOCKER_COMPOSE) up -d mongo redis
	@echo "$(GREEN)✅ Database reset complete!$(RESET)"

.PHONY: db-backup
db-backup: ## Backup database
	@echo "$(GREEN)Creating database backup...$(RESET)"
	mkdir -p backups
	docker exec mercadosniper-mongo mongodump --authenticationDatabase admin \
		-u admin -p password123 --out /backup/$(shell date +%Y%m%d_%H%M%S)
	@echo "$(GREEN)✅ Backup created!$(RESET)"

# =============================================================================
# Production Commands
# =============================================================================

.PHONY: build
build: ## Build for production
	@echo "$(GREEN)Building for production...$(RESET)"
	cd $(BACKEND_DIR) && \
		source venv/bin/activate && \
		pip install -r requirements.txt
	cd $(FRONTEND_DIR) && \
		npm ci --only=production && \
		npm run build
	@echo "$(GREEN)✅ Production build complete!$(RESET)"

.PHONY: deploy-prod
deploy-prod: ## Deploy to production with Docker
	@echo "$(GREEN)Deploying to production...$(RESET)"
	$(DOCKER_COMPOSE) -f docker-compose.yml --profile production up -d
	@echo "$(GREEN)✅ Production deployment complete!$(RESET)"

# =============================================================================
# Utility Commands
# =============================================================================

.PHONY: status
status: ## Show status of all services
	@echo "$(BOLD)Service Status:$(RESET)"
	$(DOCKER_COMPOSE) ps

.PHONY: health
health: ## Check health of all services
	@echo "$(BOLD)Health Check:$(RESET)"
	@echo "Backend: $(shell curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health || echo "❌ DOWN")"
	@echo "Frontend: $(shell curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "❌ DOWN")"

.PHONY: shell-backend
shell-backend: ## Access backend container shell
	$(DOCKER_COMPOSE) exec backend bash

.PHONY: shell-frontend
shell-frontend: ## Access frontend container shell
	$(DOCKER_COMPOSE) exec frontend sh

.PHONY: shell-mongo
shell-mongo: ## Access MongoDB shell
	$(DOCKER_COMPOSE) exec mongo mongosh --host localhost --port 27017 -u admin -p password123

.PHONY: env-setup
env-setup: ## Setup environment files from templates
	@echo "$(GREEN)Setting up environment files...$(RESET)"
	[ ! -f $(BACKEND_DIR)/.env ] && cp $(BACKEND_DIR)/.env.template $(BACKEND_DIR)/.env || true
	[ ! -f $(FRONTEND_DIR)/.env.local ] && cp $(FRONTEND_DIR)/.env.example $(FRONTEND_DIR)/.env.local || true
	@echo "$(GREEN)✅ Environment files created!$(RESET)"
	@echo "$(YELLOW)⚠️  Please edit the .env files with your configuration$(RESET)"

.PHONY: update
update: ## Update all dependencies
	@echo "$(GREEN)Updating dependencies...$(RESET)"
	cd $(BACKEND_DIR) && \
		source venv/bin/activate && \
		pip install --upgrade -r requirements.txt
	cd $(FRONTEND_DIR) && npm update
	@echo "$(GREEN)✅ Dependencies updated!$(RESET)"

.PHONY: clean
clean: ## Clean all build artifacts and dependencies
	@echo "$(RED)Cleaning build artifacts...$(RESET)"
	rm -rf $(BACKEND_DIR)/venv
	rm -rf $(BACKEND_DIR)/__pycache__
	rm -rf $(BACKEND_DIR)/.pytest_cache
	rm -rf $(FRONTEND_DIR)/node_modules
	rm -rf $(FRONTEND_DIR)/.next
	rm -rf $(FRONTEND_DIR)/out
	@echo "$(GREEN)✅ Cleanup complete!$(RESET)"

# =============================================================================
# Quick Start Commands
# =============================================================================

.PHONY: quick-start
quick-start: ## Quick start for new developers
	@echo "$(BOLD)🚀 MercadoSniper Quick Start$(RESET)"
	@echo ""
	@$(MAKE) env-setup
	@$(MAKE) docker-up
	@echo ""
	@echo "$(GREEN)✅ MercadoSniper is now running!$(RESET)"
	@echo ""
	@echo "$(BOLD)Access your application:$(RESET)"
	@echo "  Frontend: $(BLUE)http://localhost:3000$(RESET)"
	@echo "  Backend:  $(BLUE)http://localhost:8000$(RESET)"
	@echo "  API Docs: $(BLUE)http://localhost:8000/docs$(RESET)"
	@echo ""
	@echo "$(BOLD)Useful commands:$(RESET)"
	@echo "  make docker-logs    # View logs"
	@echo "  make docker-down    # Stop services"
	@echo "  make help          # Show all commands"

.PHONY: quick-dev
quick-dev: ## Quick start for development
	@echo "$(BOLD)🚀 Starting Development Environment$(RESET)"
	@$(MAKE) env-setup
	@$(MAKE) docker-dev 