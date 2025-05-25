#!/bin/bash

# Time Tracking App Deployment Script
set -e

echo "🚀 Starting deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found. Please create it first."
    exit 1
fi

# Source environment variables
source .env

# Check if required variables are set
if [ -z "$POSTGRES_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
    echo "❌ Error: Required environment variables not set."
    echo "Please set POSTGRES_PASSWORD and JWT_SECRET in .env file."
    exit 1
fi

# Update the system packages
echo "📦 Updating system packages..."
sudo apt update

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.prod.yml down || true

# Remove old images (optional - uncomment to save space)
# echo "🗑️ Removing old images..."
# docker image prune -f

# Build and start containers
echo "🏗️ Building and starting containers..."
docker compose -f docker-compose.prod.yml up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker compose -f docker-compose.prod.yml ps

# Test database connection
echo "🔌 Testing database connection..."
docker compose -f docker-compose.prod.yml exec -T supabase-db pg_isready -U postgres

# Test API endpoint
echo "🌐 Testing API endpoint..."
sleep 10
curl -f http://localhost/api/rest/v1/vendors || echo "⚠️ API not responding yet, may need more time to start"

echo "✅ Deployment completed!"
echo ""
echo "🌍 Your app should be available at:"
echo "   - Frontend: http://your-server-ip"
echo "   - API: http://your-server-ip/api/rest/v1/"
echo ""
echo "📊 To view logs:"
echo "   docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🔧 To access database:"
echo "   docker compose -f docker-compose.prod.yml exec supabase-db psql -U postgres -d supabase"