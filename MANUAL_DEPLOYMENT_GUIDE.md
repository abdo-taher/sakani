# 📁 Manual Deployment Guide for Hostinger

Since GitHub Actions SSH deployment keeps failing with timeout errors, here's the complete manual deployment solution:

## 🎯 Step 1: Use Existing Deployment Package

### ✅ Ready-to-Deploy Package
You already have `sakani-deployment.zip` in your project root containing:
- Complete backend with all dependencies
- Built frontend (`dist/` folder)
- All necessary configuration files

### Alternative: Create Fresh Package
If you need to update the package:
```bash
# Build frontend first
cd frontend && npm run build && cd ..

# Create deployment package
zip -r sakani-deployment.zip \
  backend/ \
  frontend/dist/ \
  deploy.sh \
  README.md \
  -x "backend/node_modules/*" \
  -x "backend/.git/*" \
  -x "*/.env"
```

## 🔧 Step 2: Upload to Hostinger via File Manager

### Access Hostinger File Manager:
1. Go to: https://hpanel.hostinger.com/
2. Login with your credentials
3. Go to **File Manager**

### Upload and Extract:
1. **Upload**: Upload `sakani-deployment.zip` to your `public_html` directory
2. **Extract**: Right-click on the zip file → **Extract**
3. **Move**: Move extracted contents to create this structure:

```
public_html/
└── sakani/
    ├── backend/          ← Complete Laravel backend
    │   ├── app/
    │   ├── config/
    │   ├── database/
    │   ├── public/       ← This will be your API endpoint
    │   └── .env.example
    └── frontend/
        └── dist/         ← Built React frontend
            ├── index.html
            ├── assets/
            └── .htaccess
```

### Important: File Permissions
After upload, set these permissions in File Manager:
- `backend/storage/` → 755 (recursive)
- `backend/bootstrap/cache/` → 755 (recursive)
- `deploy.sh` → 755

## 🗄️ Step 3: Set Up Database

### Option A: Using Hostinger Terminal (Recommended)
1. Go to **Advanced** → **SSH Access** in Hostinger
2. Open terminal and run:
   ```bash
   cd public_html/sakani/backend
   composer install --no-dev --optimize-autoloader
   cp .env.example .env
   php artisan key:generate
   php artisan migrate --force
   ```

### Option B: Using File Manager
1. Copy `backend/.env.example` to `backend/.env`
2. Edit `.env` file with your database details
3. Use Hostinger's **Database** section to create a database

## 🌐 Step 4: Configure Domain

### Create Subdomains in Hostinger:
1. **Go to**: Domains → Subdomains
2. **Create**:
   - `api.yourdomain.com` → Points to `/public_html/sakani/backend/public`
   - `app.yourdomain.com` → Points to `/public_html/sakani/frontend/dist`

### Update Backend Configuration:
Edit `backend/.env` file:
```env
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com
CORS_ALLOWED_ORIGINS=https://app.yourdomain.com

# Database settings (get from Hostinger Database section)
DB_HOST=localhost
DB_DATABASE=u467670620_sakani
DB_USERNAME=u467670620_sakani
DB_PASSWORD=your_db_password
```

## ✅ Step 5: Test Your Application

### Test API:
Visit: `https://api.yourdomain.com/api/health`

Should return:
```json
{
  "status": "ok",
  "message": "Sakani API is running"
}
```

### Test Frontend:
Visit: `https://app.yourdomain.com`

Should load your Sakani homepage.

## 🚀 Quick Deployment Commands

If you have terminal access, run these in order:

```bash
# Navigate to backend
cd public_html/sakani/backend

# Install dependencies
composer install --no-dev

# Setup environment
cp .env.example .env
php artisan key:generate

# Run migrations
php artisan migrate --force

# Optimize for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
chmod -R 755 storage bootstrap/cache
```

## 📞 Need Help?

If you need assistance:
1. **Hostinger Support**: 24/7 chat support
2. **File Upload Issues**: Use Hostinger's File Manager upload feature
3. **Database Issues**: Check Hostinger's Database section for credentials

---

**🎯 Result**: After completing these steps, your Sakani platform will be live at:
- **Frontend**: `https://app.yourdomain.com`
- **API**: `https://api.yourdomain.com`