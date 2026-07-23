#!/bin/bash

# Sakani Server Setup Script
# Run this script on your server to prepare it for deployment

set -e

echo "🔧 Setting up server for Sakani deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "🐘 Installing PHP and extensions..."
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:ondrej/php
sudo apt update
sudo apt install -y \
    php8.2 \
    php8.2-cli \
    php8.2-fpm \
    php8.2-mysql \
    php8.2-xml \
    php8.2-mbstring \
    php8.2-curl \
    php8.2-zip \
    php8.2-gd \
    php8.2-intl \
    php8.2-bcmath \
    php8.2-sqlite3 \
    nginx \
    mysql-server \
    git \
    curl \
    unzip

# Install Composer
echo "🎼 Installing Composer..."
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer

# Install Node.js and npm
echo "🟢 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Create project directory
PROJECT_DIR="/var/www/sakani"
echo "📁 Creating project directory: $PROJECT_DIR"
sudo mkdir -p $PROJECT_DIR
sudo chown -R $USER:$USER $PROJECT_DIR

# Clone the repository
echo "📥 Cloning repository..."
cd $PROJECT_DIR
git clone https://github.com/abdo-taher/sakani.git .

# Set up backend
echo "⚙️ Setting up Laravel backend..."
cd backend
cp .env.example .env

# Generate application key
php artisan key:generate

# Install dependencies
composer install --optimize-autoloader --no-dev

# Set proper permissions
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

# Set up frontend
echo "🎨 Setting up React frontend..."
cd ../frontend
npm install

# Build frontend
npm run build

# Create Nginx configuration
echo "🌐 Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/sakani > /dev/null <<EOF
server {
    listen 80;
    server_name YOUR_DOMAIN_HERE;
    root $PROJECT_DIR/backend/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}

# Frontend static files
server {
    listen 80;
    server_name frontend.YOUR_DOMAIN_HERE;
    root $PROJECT_DIR/frontend/dist;

    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/sakani /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart services
echo "🔄 Restarting services..."
sudo systemctl restart nginx
sudo systemctl restart php8.2-fpm

# Set up MySQL database (interactive)
echo "🗃️  Setting up MySQL database..."
echo "Please run the following commands in MySQL:"
echo "1. sudo mysql"
echo "2. CREATE DATABASE sakani;"
echo "3. CREATE USER 'sakani_user'@'localhost' IDENTIFIED BY 'your_secure_password';"
echo "4. GRANT ALL PRIVILEGES ON sakani.* TO 'sakani_user'@'localhost';"
echo "5. FLUSH PRIVILEGES;"
echo "6. EXIT;"

# Make deploy script executable
chmod +x $PROJECT_DIR/deploy.sh

echo "✅ Server setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update your domain name in /etc/nginx/sites-available/sakani"
echo "2. Set up SSL certificates (certbot recommended)"
echo "3. Configure database credentials in backend/.env"
echo "4. Run: php artisan migrate --force"
echo "5. Add GitHub secrets for deployment"
echo ""
echo "🔗 Repository: https://github.com/abdo-taher/sakani"
echo "📁 Project path: $PROJECT_DIR"