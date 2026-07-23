# 🚀 GitHub Actions Auto-Deployment Setup

## 📋 Required GitHub Secrets

Go to your repository: **https://github.com/abdo-taher/sakani**

1. **Navigate to**: Settings → Secrets and variables → Actions
2. **Add these Repository Secrets**:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `SSH_HOST` | `92.113.28.185` | Hostinger server IP |
| `SSH_USERNAME` | `u467678620` | Your Hostinger username |
| `SSH_PASSWORD` | `your_password` | Your Hostinger SSH password |
| `SSH_PORT` | `65002` | SSH port number |

## 🔧 How It Works

### Automatic Deployment Triggers:
- ✅ **Push to main branch** - Deploys automatically
- ✅ **Manual trigger** - Can be triggered from GitHub Actions tab

### Deployment Process:
1. **Build frontend** with `npm run build`
2. **Install backend dependencies** with Composer
3. **SSH to your server** using your credentials
4. **Update code** from GitHub repository
5. **Run Laravel setup** (migrations, cache optimization)
6. **Upload frontend build** files
7. **Set proper permissions**

## 🎯 Your Live URLs After Deployment

- **Frontend**: https://sakani.site
- **API**: https://api.sakani.site
- **Health Check**: https://api.sakani.site/api/health

## 📊 Monitor Deployment

**Repository Actions**: https://github.com/abdo-taher/sakani/actions

You can watch the deployment progress in real-time and see any errors.

## ⚡ Quick Setup Commands

Run these on your server to ensure everything is ready:

```bash
# Navigate to your project
cd ~/domains/sakani.site/public_html/

# Clone repository if it doesn't exist
if [ ! -d "backend" ]; then
  git clone https://github.com/abdo-taher/sakani.git .
fi

# Set up directory structure
mkdir -p sakani/frontend
cd backend
```

## 🔄 Manual Deployment (Alternative)

If GitHub Actions fails, you can always deploy manually:

```bash
# On your server
cd ~/domains/sakani.site/public_html/backend
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan optimize
```

## 🛠️ Troubleshooting

### SSH Connection Issues:
- Verify your password is correct in GitHub Secrets
- Check that SSH port 65002 is accessible
- Try connecting manually first: `ssh -p 65002 u467678620@92.113.28.185`

### Deployment Failures:
- Check GitHub Actions logs for specific errors
- Verify file permissions on server
- Ensure database credentials are correct in `.env`

---

**🎉 Once set up, every push to main will automatically deploy your changes!**