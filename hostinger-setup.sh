#!/bin/bash

# Hostinger Server Setup for Sakani
# This script is optimized for Hostinger hosting environments

set -e

echo "🏠 Setting up Sakani on Hostinger..."

# Detect hosting type
if [ -d "/public_html" ] || [ -d "public_html" ]; then
    PROJECT_PATH="$(pwd)/public_html/sakani"
    WEB_ROOT="public_html"
    HOSTING_TYPE="shared"
else
    PROJECT_PATH="/var/www/sakani"
    WEB_ROOT="/var/www"
    HOSTING_TYPE="vps"
fi

echo "📁 Detected hosting type: $HOSTING_TYPE"
echo "📂 Project path: $PROJECT_PATH"

# Create project directory
mkdir -p $PROJECT_PATH
cd $PROJECT_PATH

# Clone repository
echo "📥 Cloning Sakani repository..."
if [ ! -d ".git" ]; then
    git clone https://github.com/abdo-taher/sakani.git .
else
    git pull origin main
fi

# Backend setup
echo "🐘 Setting up Laravel backend..."
cd backend

# Check if composer is available
if command -v composer &> /dev/null; then
    composer install --optimize-autoloader --no-dev
else
    echo "⚠️  Composer not found. Installing..."
    curl -sS https://getcomposer.org/installer | php
    php composer.phar install --optimize-autoloader --no-dev
    alias composer='php composer.phar'
fi

# Setup environment
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "📝 Please edit backend/.env with your database credentials"
fi

# Generate application key
php artisan key:generate --force

# Set permissions (for shared hosting)
if [ "$HOSTING_TYPE" = "shared" ]; then
    chmod -R 755 storage bootstrap/cache
    find storage -type f -exec chmod 644 {} \;
    find bootstrap/cache -type f -exec chmod 644 {} \;
else
    # For VPS
    chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || chown -R $(whoami):$(whoami) storage bootstrap/cache
    chmod -R 775 storage bootstrap/cache
fi

# Frontend setup
echo "🎨 Setting up React frontend..."
cd ../frontend

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "Node.js version: $NODE_VERSION"
    
    # Install dependencies
    if command -v npm &> /dev/null; then
        npm install
        npm run build
    else
        echo "⚠️  npm not found. Please install Node.js and npm"
    fi
else
    echo "⚠️  Node.js not found. Please install Node.js 18+"
fi

# Create .htaccess for shared hosting
cd $PROJECT_PATH
if [ "$HOSTING_TYPE" = "shared" ]; then
    echo "📄 Creating .htaccess for shared hosting..."
    
    # Backend .htaccess
    cat > backend/public/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes If Not A Folder...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
EOF

    # Frontend .htaccess
    cat > frontend/dist/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Handle client-side routing
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
    
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
    </IfModule>
</IfModule>
EOF
fi

# Make deploy script executable
chmod +x deploy.sh

echo "✅ Hostinger setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Configure database in backend/.env"
echo "2. Run: cd backend && php artisan migrate --force"
echo "3. Set up your domain to point to:"
if [ "$HOSTING_TYPE" = "shared" ]; then
    echo "   - Backend API: $PROJECT_PATH/backend/public"
    echo "   - Frontend: $PROJECT_PATH/frontend/dist"
else
    echo "   - Configure your web server (Nginx/Apache)"
fi
echo "4. Add GitHub secrets for deployment"
echo ""
echo "🔗 Project location: $PROJECT_PATH"