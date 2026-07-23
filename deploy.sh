#!/bin/bash

# Sakani Project Deployment Script
# This script deploys both frontend and backend to the server

set -e  # Exit on any error

echo "🚀 Starting Sakani deployment..."

# Check if we're on the main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Deployment only allowed from main branch. Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Backend deployment
echo "📦 Deploying Laravel Backend..."
cd backend

# Install/update composer dependencies
composer install --optimize-autoloader --no-dev

# Clear and cache Laravel configs
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run database migrations
php artisan migrate --force

# Set proper permissions
chmod -R 755 storage bootstrap/cache
chmod -R 775 storage/logs storage/framework

echo "✅ Backend deployment completed!"

cd ..

# Frontend deployment
echo "🎨 Deploying React Frontend..."
cd frontend

# Install/update npm dependencies
npm ci --production

# Build the frontend
npm run build

echo "✅ Frontend deployment completed!"

cd ..

echo "🎉 Sakani deployment completed successfully!"
echo "📅 Deployed at: $(date)"