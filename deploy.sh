#!/bin/bash

set -e

echo "🚀 Sakani deployment starting..."
echo "📅 $(date)"

if [ ! -f "deploy.sh" ]; then
    echo "❌ Not in project root directory"
    exit 1
fi

# ── Backend ──────────────────────────────────────────────
echo ""
echo "━━━━ 📦 Backend ━━━━"
cd backend

# Dependencies
if [ -d "vendor" ]; then
    echo "✅ vendor/ exists — installing updates only"
    composer install --no-interaction --optimize-autoloader --no-scripts
else
    echo "📥 vendor/ missing — fresh install"
    composer update --no-interaction --optimize-autoloader --no-scripts
fi

# Bootstrap Laravel after install
php artisan package:discover --ansi 2>/dev/null || true

# .env
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    sed -i "s/APP_ENV=local/APP_ENV=production/" .env
    sed -i "s/APP_DEBUG=true/APP_DEBUG=false/" .env
    sed -i "s|APP_URL=http://localhost|APP_URL=https://api.sakani.site|" .env
fi

# APP_KEY
if grep -q "^APP_KEY=$" .env; then
    echo "🔑 Generating application key..."
    php artisan key:generate --force
fi

# SQLite database
DB_CONN=$(grep "^DB_CONNECTION=" .env | cut -d'=' -f2 | tr -d ' ')
if [ "$DB_CONN" = "sqlite" ]; then
    DB_PATH=$(grep "^DB_DATABASE=" .env | cut -d'=' -f2 | tr -d ' ')
    if [ -n "$DB_PATH" ] && [ ! -f "$DB_PATH" ]; then
        echo "🗄️  Creating SQLite database..."
        touch "$DB_PATH"
    fi
fi

# Migrations — always run
echo "🗄️  Running migrations..."
php artisan migrate --force

# Cache clear + rebuild (production optimization)
echo "⚡ Clearing and optimizing cache..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan event:clear

# For production, we skip config:cache to avoid closure serialization issues
# This is common in Laravel apps with dynamic configurations
echo "⚠️  Skipping config cache (using file-based config for compatibility)"

# Cache routes and views for performance
php artisan route:cache || echo "⚠️  Route cache skipped"
php artisan view:cache || echo "⚠️  View cache skipped"

# Permissions
echo "🔐 Setting permissions..."
find storage -type d -exec chmod 775 {} \; 2>/dev/null || true
find bootstrap/cache -type d -exec chmod 775 {} \; 2>/dev/null || true
find storage -type f -exec chmod 664 {} \; 2>/dev/null || true

echo "✅ Backend done"
cd ..

# ── Frontend ─────────────────────────────────────────────
echo ""
echo "━━━━ 🎨 Frontend ━━━━"
cd frontend

if command -v node &> /dev/null && command -v npm &> /dev/null; then
    echo "🟢 Node.js: $(node --version)"

    if [ -d "node_modules" ]; then
        echo "✅ node_modules/ exists — npm ci only"
        npm ci || npm install
    else
        echo "📥 node_modules/ missing — fresh install"
        npm install
    fi

    echo "🏗️  Building frontend..."
    npm run build
    
    # Create .htaccess for SPA routing (only if build succeeded)
    if [ -d "dist" ]; then
        echo "📝 Creating .htaccess for SPA routing..."
        cat > dist/.htaccess << 'HTACCESS'
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)/$ /$1 [L,R=301]
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [L]
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/* "access plus 1 year"
    ExpiresByType font/* "access plus 1 year"
</IfModule>
HTACCESS
        echo "✅ Frontend built successfully"
    else
        echo "❌ Frontend build failed - dist directory not created"
    fi
else
    echo "⚠️  Node.js not available on server"
    echo "💡 Frontend will be built by GitHub Actions and uploaded"
    
    # Create a placeholder message if no dist exists
    if [ ! -d "dist" ]; then
        mkdir -p dist
        cat > dist/index.html << 'HTML'
<!DOCTYPE html>
<html>
<head>
    <title>Sakani - Deployment in Progress</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
        .loading { color: #6F4E37; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏠 Sakani</h1>
        <p class="loading">Frontend deployment in progress...</p>
        <p>The application is being deployed. Please check back in a few minutes.</p>
    </div>
</body>
</html>
HTML
        echo "📝 Created temporary frontend placeholder"
    fi
fi

echo "✅ Frontend done"
cd ..

echo ""
echo "━━━━ ✅ Deployment complete ━━━━"
echo "📅 $(date)"
