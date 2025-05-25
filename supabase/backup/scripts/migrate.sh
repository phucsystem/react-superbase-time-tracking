#!/bin/bash

# Database connection settings
DB_HOST="localhost"
DB_PORT="54322"
DB_NAME="supabase"
DB_USER="postgres"
DB_PASSWORD="postgres"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run SQL command
run_sql() {
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$1" 2>/dev/null
}

# Function to run SQL file
run_sql_file() {
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$1" 2>/dev/null
}

# Function to check if migration table exists
ensure_migration_table() {
    echo "Ensuring migration tracking table exists..."
    run_sql_file "./supabase/migration_tracker.sql"
}

# Function to get applied migrations
get_applied_migrations() {
    run_sql "SELECT filename FROM migrations ORDER BY applied_at;" | grep -E "\.sql$" | tr -d ' '
}

# Function to get available migrations
get_available_migrations() {
    find ./supabase/migrations -name "*.sql" -type f | sort | xargs -I {} basename {}
}

# Function to apply a specific migration
apply_migration() {
    local migration_file="$1"
    local migration_path="./supabase/migrations/$migration_file"
    
    if [ ! -f "$migration_path" ]; then
        echo -e "${RED}Error: Migration file $migration_file not found${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Applying migration: $migration_file${NC}"
    
    # Run the migration
    if run_sql_file "$migration_path"; then
        # Record the migration as applied
        run_sql "INSERT INTO migrations (filename) VALUES ('$migration_file') ON CONFLICT (filename) DO UPDATE SET applied_at = NOW();"
        echo -e "${GREEN}✓ Migration $migration_file applied successfully${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to apply migration $migration_file${NC}"
        return 1
    fi
}

# Function to show migration status
show_status() {
    echo -e "${YELLOW}=== Migration Status ===${NC}"
    
    ensure_migration_table
    
    applied_migrations=$(get_applied_migrations)
    available_migrations=$(get_available_migrations)
    
    echo -e "\n${GREEN}Applied migrations:${NC}"
    if [ -z "$applied_migrations" ]; then
        echo "  None"
    else
        echo "$applied_migrations" | while read -r migration; do
            echo "  ✓ $migration"
        done
    fi
    
    echo -e "\n${YELLOW}Available migrations:${NC}"
    echo "$available_migrations" | while read -r migration; do
        if echo "$applied_migrations" | grep -q "^$migration$"; then
            echo "  ✓ $migration (applied)"
        else
            echo "  ○ $migration (pending)"
        fi
    done
}

# Function to run pending migrations
run_pending() {
    echo -e "${YELLOW}=== Running Pending Migrations ===${NC}"
    
    ensure_migration_table
    
    applied_migrations=$(get_applied_migrations)
    available_migrations=$(get_available_migrations)
    
    pending_found=false
    
    echo "$available_migrations" | while read -r migration; do
        if ! echo "$applied_migrations" | grep -q "^$migration$"; then
            pending_found=true
            apply_migration "$migration"
        fi
    done
    
    if [ "$pending_found" = false ]; then
        echo -e "${GREEN}No pending migrations found${NC}"
    fi
}

# Main script logic
case "$1" in
    "status")
        show_status
        ;;
    "pending")
        run_pending
        ;;
    "apply")
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Please specify a migration file${NC}"
            echo "Usage: $0 apply <migration_file.sql>"
            exit 1
        fi
        ensure_migration_table
        apply_migration "$2"
        ;;
    "list")
        echo -e "${YELLOW}Available migration files:${NC}"
        get_available_migrations | while read -r migration; do
            echo "  $migration"
        done
        ;;
    *)
        echo "Usage: $0 {status|pending|apply <file>|list}"
        echo ""
        echo "Commands:"
        echo "  status   - Show migration status"
        echo "  pending  - Run all pending migrations"
        echo "  apply    - Apply a specific migration file"
        echo "  list     - List all available migration files"
        exit 1
        ;;
esac