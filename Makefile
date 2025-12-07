.PHONY: install install-backend install-frontend dev-all dev-backend dev-frontend clean help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

# Directories
BACKEND_DIR := ISProject/backend
FRONTEND_DIR := ISProject/frontend

help: ## Show this help message
	@echo "$(BLUE)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

install: install-backend install-frontend ## Install all project dependencies

install-backend: ## Install backend dependencies
	@echo "$(BLUE)Installing backend dependencies...$(NC)"
	@cd $(BACKEND_DIR) && \
	if [ ! -f .env ]; then \
		echo "$(YELLOW)Creating .env file from .env.example...$(NC)"; \
		cp .env.example .env; \
		echo "$(YELLOW)Please edit $(BACKEND_DIR)/.env with your configuration$(NC)"; \
	fi && \
	python3 -m pip install --upgrade pip && \
	python3 -m pip install -r requirements.txt && \
	echo "$(GREEN)✓ Backend dependencies installed$(NC)"

install-frontend: ## Install frontend dependencies
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	@cd $(FRONTEND_DIR) && \
	npm install && \
	echo "$(GREEN)✓ Frontend dependencies installed$(NC)"

dev-all: ## Run both frontend and backend concurrently
	@echo "$(BLUE)Starting development servers...$(NC)"
	@echo "$(YELLOW)Backend: http://localhost:8000$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:3000$(NC)"
	@echo "$(YELLOW)API Docs: http://localhost:8000/docs$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to stop all servers$(NC)"
	@bash -c "trap 'kill 0' EXIT INT TERM; \
	cd $(BACKEND_DIR) && python3 -m uvicorn app.main:app --reload --port 8000 & \
	cd $(FRONTEND_DIR) && npm run dev & \
	wait"

dev-backend: ## Run backend only
	@echo "$(BLUE)Starting backend server...$(NC)"
	@echo "$(YELLOW)Backend: http://localhost:8000$(NC)"
	@echo "$(YELLOW)API Docs: http://localhost:8000/docs$(NC)"
	@cd $(BACKEND_DIR) && python3 -m uvicorn app.main:app --reload --port 8000

dev-frontend: ## Run frontend only
	@echo "$(BLUE)Starting frontend server...$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:3000$(NC)"
	@cd $(FRONTEND_DIR) && npm run dev

clean: ## Clean generated files and caches
	@echo "$(BLUE)Cleaning...$(NC)"
	@find . -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type d -name "*.egg-info" -exec rm -r {} + 2>/dev/null || true
	@rm -rf $(BACKEND_DIR)/*.db 2>/dev/null || true
	@rm -rf $(BACKEND_DIR)/logs/*.log 2>/dev/null || true
	@rm -rf $(FRONTEND_DIR)/node_modules 2>/dev/null || true
	@rm -rf $(FRONTEND_DIR)/build 2>/dev/null || true
	@rm -rf $(FRONTEND_DIR)/dist 2>/dev/null || true
	@echo "$(GREEN)✓ Clean complete$(NC)"

init-db: ## Initialize database (create tables)
	@echo "$(BLUE)Initializing database...$(NC)"
	@cd $(BACKEND_DIR) && python3 -c "from app.database import init_db; init_db()" && \
	echo "$(GREEN)✓ Database initialized$(NC)"

check: ## Check if dependencies are installed
	@echo "$(BLUE)Checking dependencies...$(NC)"
	@command -v python3 >/dev/null 2>&1 || { echo "$(YELLOW)✗ Python 3 not found$(NC)"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "$(YELLOW)✗ npm not found$(NC)"; exit 1; }
	@python3 -m pip --version >/dev/null 2>&1 || { echo "$(YELLOW)✗ pip not available via python3 -m pip$(NC)"; exit 1; }
	@echo "$(GREEN)✓ All prerequisites met$(NC)"
