#!/bin/bash

# Deploy script for EduPlanner VPS
# This script is called by GitHub Actions via SSH

set -e

echo "🚀 Starting deployment..."

# Navigate to project directory
cd /path/to/eduplanner || exit

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin master

# Build and restart Docker containers
echo "🐳 Building and restarting containers..."
docker compose down
docker compose build --no-cache
docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database migrations automatically
echo "🗄️ Running database migrations..."
docker compose exec app npm run migrate || echo "⚠️ Migration failed or already applied"

# Check if services are running
echo "✅ Checking services..."
docker compose ps

echo "🎉 Deployment complete!"

