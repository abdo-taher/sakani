#!/bin/bash

# Clean Composer Setup Script for Hostinger
echo "🔧 Setting up Laravel dependencies for PHP 8.2..."

# Remove any existing lock file and vendor directory
rm -f composer.lock
rm -rf vendor/

# Check PHP version
php --version

# Install composer if not available
if ! command -v composer &> /dev/null; then
    echo "📦 Installing Composer..."
    curl -sS https://getcomposer.org/installer | php
    COMPOSER_CMD="php composer.phar"
else
    COMPOSER_CMD="composer"
fi

# Update dependencies
echo "📥 Installing Laravel 11 dependencies..."
$COMPOSER_CMD update --optimize-autoloader --no-dev --no-interaction

echo "✅ Dependencies installed successfully!"
echo "📋 Installed packages:"
$COMPOSER_CMD show --installed | head -10