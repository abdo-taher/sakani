# 🔐 Hostinger SSH Key Setup Guide

The deployment is failing because we need to set up SSH keys properly. Here's the complete guide:

## 🚨 Current Issue
- GitHub Actions can't connect to your Hostinger server
- We need SSH key authentication instead of password
- Need to find the correct path structure

## 📝 Step 1: Generate SSH Key

On your local machine, run:
```bash
ssh-keygen -t ed25519 -C "sakani-deployment"
```

When prompted:
- **File location**: Press Enter (use default)
- **Passphrase**: Leave empty (press Enter twice)

This creates:
- **Private key**: `~/.ssh/id_ed25519`
- **Public key**: `~/.ssh/id_ed25519.pub`

## 📋 Step 2: Get Your SSH Key Content

### Get Private Key (for GitHub):
```bash
cat ~/.ssh/id_ed25519
```
Copy the ENTIRE content including `-----BEGIN` and `-----END` lines.

### Get Public Key (for Hostinger):
```bash
cat ~/.ssh/id_ed25519.pub
```
Copy this one-line content.

## 🏠 Step 3: Add Public Key to Hostinger

### Option A: Using Hostinger Panel
1. Login to: https://hpanel.hostinger.com/
2. Go to **Hosting** → **Manage** → **Advanced** → **SSH Access**
3. Click **"Manage SSH Keys"**
4. Click **"Add New SSH Key"**
5. Paste your public key content
6. Save

### Option B: Manual SSH Setup
1. SSH to your server:
   ```bash
   ssh USERNAME@your-server.hostinger.com
   ```
2. Create SSH directory:
   ```bash
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   ```
3. Add your public key:
   ```bash
   echo "YOUR_PUBLIC_KEY_CONTENT" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

## 🔧 Step 4: Find Your Hostinger Details

### 1. SSH to Your Server
```bash
ssh USERNAME@your-server.hostinger.com
```

### 2. Find Your Paths
Once connected, run these commands:
```bash
# Your username
whoami

# Your home directory  
echo $HOME

# Web directory
ls -la ~/public_html

# Full path to web directory
pwd && cd ~/public_html && pwd
```

**Take note of these paths!**

## 🔑 Step 5: Update GitHub Secrets

Go to: https://github.com/abdo-taher/sakani/settings/secrets/actions

**Delete old secrets and add new ones:**

| Secret Name | Value | Example |
|-------------|-------|---------|
| `HOST` | Server hostname from Hostinger | `srv123456.hstgr.cloud` |
| `USERNAME` | Your Hostinger username | `u123456789` |
| `SSH_KEY` | **Private key content** | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PORT` | SSH port (optional) | `22` |

**⚠️ Important:**
- Use `SSH_KEY` instead of `PASSWORD`
- Remove the `PASSWORD` and `PROJECT_PATH` secrets
- The new workflow finds the path automatically

## 🧪 Step 6: Test SSH Connection

Before running GitHub Actions, test manually:
```bash
ssh USERNAME@your-server.hostinger.com
```

Should connect without asking for password.

## 🚀 Step 7: Re-run Deployment

1. Go to: https://github.com/abdo-taher/sakani/actions
2. Click on the latest failed workflow
3. Click **"Re-run jobs"**

## 🔍 Expected Output

The new workflow will show:
```
🔍 Current user: u123456789
🏠 Home directory: /home/u123456789
📂 Current directory: /home/u123456789
📂 Web root directory: /home/u123456789/public_html
📁 Creating sakani directory...
📂 Project directory: /home/u123456789/public_html/sakani
🔄 Cloning repository for first time...
🚀 Running deployment script...
```

## 🐛 Troubleshooting

### Problem: "Permission denied (publickey)"
**Solution:**
- Check if public key is added to Hostinger correctly
- Verify SSH_KEY secret contains the full private key

### Problem: "Host key verification failed"
**Solution:**
- Add `StrictHostKeyChecking=no` option, but first try connecting manually

### Problem: "git clone failed"
**Solution:**
- Check if git is installed on your server: `git --version`
- Hostinger shared hosting should have git pre-installed

---

**After completing these steps, your deployment should work!** 🎉