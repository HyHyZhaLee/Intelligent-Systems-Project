.PHONY: install install-backend install-frontend dev-all dev-backend dev-frontend clean help stop-backend stop-frontend stop-all

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Directories (use absolute paths to avoid cwd issues)
BACKEND_DIR := $(abspath ISProject/backend)
FRONTEND_DIR := $(abspath ISProject/frontend)
VENV_PYTHON := $(BACKEND_DIR)/venv/bin/python

help: ## Show this help message
	@echo "$(BLUE)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

install: install-backend install-frontend ## Install all project dependencies (includes database setup)

install-backend: ## Install backend dependencies and setup database
	@echo "$(BLUE)Installing backend dependencies...$(NC)"; \
	cd "$(BACKEND_DIR)" && \
	if [ ! -f .env ]; then \
		echo "$(YELLOW)Creating .env file from .env.example...$(NC)"; \
		cp .env.example .env; \
		echo "$(YELLOW)Please edit $(BACKEND_DIR)/.env with your configuration$(NC)"; \
	fi && \
	python3 -m pip install --upgrade pip && \
	python3 -m pip install -r requirements.txt && \
	echo "$(GREEN)✓ Backend dependencies installed$(NC)"; \
	echo ""; \
	echo "$(BLUE)Setting up database...$(NC)"; \
	cd "$(BACKEND_DIR)" && python3 scripts/setup_database.py; \
	EXIT_CODE=$$?; \
	if [ $$EXIT_CODE -eq 1 ]; then \
		echo ""; \
		echo "$(YELLOW)No users found. Creating your first admin user...$(NC)"; \
		echo "$(YELLOW)This user will have full admin access to all features.$(NC)"; \
		echo ""; \
		cd "$(BACKEND_DIR)" && python3 scripts/add_user.py --first-user; \
		echo "$(GREEN)✓ Database setup complete$(NC)"; \
	else \
		echo "$(GREEN)✓ Database setup complete$(NC)"; \
	fi

install-frontend: ## Install frontend dependencies
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	@cd "$(FRONTEND_DIR)" && \
	npm install && \
	echo "$(GREEN)✓ Frontend dependencies installed$(NC)"

stop-backend: ## Stop backend server on port 8000
	@if lsof -ti:8000 >/dev/null 2>&1; then \
		echo "$(YELLOW)Stopping backend server on port 8000...$(NC)"; \
		lsof -ti:8000 | xargs kill -9 2>/dev/null && \
		echo "$(GREEN)✓ Backend server stopped$(NC)" || \
		echo "$(RED)✗ Failed to stop backend server$(NC)"; \
	else \
		echo "$(YELLOW)No process found on port 8000$(NC)"; \
	fi

stop-frontend: ## Stop frontend server on port 3000
	@if lsof -ti:3000 >/dev/null 2>&1; then \
		echo "$(YELLOW)Stopping frontend server on port 3000...$(NC)"; \
		lsof -ti:3000 | xargs kill -9 2>/dev/null && \
		echo "$(GREEN)✓ Frontend server stopped$(NC)" || \
		echo "$(RED)✗ Failed to stop frontend server$(NC)"; \
	else \
		echo "$(YELLOW)No process found on port 3000$(NC)"; \
	fi

stop-all: stop-backend stop-frontend ## Stop both backend and frontend servers

dev-all: ## Run both frontend and backend concurrently
	@echo "$(BLUE)Starting development servers...$(NC)"
	@if lsof -ti:8000 >/dev/null 2>&1; then \
		echo "$(YELLOW)⚠ Port 8000 is already in use, killing existing process...$(NC)"; \
		lsof -ti:8000 | xargs kill -9 2>/dev/null || true; \
		sleep 1; \
	fi
	@if lsof -ti:3000 >/dev/null 2>&1; then \
		echo "$(YELLOW)⚠ Port 3000 is already in use, killing existing process...$(NC)"; \
		lsof -ti:3000 | xargs kill -9 2>/dev/null || true; \
		sleep 1; \
	fi
	@echo "$(YELLOW)Backend: http://localhost:8000$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:3000$(NC)"
	@echo "$(YELLOW)API Docs: http://localhost:8000/docs$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to stop all servers$(NC)"
	@bash -c "trap 'kill 0' EXIT INT TERM; \
	cd \"$(BACKEND_DIR)\" && \"$(VENV_PYTHON)\" -m uvicorn app.main:app --reload --port 8000 & \
	cd \"$(FRONTEND_DIR)\" && npm run dev & \
	wait"

dev-backend: ## Run backend only
	@echo "$(BLUE)Starting backend server...$(NC)"
	@if lsof -ti:8000 >/dev/null 2>&1; then \
		echo "$(YELLOW)⚠ Port 8000 is already in use$(NC)"; \
		echo "$(YELLOW)Killing existing process on port 8000...$(NC)"; \
		lsof -ti:8000 | xargs kill -9 2>/dev/null || true; \
		sleep 1; \
	fi
	@echo "$(YELLOW)Backend: http://localhost:8000$(NC)"
	@echo "$(YELLOW)API Docs: http://localhost:8000/docs$(NC)"
	@cd "$(BACKEND_DIR)" && "$(VENV_PYTHON)" -m uvicorn app.main:app --reload --port 8000

dev-frontend: ## Run frontend only
	@echo "$(BLUE)Starting frontend server...$(NC)"
	@if lsof -ti:3000 >/dev/null 2>&1; then \
		echo "$(YELLOW)⚠ Port 3000 is already in use$(NC)"; \
		echo "$(YELLOW)Killing existing process on port 3000...$(NC)"; \
		lsof -ti:3000 | xargs kill -9 2>/dev/null || true; \
		sleep 1; \
	fi
	@echo "$(YELLOW)Frontend: http://localhost:3000$(NC)"
	@cd "$(FRONTEND_DIR)" && npm run dev

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

init-db: ## Initialize database (create tables and sample users)
	@echo "$(BLUE)Initializing database...$(NC)"
	@cd "$(BACKEND_DIR)" && python3 scripts/init_db.py && \
	echo "$(GREEN)✓ Database initialized$(NC)"

train-model: ## Train pre-trained SVM model
	@echo "$(BLUE)Training SVM model...$(NC)"
	@cd "$(BACKEND_DIR)" && python3 scripts/train_model.py && \
	echo "$(GREEN)✓ Model trained$(NC)"

check: ## Check if dependencies are installed
	@echo "$(BLUE)Checking dependencies...$(NC)"
	@command -v python3 >/dev/null 2>&1 || { echo "$(YELLOW)✗ Python 3 not found$(NC)"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "$(YELLOW)✗ npm not found$(NC)"; exit 1; }
	@python3 -m pip --version >/dev/null 2>&1 || { echo "$(YELLOW)✗ pip not available via python3 -m pip$(NC)"; exit 1; }
	@echo "$(GREEN)✓ All prerequisites met$(NC)"
