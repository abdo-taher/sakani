# 🌐 Sakani Domain Setup Guide

This guide explains exactly what domains you need to set up in Hostinger for your Sakani project.

## 📋 Required Domains Configuration

### Option 1: Subdomain Setup (Recommended) ⭐

Set up these **two subdomains** in Hostinger:

| Subdomain | Points To | Purpose |
|-----------|-----------|---------|
| `app.yourdomain.com` | `/public_html/sakani/frontend/dist` | React Frontend |
| `api.yourdomain.com` | `/public_html/sakani/backend/public` | Laravel API |

**Example with your domain:**
- If your domain is `sakani.com`:
  - Frontend: `app.sakani.com`  
  - API: `api.sakani.com`

### Option 2: Single Domain Setup

| Path | Points To | Purpose |
|------|-----------|---------|
| `yourdomain.com` | `/public_html/sakani/frontend/dist` | React Frontend |
| `yourdomain.com/api` | `/public_html/sakani/backend/public` | Laravel API |

## 🔧 Hostinger Configuration Steps

### Step 1: Access Hostinger Panel
1. Login to: https://hpanel.hostinger.com/
2. Go to **Hosting** → Select your plan → **Manage**

### Step 2: Create Subdomains (Option 1)

#### For Frontend (`app.yourdomain.com`):
1. Go to **Domains** → **Subdomains**
2. Click **Create Subdomain**
3. Enter: `app`
4. Set document root to: `/public_html/sakani/frontend/dist`
5. Click **Create**

#### For API (`api.yourdomain.com`):
1. Click **Create Subdomain** again
2. Enter: `api`
3. Set document root to: `/public_html/sakani/backend/public`
4. Click **Create**

### Step 3: SSL Certificates
1. Go to **Security** → **SSL/TLS**
2. Enable SSL for both subdomains:
   - `app.yourdomain.com`
   - `api.yourdomain.com`

## 📝 Environment Configuration

### Update Backend .env
SSH to your server and edit:
```bash
nano /public_html/sakani/backend/.env
```

Add these lines:
```env
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com
CORS_ALLOWED_ORIGINS=https://app.yourdomain.com

# Replace yourdomain.com with your actual domain
```

### Frontend Configuration (Automatic)
The frontend automatically detects your domain and configures:
- `api.yourdomain.com` → API calls
- `app.yourdomain.com` → Frontend URL

## 🧪 Testing Your Setup

### 1. Test API Health
Visit: `https://api.yourdomain.com/api/health`

Should return:
```json
{
  "status": "ok",
  "message": "Sakani API is running",
  "environment": "production"
}
```

### 2. Test Frontend
Visit: `https://app.yourdomain.com`

Should load the Sakani homepage.

### 3. Test API Connection
Open browser console on frontend and check for CORS errors.

## 🔍 DNS Propagation Check

After setting up domains, check DNS propagation:
1. Visit: https://www.whatsmydns.net/
2. Enter your subdomain: `app.yourdomain.com`
3. Wait for worldwide propagation (can take up to 48 hours)

## 🚨 Troubleshooting

### Problem: "CORS Error"
**Solution:**
1. Check `CORS_ALLOWED_ORIGINS` in backend `.env`
2. Ensure it matches your frontend domain exactly
3. Restart your server

### Problem: "API Not Found"
**Solution:**
1. Verify `api.yourdomain.com` points to `/public_html/sakani/backend/public`
2. Check `.htaccess` file exists in backend/public

### Problem: "Frontend Not Loading"
**Solution:**
1. Verify `app.yourdomain.com` points to `/public_html/sakani/frontend/dist`
2. Check if `npm run build` completed successfully

## ✅ Final Checklist

- [ ] Created `app.yourdomain.com` subdomain
- [ ] Created `api.yourdomain.com` subdomain  
- [ ] Enabled SSL for both subdomains
- [ ] Updated backend `.env` file
- [ ] Tested API health endpoint
- [ ] Tested frontend loading
- [ ] Verified no CORS errors

## 📞 Need Help?

1. **Hostinger Support**: 24/7 live chat
2. **GitHub Actions**: https://github.com/abdo-taher/sakani/actions
3. **Project Issues**: Create issue on GitHub repository

---

**Your domains should be:**
- **Frontend**: `https://app.yourdomain.com`
- **API**: `https://api.yourdomain.com`

Replace `yourdomain.com` with your actual domain name! 🎯