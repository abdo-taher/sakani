<?php
// Hostinger Laravel Setup Script
echo "<h2>Sakani Laravel Setup</h2>";

// Change to backend directory
chdir('backend');
echo "<p>✅ Changed to backend directory</p>";

// Check PHP version
echo "<p>🐘 PHP Version: " . phpversion() . "</p>";

// Install Composer if not available
if (!file_exists('composer.phar')) {
    echo "<p>📦 Installing Composer...</p>";
    copy('https://getcomposer.org/installer', 'composer-setup.php');
    system('php composer-setup.php');
    unlink('composer-setup.php');
} else {
    echo "<p>✅ Composer already available</p>";
}

// Update dependencies
echo "<p>📥 Installing Laravel 11 dependencies...</p>";
system('php composer.phar update --optimize-autoloader --no-dev 2>&1', $return_var);

if ($return_var === 0) {
    echo "<p>✅ Dependencies installed successfully!</p>";
} else {
    echo "<p>❌ Dependency installation failed</p>";
}

// Set up environment
if (!file_exists('.env')) {
    copy('.env.example', '.env');
    echo "<p>✅ Created .env file</p>";
    
    // Generate app key
    system('php artisan key:generate --force 2>&1', $key_result);
    if ($key_result === 0) {
        echo "<p>✅ Application key generated</p>";
    }
} else {
    echo "<p>✅ .env file already exists</p>";
}

// Set permissions
system('find storage -type f -exec chmod 644 {} \; 2>/dev/null');
system('find storage -type d -exec chmod 755 {} \; 2>/dev/null');
system('find bootstrap/cache -type f -exec chmod 644 {} \; 2>/dev/null');
system('find bootstrap/cache -type d -exec chmod 755 {} \; 2>/dev/null');
echo "<p>✅ File permissions set</p>";

echo "<h3>🎉 Setup Complete!</h3>";
echo "<p><strong>Next Steps:</strong></p>";
echo "<ul>";
echo "<li>Configure database credentials in backend/.env</li>";
echo "<li>Set up your domain to point to backend/public</li>";
echo "<li>Run database migrations</li>";
echo "</ul>";

// Clean up - remove this script after first run
if (isset($_GET['cleanup'])) {
    unlink(__FILE__);
    echo "<p>🧹 Setup script removed</p>";
}

echo "<p><a href='?cleanup=1'>🧹 Remove this setup script</a></p>";
?>