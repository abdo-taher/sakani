# Hostinger Deployment Guide for Sakani

This guide covers deploying the Sakani project specifically on Hostinger hosting.

## 🏠 Hostinger Account Setup

### 1. **Access Your Hostinger Panel**
- Login to: https://hpanel.hostinger.com/
- Go to **Hosting** → Select your plan → **Manage**

### 2. **Get Your Server Information**

#### For Shared Hosting:
- **Host**: Found in **Overview** section
- **Username**: Your hosting username (e.g., `u123456789`)
- **Password**: Your hosting password
- **SSH Access**: Go to **Advanced** → **SSH Access**

#### For VPS Hosting:
- **IP Address**: In **Overview** section
- **Root Password**: Set during VPS setup
- **SSH Port**: Usually `22`

### 3. **Enable SSH Access**
- In Hostinger panel: **Advanced** → **SSH Access**
- Click **Enable SSH Access**
- Note the SSH details provided

## 🔑 SSH Key Setup for Hostinger

### Step 1: Generate SSH Key (if needed)
```bash
# On your local machine
ssh-keygen -t ed25519 -C "sakani-hostinger"
```

### Step 2: Add Public Key to Hostinger
```bash
# Copy your public key
cat ~/.ssh/id_ed25519.pub
```

#### For Shared Hosting:
- Hostinger Panel → **Advanced** → **SSH Access**
- Click **Manage SSH Keys** → **Add New**
- Paste your public key

#### For VPS:
- SSH to your server and add the key:
```bash
ssh username@your-hostinger-ip
mkdir -p ~/.ssh
echo "YOUR_PUBLIC_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## 📁 Hostinger File Structure

### Shared Hosting Structure:
```
/home/u123456789/
├── public_html/          # Your website root
├── logs/
├── mail/
└── domains/
```

### VPS Structure:
```
/var/www/
├── html/                 # Default web root
└── your-domain/          # Custom domain folder
```

## 🚀 Quick Deployment

### Method 1: Using Hostinger File Manager
1. **Download Project**:
   ```bash
   # On your local machine
   git clone https://github.com/abdo-taher/sakani.git
   zip -r sakani.zip sakani/
   ```

2. **Upload via File Manager**:
   - Hostinger Panel → **Advanced** → **File Manager**
   - Upload `sakani.zip` to `public_html`
   - Extract the zip file

### Method 2: Using SSH (Recommended)
```bash
# SSH to your Hostinger server
ssh u123456789@your-server.hostinger.com

# Navigate to web directory
cd public_html

# Clone the repository
git clone https://github.com/abdo-taher/sakani.git

# Run setup script
cd sakani
chmod +x hostinger-setup.sh
./hostinger-setup.sh
```

## ⚙️ Configuration for Hostinger

### 1. **Database Setup**
- Hostinger Panel → **Databases** → **MySQL Databases**
- Create new database: `u123456789_sakani`
- Create database user with password
- Note the database details

### 2. **Environment Configuration**
```bash
# Edit backend environment
cd public_html/sakani/backend
nano .env
```

Update these values for Hostinger:
```env
APP_URL=https://yourdomain.com
APP_ENV=production
APP_DEBUG=false

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=u123456789_sakani
DB_USERNAME=u123456789_sakani_user
DB_PASSWORD=your_database_password

# Hostinger-specific paths
SESSION_DRIVER=file
CACHE_DRIVER=file
QUEUE_CONNECTION=sync
```

### 3. **Run Database Migration**
```bash
cd backend
php artisan migrate --force
php artisan db:seed --force
```

## 🌐 Domain Configuration

### Subdomain Setup (Recommended):
Create these subdomains in Hostinger:
- `api.yourdomain.com` → Points to `/public_html/sakani/backend/public`
- `app.yourdomain.com` → Points to `/public_html/sakani/frontend/dist`

### Single Domain Setup:
- Main domain → Points to `/public_html/sakani/frontend/dist`
- Create `.htaccess` to handle API routes

## 📋 GitHub Secrets for Hostinger

Add these secrets to your GitHub repository:

| Secret Name | Hostinger Value | Example |
|-------------|-----------------|---------|
| `HOST` | Server hostname | `srv123456.hstgr.cloud` |
| `USERNAME` | SSH username | `u123456789` |
| `SSH_KEY` | Private key content | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PORT` | SSH port | `22` |
| `PROJECT_PATH` | Full project path | `/home/u123456789/public_html/sakani` |

### Finding Your Hostinger Server Details:
1. **SSH Hostname**: In SSH Access section
2. **Username**: Your hosting username
3. **Path**: Usually `/home/USERNAME/public_html/sakani`

## 🔧 Hostinger-Specific Deploy Script

The project includes `hostinger-setup.sh` which:
- Detects shared vs VPS hosting
- Sets appropriate permissions
- Creates `.htaccess` files for shared hosting
- Configures file paths correctly

## 📊 Monitoring Deployment

### GitHub Actions:
- Monitor at: https://github.com/abdo-taher/sakani/actions

### Hostinger Logs:
- **Error Logs**: Hostinger Panel → **Advanced** → **Error Logs**
- **Access Logs**: Monitor traffic and requests

## 🐛 Troubleshooting Hostinger Issues

### Common Problems:

1. **Permission Errors**:
   ```bash
   chmod -R 755 storage bootstrap/cache
   find storage -type f -exec chmod 644 {} \;
   ```

2. **PHP Version**:
   - Hostinger Panel → **Advanced** → **PHP Configuration**
   - Set PHP version to 8.1 or 8.2

3. **Memory Limits**:
   - Add to `.htaccess`:
   ```apache
   php_value memory_limit 256M
   php_value upload_max_filesize 64M
   php_value post_max_size 64M
   ```

4. **Database Connection**:
   - Verify database name format: `u123456789_dbname`
   - Check if database user has proper permissions

5. **File Upload Issues**:
   ```bash
   # Check storage permissions
   ls -la storage/
   chmod -R 755 storage/app/public
   ```

### Getting Help:
- **Hostinger Support**: Available 24/7 via live chat
- **Error Logs**: Check Hostinger error logs for specific issues
- **GitHub Issues**: Report deployment-specific problems

## ✅ Verification Checklist

After deployment, verify:

- [ ] Backend API accessible: `https://yourdomain.com/api/health`
- [ ] Frontend loads: `https://yourdomain.com`
- [ ] Database connected (check logs)
- [ ] File uploads work
- [ ] Admin panel accessible
- [ ] GitHub Actions deployment successful

## 💡 Hostinger Tips

1. **Use Cloudflare**: Enable Cloudflare for better performance
2. **Regular Backups**: Use Hostinger's backup feature
3. **Monitor Resources**: Check CPU/memory usage in panel
4. **Update PHP**: Keep PHP version updated
5. **SSL Certificate**: Enable SSL in Hostinger panel

Your Sakani project is now ready for Hostinger deployment! 🎉