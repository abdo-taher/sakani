#!/bin/bash

# Sakani Project Deployment Script for Hostinger
# Fully automated production deployment

set -e

echo "🚀 Starting Sakani deployment..."
echo "📍 Current directory: $(pwd)"
echo "📅 Deployment time: $(date)"

if [ ! -f "deploy.sh" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

# ── Backend ──────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Deploying Laravel Backend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd backend

# Install composer dependencies
echo "🔧 Installing composer dependencies..."
rm -f composer.lock
rm -rf vendor/
composer update --optimize-autoloader --no-interaction --no-audit

# Create .env if not exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    sed -i "s/APP_ENV=local/APP_ENV=production/" .env
    sed -i "s/APP_DEBUG=true/APP_DEBUG=false/" .env
    sed -i "s|APP_URL=http://localhost|APP_URL=https://api.sakani.site|" .env
    sed -i "s/APP_KEY=/APP_KEY=/" .env
fi

# Generate APP_KEY if empty
if grep -q "^APP_KEY=$" .env; then
    echo "🔑 Generating application key..."
    php artisan key:generate --force
fi

# Create SQLite database if using sqlite
DB_CONN=$(grep "^DB_CONNECTION=" .env | cut -d'=' -f2 | tr -d ' ')
if [ "$DB_CONN" = "sqlite" ]; then
    DB_PATH=$(grep "^DB_DATABASE=" .env | cut -d'=' -f2 | tr -d ' ')
    if [ -n "$DB_PATH" ] && [ ! -f "$DB_PATH" ]; then
        echo "🗄️  Creating SQLite database: $DB_PATH"
        touch "$DB_PATH"
    fi
fi

# Run migrations
echo "🗄️  Running database migrations..."
php artisan migrate --force

# Cache everything
echo "⚡ Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Set permissions for shared hosting
echo "🔐 Setting file permissions..."
find storage -type f -exec chmod 644 {} \; 2>/dev/null || true
find storage -type d -exec chmod 755 {} \; 2>/dev/null || true
find bootstrap/cache -type f -exec chmod 644 {} \; 2>/dev/null || true
find bootstrap/cache -type d -exec chmod 755 {} \; 2>/dev/null || true
chmod -R 775 storage/ 2>/dev/null || true
chmod -R 775 bootstrap/cache/ 2>/dev/null || true

echo "✅ Backend deployment completed!"

cd ..

# ── Frontend ─────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 Deploying React Frontend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd frontend

if command -v node &> /dev/null && command -v npm &> /dev/null; then
    echo "🟢 Node.js version: $(node --version)"
    npm ci || npm install
    npm run build
    echo "✅ Frontend build completed!"
else
    echo "⚠️  Node.js/npm not available - frontend build skipped"
fi

# Create .htaccess for SPA routing
cat > dist/.htaccess << 'HTACCESS'
RewriteEngine On

# Redirect Trailing Slashes
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)/$ /$1 [L,R=301]

# Handle Front Controller (SPA routing)
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

cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment completed at $(date)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Domain setup on Hostinger:"
echo "  Main domain    → public_html/sakani/frontend/dist"
echo "  api subdomain  → public_html/sakani/backend/public"
