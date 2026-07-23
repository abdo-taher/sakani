# Deployment Setup Guide

This guide will help you set up automated deployment for the Sakani project.

## 📋 Prerequisites

- A server with Ubuntu 20.04+ or similar Linux distribution
- SSH access to your server
- A domain name (optional but recommended)
- GitHub account

## 🖥️ Server Setup

### 1. Run the Server Setup Script

Copy the `server-setup.sh` script to your server and run it:

```bash
# On your server
wget https://raw.githubusercontent.com/abdo-taher/sakani/main/server-setup.sh
chmod +x server-setup.sh
sudo ./server-setup.sh
```

### 2. Configure Database

```bash
# Login to MySQL
sudo mysql

# Create database and user
CREATE DATABASE sakani;
CREATE USER 'sakani_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON sakani.* TO 'sakani_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Configure Environment

```bash
# Copy environment file
cd /var/www/sakani/backend
cp .env.example .env

# Edit with your settings
nano .env
```

Update these important settings in `.env`:
- `APP_URL`: Your domain
- `DB_PASSWORD`: The password you set above
- `CLOUDINARY_*`: Your Cloudinary credentials
- `FRONTEND_URL`: Your frontend domain

### 4. Run Initial Migration

```bash
cd /var/www/sakani/backend
php artisan migrate --force
php artisan db:seed --force
```

## 🔐 GitHub Secrets Configuration

Go to your GitHub repository: https://github.com/abdo-taher/sakani

Navigate to: **Settings** → **Secrets and variables** → **Actions**

Add these repository secrets:

### Required Secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `HOST` | Server IP address | `192.168.1.100` |
| `USERNAME` | SSH username | `ubuntu` or `root` |
| `SSH_KEY` | Private SSH key | Content of `~/.ssh/id_rsa` |
| `PORT` | SSH port | `22` |
| `PROJECT_PATH` | Server project path | `/var/www/sakani` |

### Getting Your SSH Key:

```bash
# Generate SSH key pair (if you don't have one)
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy public key to server
ssh-copy-id username@your-server-ip

# Get private key content for GitHub secret
cat ~/.ssh/id_ed25519
```

## 🌐 Domain Configuration

### Update Nginx Configuration

```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/sakani

# Replace YOUR_DOMAIN_HERE with your actual domain
# For example: sakani.com and frontend.sakani.com
```

### Set up SSL (Recommended)

```bash
# Install Certbot
sudo apt install snapd
sudo snap install --classic certbot

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d frontend.yourdomain.com
```

## 🚀 Deployment Process

### Automatic Deployment

Every time you push to the `main` branch:

1. GitHub Actions will trigger automatically
2. Tests will run on both backend and frontend
3. If tests pass, deployment begins
4. Your server will pull the latest code
5. Dependencies will be updated
6. Database migrations will run
7. Frontend will be rebuilt
8. Services will restart

### Manual Deployment

If needed, you can deploy manually on your server:

```bash
cd /var/www/sakani
git pull origin main
./deploy.sh
```

## 📊 Monitoring Deployment

### GitHub Actions

- Visit: https://github.com/abdo-taher/sakani/actions
- Monitor deployment status and logs

### Server Logs

```bash
# Nginx logs
sudo tail -f /var/log/nginx/error.log

# Laravel logs
tail -f /var/www/sakani/backend/storage/logs/laravel.log

# System logs
sudo journalctl -f
```

## 🛠️ Troubleshooting

### Common Issues:

1. **Permission Errors**
   ```bash
   sudo chown -R www-data:www-data /var/www/sakani/backend/storage
   sudo chmod -R 775 /var/www/sakani/backend/storage
   ```

2. **Database Connection Issues**
   - Check credentials in `.env`
   - Ensure MySQL is running: `sudo systemctl status mysql`

3. **Frontend Not Loading**
   - Check if build completed: `ls -la /var/www/sakani/frontend/dist`
   - Verify Nginx configuration: `sudo nginx -t`

4. **SSH Connection Issues**
   - Verify SSH key format in GitHub secrets
   - Test connection: `ssh username@server-ip`

### Getting Help

1. Check GitHub Actions logs for build errors
2. Review server logs for runtime errors
3. Ensure all environment variables are set correctly

## 🔄 Updates and Maintenance

### Regular Maintenance

```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Clear Laravel caches
cd /var/www/sakani/backend
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Backup database
mysqldump -u sakani_user -p sakani > backup_$(date +%Y%m%d).sql
```

### Rolling Back

If deployment fails:

```bash
cd /var/www/sakani
git log --oneline -10  # See recent commits
git reset --hard COMMIT_HASH  # Roll back to specific commit
./deploy.sh  # Redeploy
```

## ✅ Verification

After setup, verify everything works:

1. **Backend API**: `curl https://yourdomain.com/api/health`
2. **Frontend**: Visit `https://frontend.yourdomain.com`
3. **Admin Panel**: `https://frontend.yourdomain.com/admin`
4. **Database**: Check if tables exist in MySQL

Your Sakani project is now ready for automated deployment! 🎉