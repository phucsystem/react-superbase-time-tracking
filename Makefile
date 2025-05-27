.PHONY: dev prod dev-build prod-build dev-down prod-down logs clean db-init db-init-sql init-admin-user

# Development commands
dev:
	@echo "Starting development environment..."
	docker compose up

dev-build:
	@echo "Building and starting development environment..."
	docker compose up --build

dev-down:
	@echo "Stopping development environment..."
	docker compose down

# Production commands
prod:
	@echo "Starting production environment..."
	docker compose -f docker-compose.prod.yml up

prod-build:
	@echo "Building and starting production environment..."
	docker compose -f docker-compose.prod.yml up --build

prod-down:
	@echo "Stopping production environment..."
	docker compose -f docker-compose.prod.yml down

# Utility commands
logs:
	@echo "Showing logs for development environment..."
	docker compose logs -f

logs-prod:
	@echo "Showing logs for production environment..."
	docker compose -f docker-compose.prod.yml logs -f

clean:
	@echo "Cleaning up Docker resources..."
	docker compose down -v
	docker compose -f docker-compose.prod.yml down -v
	docker system prune -f

setup-dev:
	@echo "Setting up development environment..."
	cp .env.example .env
	@echo "Development environment file created. Starting services..."
	make dev-build

setup-prod:
	@echo "Setting up production environment..."
	make prod-build

# Database commands
db-reset:
	@echo "Resetting development database..."
	docker compose down -v
	docker volume rm react-superbase-time-tracking_postgres_data 2>/dev/null || true

db-backup:
	@echo "Creating database backup..."
	docker compose exec supabase-db pg_dump -U postgres supabase > backup_$(shell date +%Y%m%d_%H%M%S).sql

# Help
help:
	@echo "Available commands:"
	@echo "  dev          - Start development environment"
	@echo "  dev-build    - Build and start development environment"
	@echo "  dev-down     - Stop development environment"
	@echo "  prod         - Start production environment"
	@echo "  prod-build   - Build and start production environment"
	@echo "  prod-down    - Stop production environment"
	@echo "  logs         - Show development logs"
	@echo "  logs-prod    - Show production logs"
	@echo "  clean        - Clean up Docker resources"
	@echo "  setup-dev    - Setup development environment"
	@echo "  setup-prod   - Setup production environment"
	@echo "  db-init      - Initialize database from scratch"
	@echo "  db-reset     - Reset development database"
	@echo "  db-backup    - Backup development database"
	@echo "  db-check     - Check database tables and sample data"
	@echo "  db-init-sql  - Run init.sql on supabase-db"
	@echo "  init-admin-user - Run admin user initialization script"
	@echo "  help         - Show this help message"

init-admin-user:
	@if [ ! -f .env ]; then echo "Error: .env file not found"; exit 1; fi
	@export $$(grep -v '^#' .env | xargs) && node ./scripts/init-admin-user.js