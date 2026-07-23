#!/bin/bash

# Dynamic Environment Setup Script for Sakani Backend
# This script automatically configures the Laravel backend for any environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏗️  Setting up Sakani Backend - Dynamic Configuration${NC}"

# Function to detect environment
detect_environment() {
    if [ -n "$HOSTINGER_ENVIRONMENT" ]; then
        echo "hostinger"
    elif [ -n "$GITHUB_ACTIONS" ]; then
        echo "ci"
    elif [ "$(hostname)" = "localhost" ] || [ "$(hostname)" = "127.0.0.1" ]; then
        echo "local"
    elif [[ $(pwd) == *"/tmp/"* ]] || [[ $(pwd) == *"staging"* ]]; then
        echo "staging"
    else
        echo "production"
    fi
}

# Function to get current domain
get_current_domain() {
    local env="$1"
    
    case $env in
        "local")
            echo "localhost"
            ;;
        "hostinger"|"production")
            # Try to detect from HTTP_HOST or use default
            if [ -n "$HTTP_HOST" ]; then
                echo "$HTTP_HOST"
            else
                echo "sakani.site"
            fi
            ;;
        "staging")
            echo "staging.sakani.site"
            ;;
        *)
            echo "sakani.site"
            ;;
    esac
}

# Function to setup environment file
setup_env_file() {
    local env="$1"
    local domain="$2"
    
    echo -e "${YELLOW}📝 Setting up .env file for $env environment${NC}"
    
    # Copy from example if .env doesn't exist
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            echo -e "${GREEN}✅ Created .env from .env.example${NC}"
        else
            echo -e "${RED}❌ No .env.example found, creating basic .env${NC}"
            create_basic_env "$env" "$domain"
        fi
    fi
    
    # Update dynamic configuration based on environment
    update_env_for_environment "$env" "$domain"
}

# Function to create basic .env file
create_basic_env() {
    local env="$1"
    local domain="$2"
    
    cat > .env << EOF
APP_NAME=Sakani
APP_ENV=$env
APP_KEY=
APP_DEBUG=$([ "$env" = "local" ] && echo "true" || echo "false")
APP_TIMEZONE=UTC
APP_URL=https://$domain

APP_LOCALE=ar
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=ar_SA

DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
DB_FOREIGN_KEYS=true

CACHE_STORE=file
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

VITE_APP_NAME="\${APP_NAME}"

# Cloudinary Configuration
CLOUDINARY_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Dynamic Configuration
AUTO_DETECT_URLS=true
ENABLE_CORS_DYNAMIC=true
EOF
    
    echo -e "${GREEN}✅ Created basic .env file${NC}"
}

# Function to update .env for specific environment
update_env_for_environment() {
    local env="$1"
    local domain="$2"
    local api_url frontend_url
    
    case $env in
        "local")
            api_url="http://localhost:8000"
            frontend_url="http://localhost:3000"
            ;;
        "staging")
            api_url="https://api-staging.$domain"
            frontend_url="https://staging.$domain"
            ;;
        *)
            api_url="https://api.$domain"
            frontend_url="https://$domain"
            ;;
    esac
    
    # Update APP_URL
    sed -i.bak "s|^APP_URL=.*|APP_URL=$frontend_url|" .env
    
    # Update APP_ENV
    sed -i.bak "s|^APP_ENV=.*|APP_ENV=$env|" .env
    
    # Update debug setting
    local debug_setting=$([ "$env" = "local" ] && echo "true" || echo "false")
    sed -i.bak "s|^APP_DEBUG=.*|APP_DEBUG=$debug_setting|" .env
    
    # Add/update dynamic configuration
    if ! grep -q "AUTO_DETECT_URLS" .env; then
        echo "" >> .env
        echo "# Dynamic Configuration" >> .env
        echo "AUTO_DETECT_URLS=true" >> .env
        echo "ENABLE_CORS_DYNAMIC=true" >> .env
    fi
    
    # Remove backup file
    rm -f .env.bak
    
    echo -e "${GREEN}✅ Updated .env for $env environment${NC}"
    echo -e "   Frontend URL: $frontend_url"
    echo -e "   API URL: $api_url"
}

# Function to generate application key
generate_app_key() {
    echo -e "${YELLOW}🔑 Generating application key...${NC}"
    
    if command -v php >/dev/null 2>&1; then
        php artisan key:generate --force
        echo -e "${GREEN}✅ Application key generated${NC}"
    else
        echo -e "${RED}❌ PHP not found, skipping key generation${NC}"
    fi
}

# Function to setup database
setup_database() {
    local env="$1"
    
    echo -e "${YELLOW}🗄️  Setting up database...${NC}"
    
    # Create SQLite database file if it doesn't exist
    if [ ! -f "database/database.sqlite" ]; then
        touch database/database.sqlite
        echo -e "${GREEN}✅ Created SQLite database file${NC}"
    fi
    
    # Set proper permissions
    chmod 664 database/database.sqlite
    chmod 775 database/
    
    # Run migrations if PHP is available
    if command -v php >/dev/null 2>&1; then
        echo -e "${YELLOW}Running database migrations...${NC}"
        php artisan migrate --force
        
        # Seed database in local environment
        if [ "$env" = "local" ]; then
            echo -e "${YELLOW}Seeding database...${NC}"
            php artisan db:seed --force
        fi
        
        echo -e "${GREEN}✅ Database setup completed${NC}"
    else
        echo -e "${YELLOW}⚠️  PHP not found, skipping migrations${NC}"
        echo -e "   Run 'php artisan migrate --force' manually when PHP is available"
    fi
}

