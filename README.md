# Time Tracking App

A React TypeScript application with Supabase backend for tracking development vendor time by task.

## Project Structure

```
.
├── web-ui/                    # React frontend application
│   ├── src/                   # React source code
│   ├── public/                # Static assets
│   ├── Dockerfile.dev         # Development Docker configuration
│   ├── Dockerfile.prod        # Production Docker configuration
│   └── package.json           # Frontend dependencies
├── supabase/                  # Supabase backend configuration
│   ├── config.toml            # Supabase CLI configuration
│   ├── migrations/            # Database migration files
│   ├── seed.sql               # Sample data
│   └── init.sql               # Legacy database setup
├── docker-compose.yml         # Development environment
├── docker-compose-production.yml # Production environment
├── Makefile                   # Convenience commands
├── .env.development           # Development environment variables
├── .env.production.example    # Production environment template
└── README.md                  # Project documentation
```

## Features

- **Task Management**: Create, edit, and delete tasks with project association
- **Time Tracking**: Start/stop timers for tasks with real-time tracking
- **Reporting**: View time reports by week/month with CSV export
- **Docker Support**: Separate Docker configurations for development and production
- **Supabase Integration**: Full local Supabase stack with Studio interface

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Make (optional, for convenience commands)

### Development Setup

1. **Clone and setup**:
   ```bash
   git clone <your-repo>
   cd react-superbase-time-tracking
   ```

2. **Start development environment**:
   ```bash
   # Using Make (recommended)
   make setup-dev

   # Or manually
   cp .env.development .env
   docker-compose up --build
   ```

3. **Access the application**:
   - **Frontend**: http://localhost:5173
   - **Supabase Studio**: http://localhost:54323
   - **Supabase API**: http://localhost:54321
   - **PostgreSQL**: localhost:54322

### Production Setup

1. **Create production environment file**:
   ```bash
   cp .env.production.example .env.production
   # Edit .env.production with your actual values
   ```

2. **Start production environment**:
   ```bash
   # Using Make
   make setup-prod

   # Or manually
   docker-compose -f docker-compose-production.yml --env-file .env.production up --build
   ```

## Available Commands

### Using Make (Recommended)

```bash
# Development
make dev              # Start development environment
make dev-build        # Build and start development
make dev-down         # Stop development environment

# Production
make prod             # Start production environment
make prod-build       # Build and start production
make prod-down        # Stop production environment

# Utilities
make logs             # Show development logs
make logs-prod        # Show production logs
make clean            # Clean up Docker resources
make db-reset         # Reset development database
make db-backup        # Backup development database
make help             # Show all commands
```

### Using Docker Compose Directly

```bash
# Development
docker-compose --env-file .env.development up --build
docker-compose down

# Production
docker-compose -f docker-compose-production.yml --env-file .env.production up --build
docker-compose -f docker-compose-production.yml down
```

## Development Features

The development environment includes:

- **Hot Reload**: React development server with live updates
- **Full Supabase Stack**: Local database, auth, API, and Studio
- **Sample Data**: Pre-loaded with sample vendors, tasks, and time entries
- **Database Studio**: Visual database management at http://localhost:54323

## Production Features

The production environment provides:

- **Optimized Build**: Multi-stage Docker build for minimal image size
- **Environment Security**: Build-time environment variable injection
- **Health Checks**: Container health monitoring
- **SSL Ready**: Optional nginx proxy configuration
- **Scalable**: Designed for production deployment

## Database Schema

The application uses the following main tables:

- **vendors**: Store vendor/developer information
- **tasks**: Store task details with vendor association  
- **time_entries**: Store time tracking entries with duration

See `supabase/README.md` for detailed schema information.

## Environment Variables

### Development (.env.development)
- Uses default local Supabase configuration
- Pre-configured with demo JWT secrets
- Includes sample data seeding

### Production (.env.production)
- **VITE_SUPABASE_URL**: Your Supabase project URL
- **VITE_SUPABASE_ANON_KEY**: Your Supabase anonymous key
- **JWT_SECRET**: Secure JWT secret (32+ characters)
- **POSTGRES_PASSWORD**: Secure database password
- **SITE_URL**: Your domain URL
- **SMTP_***: Email configuration for auth

## Local Development (without Docker)

```bash
cd web-ui
npm install
npm run dev
```

Make sure to have PostgreSQL running and update the Supabase connection details.

## Frontend Scripts

Run from `web-ui/` directory:

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint
- `npm run typecheck`: Run TypeScript type checking

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL + API + Auth)
- **Icons**: Lucide React
- **Date handling**: date-fns
- **Routing**: React Router DOM
- **Deployment**: Docker, Nginx

## Deployment

### Using Your Own Supabase Project

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migrations from `supabase/migrations/`
3. Update `.env.production` with your project credentials
4. Deploy using `make prod-build`

### Using Local Supabase in Production

The production Docker Compose includes a full Supabase stack that can be used for production deployments where you want to self-host everything.

## Troubleshooting

- **Port conflicts**: Modify ports in docker-compose files if needed
- **Database issues**: Use `make db-reset` to reset development database
- **Build failures**: Check environment variables and Docker logs
- **Permission issues**: Ensure Docker has proper permissions

For more help, check the logs with `make logs` or `make logs-prod`.