#!/bin/bash
# Migration script for Docker environment
# This script runs migrations inside the app container

echo "🚀 Starting database migrations..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Run migrations
docker compose exec -T app npm run migrate

echo "✅ Migrations completed!"

