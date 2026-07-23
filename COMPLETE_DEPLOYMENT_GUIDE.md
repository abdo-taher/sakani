# 🚀 Complete Sakani Deployment Guide

## 📋 Overview

Your Sakani real estate platform is ready for deployment to Hostinger. This guide provides the complete manual deployment process since automated SSH deployment was experiencing connection issues.

## 🎯 What You Need to Set Up

### Domain Configuration
You need to create **2 subdomains** in Hostinger:

| Subdomain | Purpose | Points To |
|-----------|---------|-----------|
| `api.yourdomain.com` | Laravel Backend API | `/public_html/sakani/backend/public` |
| `app.yourdomain.com` | React Frontend | `/public_html/sakani/frontend/dist` |

**Replace `yourdomain.com` with your actual domain!**

## 📦 Step 1: Deploy Files

### Option A: Use Ready Package (Recommended)
1. Download `sakani-deployment.zip` from your project
2. Go to Hostinger File Manager: https://hpanel.hostinger.com/
3. Navigate to `public_html`
4. Upload and extract `sakani-deployment.zip`
5. Move contents to create this structure:

```
public_html/
└── sakani/
    ├── backend/          ← Complete Laravel backend
    └── frontend/dist/    ← Built React frontend
```

### Option B: Upload Separately
1. Upload entire `backend/` folder to `public_html/sakani/backend/`
2. Upload contents of `frontend/dist/` to `public_html/sakani/frontend/dist/`

## 🌐 Step 2: Configure Domains in Hostinger

### Create Subdomains:
1. Login to Hostinger Panel: https://hpanel.hostinger.com/
2. Go to **Domains** → **Subdomains**

#### For API (Backend):
- **Subdomain**: `api`
- **Document Root**: `/public_html/sakani/backend/public`
- **SSL**: Enable after creation

#### For Frontend:
- **Subdomain**: `app`  
- **Document Root**: `/public_html/sakani/frontend/dist`
- **SSL**: Enable after creation

## 🗄️ Step 3: Set Up Database

### Using Hostinger Terminal:
1. Go to **Advanced** → **SSH Access**
2. Open terminal and run:
```bash
cd public_html/sakani/backend

# Install dependencies
composer install --no-dev --optimize-autoloader

# Setup environment
cp .env.example .env
php artisan key:generate

# Run migrations
php artisan migrate --force

# Set permissions
chmod -R 755 storage bootstrap/cache
```

### Edit .env Configuration:
Update your `backend/.env` file with:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://app.yourdomain.com

# Database (get credentials from Hostinger Database section)
DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=u467670620_sakani
DB_USERNAME=u467670620_sakani
DB_PASSWORD=your_database_password
```

## 🧪 Step 4: Test Your Deployment

### Test Backend API:
Visit: `https://api.yourdomain.com/api/health`

Expected response:
```json
{
  "status": "ok",
  "message": "Sakani API is running"
}
```

### Test Frontend:
Visit: `https://app.yourdomain.com`

Should load your Sakani homepage with property listings.

### Test API Connection:
1. Open frontend in browser
2. Open Developer Tools (F12) → Console
3. Check for any CORS or API connection errors
4. Try creating a test property or browsing listings

## 🔧 Step 5: Production Optimization

Run these commands in your backend directory via SSH:
```bash
# Cache configuration for better performance
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Clear any old cache
php artisan cache:clear
```

## ✅ Final Checklist

- [ ] `sakani-deployment.zip` uploaded and extracted
- [ ] `api.yourdomain.com` subdomain created → `/public_html/sakani/backend/public`
- [ ] `app.yourdomain.com` subdomain created → `/public_html/sakani/frontend/dist`
- [ ] SSL certificates enabled for both subdomains
- [ ] Database created in Hostinger
- [ ] `.env` file configured with production settings
- [ ] Migrations executed successfully
- [ ] File permissions set correctly
- [ ] API health endpoint returns success
- [ ] Frontend loads without errors
- [ ] No CORS errors in browser console

## 🎯 Your Live URLs

After completion, your Sakani platform will be live at:

- **🏠 Frontend**: `https://app.yourdomain.com`
- **🔧 API**: `https://api.yourdomain.com`
- **📊 API Health**: `https://api.yourdomain.com/api/health`

## 🆘 Troubleshooting

### CORS Errors
- Verify `CORS_ALLOWED_ORIGINS` in `.env` matches your frontend domain exactly
- Clear cache: `php artisan config:clear`

### API Not Found (404)
- Check subdomain points to `/public_html/sakani/backend/public` (not just `/backend`)
- Verify `.htaccess` exists in `backend/public/`

### Frontend Not Loading
- Check subdomain points to `/public_html/sakani/frontend/dist`
- Verify `index.html` exists in the dist folder

### Database Connection Issues
- Get correct database credentials from Hostinger **Databases** section
- Test connection: `php artisan migrate:status`

## 📞 Support

- **Hostinger Support**: 24/7 live chat in your panel
- **Project Repository**: https://github.com/abdo-taher/sakani
- **Documentation**: Check README.md for API endpoints

---

**🎉 Success!** Your Sakani real estate platform is now live and ready for users to browse and list properties!