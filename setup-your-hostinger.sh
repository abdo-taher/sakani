#!/bin/bash

# Sakani Setup Script for Your Hostinger Server
# Server: 92.113.28.185:65002
# Username: u467678620

set -e

echo "🏠 Setting up Sakani on your Hostinger server..."
echo "📊 Server: 92.113.28.185:65002"
echo "👤 User: u467678620"

# Check current directory and navigate to public_html
if [ -d "public_html" ]; then
    cd public_html
elif [ -d "/home/u467678620/public_html" ]; then
    cd /home/u467678620/public_html
else
    echo "📁 Creating public_html directory..."
    mkdir -p public_html
    cd public_html
fi

PROJECT_PATH=$(pwd)/sakani
echo "📂 Project will be installed at: $PROJECT_PATH"

# Create sakani directory
mkdir -p sakani
cd sakani

# Clone or update repository
if [ -d ".git" ]; then
    echo "📥 Updating existing repository..."
    git pull origin main
else
    echo "📥 Cloning Sakani repository..."
    git clone https://github.com/abdo-taher/sakani.git .
fi

# Setup backend
echo "🐘 Setting up Laravel backend..."
cd backend

# Check PHP version
PHP_VERSION=$(php -v | head -n 1)
echo "🐘 PHP Version: $PHP_VERSION"

# Install composer dependencies
if [ -f "composer.phar" ]; then
    php composer.phar install --optimize-autoloader --no-dev
elif command -v composer &> /dev/null; then
    composer install --optimize-autoloader --no-dev
else
    echo "📦 Installing Composer..."
    curl -sS https://getcomposer.org/installer | php
    php composer.phar install --optimize-autoloader --no-dev
fi

# Setup environment file
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✏️  Created .env file - needs configuration"
    
    # Generate application key
    php artisan key:generate --force
    
    echo "📝 Please configure these in .env:"
    echo "   - Database credentials"
    echo "   - Cloudinary settings"
    echo "   - APP_URL"
fi

# Set proper permissions for shared hosting
echo "🔐 Setting file permissions..."
find storage -type f -exec chmod 644 {} \;
find storage -type d -exec chmod 755 {} \;
find bootstrap/cache -type f -exec chmod 644 {} \; 2>/dev/null || true
find bootstrap/cache -type d -exec chmod 755 {} \; 2>/dev/null || true

# Create .htaccess for backend
mkdir -p public
cat > public/.htaccess << 'EOF'
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

# Setup frontend
echo "🎨 Setting up React frontend..."
cd ../frontend

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "🟢 Node.js version: $NODE_VERSION"
    
    # Install dependencies
    npm install
    
    # Build production version
    echo "🏗️  Building production frontend..."
    npm run build
    
    # Create .htaccess for frontend
    cat > dist/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Handle client-side routing
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
    
    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    
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
else
    echo "⚠️  Node.js not found. You'll need to build frontend locally or install Node.js"
fi

# Make deploy script executable
cd ..
chmod +x deploy.sh

# Create database configuration helper
cat > configure-database.sh << 'EOF'
#!/bin/bash
echo "🗄️  Database Configuration Helper"
echo "================================"
echo ""
echo "1. Go to Hostinger Panel: https://hpanel.hostinger.com/"
echo "2. Navigate to: Databases → MySQL Databases"
echo "3. Create database: u467678620_sakani"
echo "4. Create user: u467678620_sakani_user"
echo "5. Set a secure password"
echo "6. Assign user to database with ALL PRIVILEGES"
echo ""
echo "Then update backend/.env with:"
echo "DB_HOST=localhost"
echo "DB_PORT=3306"
echo "DB_DATABASE=u467678620_sakani"
echo "DB_USERNAME=u467678620_sakani_user"
echo "DB_PASSWORD=your_database_password"
EOF

chmod +x configure-database.sh

echo ""
echo "✅ Sakani setup completed!"
echo ""
echo "📍 Installation Details:"
echo "   📂 Project Path: $PROJECT_PATH"
echo "   🌐 Backend API: $PROJECT_PATH/backend/public"
echo "   🎨 Frontend: $PROJECT_PATH/frontend/dist"
echo ""
echo "📋 Next Steps:"
echo "1. Run: ./configure-database.sh (for database setup guide)"
echo "2. Edit: backend/.env (database and other settings)"
echo "3. Run: cd backend && php artisan migrate --force"
echo "4. Configure your domain/subdomain to point to the folders above"
echo ""
echo "🔗 GitHub Repository: https://github.com/abdo-taher/sakani"