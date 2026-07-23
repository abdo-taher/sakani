#!/bin/bash

# Frontend deployment script
echo "🚀 Deploying frontend to Laravel backend..."

# Navigate to frontend directory
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Build the frontend
echo "🔨 Building frontend..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed! No dist directory found."
    exit 1
fi

# Navigate back to root
cd ..

# Remove old frontend files from Laravel public directory (except Laravel files)
echo "🧹 Cleaning old frontend files..."
find backend/public -name "*.js" -delete
find backend/public -name "*.css" -delete
find backend/public -name "*.html" -not -name "index.php" -delete
rm -rf backend/public/assets

# Copy new build files to Laravel public directory
echo "📋 Copying new frontend files..."
cp -r frontend/dist/* backend/public/

# Set proper permissions
chmod -R 755 backend/public

echo "✅ Frontend deployed successfully!"
echo "🌐 Your app should now serve the frontend through Laravel"