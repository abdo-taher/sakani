#!/bin/bash
# ====================================================================
# Sakani Frontend Production Build & Deployment Script
# ====================================================================

set -e

echo "🚀 [1/3] Building Sakani Production Frontend..."
cd frontend-new
npm run build

echo "📦 [2/3] Preparing Deployment Archive..."
cd dist
zip -q -r ../../sakani_frontend_production.zip .
cd ../..

echo "✅ [3/3] Deployment Archive Ready: sakani_frontend_production.zip"
echo ""
echo "🎉 Build finished successfully!"
echo "👉 You can now upload 'sakani_frontend_production.zip' and extract it in your web server root (e.g. public_html/)."