# Function to setup file permissions
setup_permissions() {
    local env="$1"
    
    echo -e "${YELLOW}🔐 Setting up file permissions...${NC}"
    
    # Create required directories
    mkdir -p storage/logs
    mkdir -p storage/framework/cache
    mkdir -p storage/framework/sessions
    mkdir -p storage/framework/views
    mkdir -p storage/app/public
    mkdir -p bootstrap/cache
    
    # Set permissions for shared hosting vs VPS
    if [[ "$env" == "hostinger" ]] || [[ $(id -u) != 0 ]]; then
        # Shared hosting permissions
        find storage -type f -exec chmod 644 {} \;
        find storage -type d -exec chmod 755 {} \;
        find bootstrap/cache -type f -exec chmod 644 {} \;
        find bootstrap/cache -type d -exec chmod 755 {} \;
        chmod 644 .env
    else
        # VPS permissions
        chown -R www-data:www-data storage bootstrap/cache
        chmod -R 755 storage bootstrap/cache
    fi
    
    echo -e "${GREEN}✅ File permissions set${NC}"
}

# Function to setup web server configuration
setup_web_config() {
    local env="$1"
    
    echo -e "${YELLOW}🌐 Setting up web server configuration...${NC}"
    
    # Create .htaccess for shared hosting
    if [[ "$env" == "hostinger" ]] || [[ ! -w /etc/ ]]; then
        setup_htaccess
    fi
    
    # Create symbolic link for public storage
    if command -v php >/dev/null 2>&1; then
        php artisan storage:link 2>/dev/null || echo -e "${YELLOW}⚠️  Storage link may already exist${NC}"
    fi
    
    echo -e "${GREEN}✅ Web server configuration completed${NC}"
}

# Function to create .htaccess file
setup_htaccess() {
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

# Security Headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Performance
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
</IfModule>
EOF

    echo -e "${GREEN}✅ Created .htaccess file${NC}"
}

# Function to optimize for production
optimize_for_production() {
    local env="$1"
    
    if [[ "$env" != "local" ]] && command -v php >/dev/null 2>&1; then
        echo -e "${YELLOW}⚡ Optimizing for production...${NC}"
        
        # Clear and cache configuration
        php artisan config:clear
        php artisan config:cache
        
        # Clear and cache routes
        php artisan route:clear
        php artisan route:cache
        
        # Clear and cache views
        php artisan view:clear
        php artisan view:cache
        
        echo -e "${GREEN}✅ Production optimization completed${NC}"
    fi
}

# Function to verify setup
verify_setup() {
    local env="$1"
    local domain="$2"
    
    echo -e "${YELLOW}🔍 Verifying setup...${NC}"
    
    local issues=0
    
    # Check .env file
    if [ ! -f .env ]; then
        echo -e "${RED}❌ .env file missing${NC}"
        issues=$((issues + 1))
    else
        echo -e "${GREEN}✅ .env file exists${NC}"
    fi
    
    # Check database
    if [ ! -f "database/database.sqlite" ]; then
        echo -e "${RED}❌ Database file missing${NC}"
        issues=$((issues + 1))
    else
        echo -e "${GREEN}✅ Database file exists${NC}"
    fi
    
    # Check storage permissions
    if [ ! -w "storage/logs" ]; then
        echo -e "${RED}❌ Storage directory not writable${NC}"
        issues=$((issues + 1))
    else
        echo -e "${GREEN}✅ Storage directory writable${NC}"
    fi
    
    # Check if PHP artisan works
    if command -v php >/dev/null 2>&1; then
        if php artisan --version >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Laravel Artisan working${NC}"
        else
            echo -e "${RED}❌ Laravel Artisan not working${NC}"
            issues=$((issues + 1))
        fi
    else
        echo -e "${YELLOW}⚠️  PHP not available for testing${NC}"
    fi
    
    echo -e "\n${BLUE}📋 Setup Summary:${NC}"
    echo -e "   Environment: $env"
    echo -e "   Domain: $domain"
    echo -e "   Issues found: $issues"
    
    if [ $issues -eq 0 ]; then
        echo -e "\n${GREEN}🎉 Setup completed successfully!${NC}"
        echo -e "\n${BLUE}Next steps:${NC}"
        echo -e "1. Configure your database credentials in .env (if not using SQLite)"
        echo -e "2. Set up Cloudinary credentials for file uploads"
        echo -e "3. Configure your web server to point to the 'public' directory"
        
        if [[ "$env" != "local" ]]; then
            echo -e "4. Set up SSL certificate for HTTPS"
            echo -e "5. Configure domain DNS records"
        fi
        
        return 0
    else
        echo -e "\n${RED}⚠️  Setup completed with issues. Please resolve the above problems.${NC}"
        return 1
    fi
}

# Main execution
main() {
    echo -e "${BLUE}Starting dynamic environment setup...${NC}"
    
    # Detect environment and domain
    local env=$(detect_environment)
    local domain=$(get_current_domain "$env")
    
    echo -e "${BLUE}Detected environment: $env${NC}"
    echo -e "${BLUE}Detected domain: $domain${NC}"
    
    # Run setup steps
    setup_env_file "$env" "$domain"
    generate_app_key
    setup_database "$env"
    setup_permissions "$env"
    setup_web_config "$env"
    optimize_for_production "$env"
    verify_setup "$env" "$domain"
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo -e "\n${GREEN}🚀 Dynamic setup completed successfully!${NC}"
        echo -e "\n${BLUE}Your Sakani backend is configured for:${NC}"
        echo -e "   Frontend URL: https://$domain"
        echo -e "   API URL: https://api.$domain"
        echo -e "   Environment: $env"
    else
        echo -e "\n${RED}❌ Setup completed with errors. Please check the issues above.${NC}"
    fi
    
    exit $exit_code
}

# Run main function
main "$@"