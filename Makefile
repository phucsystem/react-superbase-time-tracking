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
	@if [ ! -f .env.production ]; then \
		echo "Please create .env.production from .env.production.example"; \
		exit 1; \
	fi
	make prod-build

# Database commands
db-init:
	@echo "Initializing database from scratch..."
	@echo "Stopping all services..."
	docker compose down -v
	@echo "Removing database volume..."
	docker volume rm react-superbase-time-tracking_postgres_data 2>/dev/null || true
	@echo "Starting database service only..."
	docker compose up -d supabase-db
	@echo "Waiting for database to be ready..."
	@sleep 15
	@echo "Checking database logs..."
	docker compose logs supabase-db | tail -10
	@echo "Database initialized with complete schema and sample data!"
	@echo "You can now start the full environment with 'make dev' or 'make dev-build'"

db-reset:
	@echo "Resetting development database..."
	docker compose down -v
	docker volume rm react-superbase-time-tracking_postgres_data 2>/dev/null || true
	make dev-build

db-backup:
	@echo "Creating database backup..."
	docker compose exec supabase-db pg_dump -U postgres supabase > backup_$(shell date +%Y%m%d_%H%M%S).sql

db-init-sql:
	@echo "Running init.sql on supabase-db..."
	docker compose exec supabase-db psql -U postgres -d supabase -f /docker-entrypoint-initdb.d/01-init.sql

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