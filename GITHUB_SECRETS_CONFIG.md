# GitHub Secrets Configuration for Your Hostinger Server

## 🔑 Your Server Configuration

Based on your SSH connection: `ssh -p 65002 u467678620@92.113.28.185`

## 📋 GitHub Secrets to Add

Go to: **https://github.com/abdo-taher/sakani/settings/secrets/actions**

Click **"New repository secret"** and add each of these:

### 1. HOST
```
Name: HOST
Value: 92.113.28.185
```

### 2. USERNAME  
```
Name: USERNAME
Value: u467678620
```

### 3. PORT
```
Name: PORT
Value: 65002
```

### 4. PROJECT_PATH
```
Name: PROJECT_PATH
Value: /home/u467678620/public_html/sakani
```

### 5. SSH_KEY
```
Name: SSH_KEY
Value: [Your SSH private key content - see instructions below]
```

## 🔐 SSH Key Setup

### Option 1: Use Password Authentication (Temporary)
For now, you can use your password `010639Aa#` but SSH key is more secure.

### Option 2: Set up SSH Key (Recommended)

#### Step 1: Generate SSH Key
```bash
# On your local machine
ssh-keygen -t ed25519 -C "sakani-hostinger-deployment"
# Save as: ~/.ssh/sakani_hostinger
```

#### Step 2: Copy Public Key to Server
```bash
# Copy public key content
cat ~/.ssh/sakani_hostinger.pub

# SSH to your server
ssh -p 65002 u467678620@92.113.28.185

# On the server, add your public key
mkdir -p ~/.ssh
echo "YOUR_PUBLIC_KEY_CONTENT_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

#### Step 3: Add Private Key to GitHub
```bash
# Copy private key content
cat ~/.ssh/sakani_hostinger
```

Copy this entire content (including `-----BEGIN` and `-----END` lines) to the SSH_KEY secret.

## 🛠️ Server Setup Commands

Run these commands on your Hostinger server:

### 1. Connect to Server
```bash
ssh -p 65002 u467678620@92.113.28.185
```

### 2. Download and Run Setup Script
```bash
# Navigate to public_html
cd public_html

# Download setup script
wget https://raw.githubusercontent.com/abdo-taher/sakani/main/setup-your-hostinger.sh

# Make executable and run
chmod +x setup-your-hostinger.sh
./setup-your-hostinger.sh
```

## 🗄️ Database Setup

### 1. Create Database in Hostinger Panel
- Go to: https://hpanel.hostinger.com/
- Navigate: **Databases** → **MySQL Databases**
- Create database: `u467678620_sakani`
- Create user: `u467678620_sakani_user`
- Set secure password and assign to database

### 2. Configure Environment
```bash
# On your server
cd /home/u467678620/public_html/sakani/backend
nano .env
```

Update these values:
```env
APP_URL=https://yourdomain.com
APP_ENV=production
APP_DEBUG=false

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=u467678620_sakani
DB_USERNAME=u467678620_sakani_user
DB_PASSWORD=your_secure_password

CLOUDINARY_URL=your_cloudinary_url
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Run Database Migration
```bash
cd /home/u467678620/public_html/sakani/backend
php artisan migrate --force
php artisan db:seed --force
```

## 🌐 Domain Configuration

### Subdomain Setup (Recommended):
1. Create subdomains in Hostinger:
   - `api.yourdomain.com` → `/home/u467678620/public_html/sakani/backend/public`
   - `app.yourdomain.com` → `/home/u467678620/public_html/sakani/frontend/dist`

### File Paths on Your Server:
- **Backend**: `/home/u467678620/public_html/sakani/backend/public`
- **Frontend**: `/home/u467678620/public_html/sakani/frontend/dist`

## ✅ Verification Steps

After setup, test these:

1. **SSH Connection**:
   ```bash
   ssh -p 65002 u467678620@92.113.28.185
   ```

2. **Project Structure**:
   ```bash
   ls -la /home/u467678620/public_html/sakani/
   ```

3. **Backend Health**:
   ```bash
   cd /home/u467678620/public_html/sakani/backend
   php artisan --version
   ```

4. **Frontend Build**:
   ```bash
   ls -la /home/u467678620/public_html/sakani/frontend/dist/
   ```

## 🚀 GitHub Actions Deployment

Once secrets are configured:
1. **Push to main** triggers automatic deployment
2. **Monitor**: https://github.com/abdo-taher/sakani/actions
3. **Logs**: Check GitHub Actions for any errors

## 📞 Support

If you encounter issues:
- Check GitHub Actions logs
- SSH to server and check `/home/u467678620/public_html/sakani/`
- Verify all secrets are correctly set in GitHub