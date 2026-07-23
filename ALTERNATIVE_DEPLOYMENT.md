# 🚀 Alternative Deployment Methods for Hostinger

If SSH continues to have connection issues, here are alternative deployment methods:

## 🔧 Method 1: FTP Deployment

### Step 1: Get FTP Details from Hostinger
1. Go to Hostinger Panel → File Manager
2. Look for FTP credentials (usually shown in File Manager section)
3. Note: FTP Host, Username, Password

### Step 2: Update GitHub Workflow for FTP
Replace the SSH action with FTP upload action in `.github/workflows/deploy.yml`.

## 🔧 Method 2: Manual Deployment via File Manager

### Step 1: Download Built Files
1. Go to GitHub Actions: https://github.com/abdo-taher/sakani/actions
2. Click on successful workflow run
3. Download artifacts (built frontend files)

### Step 2: Upload via Hostinger File Manager
1. Go to Hostinger Panel → File Manager
2. Navigate to `public_html` directory
3. Create `sakani` folder
4. Upload backend and frontend files manually

## 🔧 Method 3: Fix SSH Connection

### Common Hostinger SSH Issues:

1. **Wrong Directory Structure**
   - Some Hostinger accounts use `domains/yourdomain.com/public_html`
   - Others use direct `public_html`

2. **SSH Not Fully Enabled**
   - Go back to SSH Access in Hostinger
   - Make sure it shows "Active" status
   - Try resetting SSH password

3. **Firewall Issues**
   - Contact Hostinger support to allow GitHub Actions IPs
   - IPs range: `192.30.252.0/22`, `185.199.108.0/22`, `140.82.112.0/20`

### Test SSH Manually
Try connecting from your computer:
```bash
ssh -p 65002 u467670620@92.118.28.183
```

If this works, then the issue is with GitHub Actions connectivity.

## 🔧 Method 4: Simplified Manual Process

### Quick Manual Deployment:
1. **Backend**: Upload `backend/` folder to `public_html/sakani/backend/`
2. **Frontend**: Build locally and upload `dist/` to `public_html/sakani/frontend/dist/`
3. **Database**: Run migrations via Hostinger's phpMyAdmin or terminal

### Commands to run in Hostinger terminal:
```bash
cd public_html/sakani/backend
composer install --no-dev
php artisan migrate --force
php artisan config:cache
```

---

**Next Steps**: 
1. Try the updated SSH workflow first
2. If it still fails, we'll switch to FTP deployment
3. As last resort, use manual file upload method