#!/bin/bash

# Sakani Project Deployment Script for Hostinger
# This script deploys both frontend and backend to Hostinger shared hosting

set -e  # Exit on any error

echo "🚀 Starting Sakani deployment on Hostinger..."
echo "📍 Current directory: $(pwd)"
echo "📅 Deployment time: $(date)"

# Check if we're in the right directory
if [ ! -f "deploy.sh" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

# Check if we're on the main branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
echo "📍 Current branch: $CURRENT_BRANCH"

# Backend deployment
echo "📦 Deploying Laravel Backend..."
cd backend

# Install/update composer dependencies
echo "🔧 Setting up backend dependencies..."
chmod +x setup-dependencies.sh
./setup-dependencies.sh

# Clear and cache Laravel configs (skip if artisan not available)
if php artisan --version &> /dev/null; then
    php artisan config:cache || echo "⚠️  Config cache skipped"
    php artisan route:cache || echo "⚠️  Route cache skipped" 
    php artisan view:cache || echo "⚠️  View cache skipped"
    
    # Run database migrations if database is configured
    if grep -q "DB_DATABASE=" .env && ! grep -q "DB_DATABASE=$" .env; then
        echo "🗄️  Running database migrations..."
        php artisan migrate --force || echo "⚠️  Migration failed - check database config"
    else
        echo "⚠️  Database not configured - skipping migrations"
    fi
else
    echo "⚠️  Laravel Artisan not available - skipping cache commands"
fi

# Set proper permissions for shared hosting
echo "🔐 Setting file permissions..."
find storage -type f -exec chmod 644 {} \; 2>/dev/null || true
find storage -type d -exec chmod 755 {} \; 2>/dev/null || true
find bootstrap/cache -type f -exec chmod 644 {} \; 2>/dev/null || true
find bootstrap/cache -type d -exec chmod 755 {} \; 2>/dev/null || true

echo "✅ Backend deployment completed!"

cd ..

# Frontend deployment
echo "🎨 Deploying React Frontend..."
cd frontend

# Check if Node.js and npm are available
if command -v node &> /dev/null && command -v npm &> /dev/null; then
    echo "🟢 Node.js version: $(node --version)"
    
    # Install/update npm dependencies
    npm ci --production || npm install
    
    # Build the frontend
    npm run build
    
    echo "✅ Frontend build completed!"
else
    echo "⚠️  Node.js/npm not available - frontend build skipped"
    echo "💡 You may need to build frontend locally and upload dist folder"
fi

# Create .htaccess for SPA routing in dist
echo "📝 Creating frontend .htaccess for SPA routing..."
cat > dist/.htaccess << 'HTACCESS'
# Enable RewriteEngine
RewriteEngine On

# Redirect Trailing Slashes
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)/$ /$1 [L,R=301]

# Handle Front Controller
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [L]

# Security Headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
</IfModule>
HTACCESS

echo "✅ Frontend deployment completed!"

cd ..

echo "🎉 Sakani deployment completed successfully!"
echo "📅 Deployed at: $(date)"
echo ""
echo "📍 Domain setup:"
echo "  1. Point your main domain document root to: frontend/dist"
echo "  2. Point api.{domain} subdomain to: backend/public"
echo "  3. Configure backend/.env with database credentials"