# 🔐 GitHub Secrets Configuration Fix

Your deployment is failing because the GitHub secrets are not configured correctly. Here's how to fix it:

## 🚨 Current Issue
The error shows that GitHub Actions can't find your project directory on the server. We need to set up the correct GitHub secrets.

## 📋 Required GitHub Secrets

You need to add these secrets to your GitHub repository:

### 🔧 How to Add Secrets:
1. Go to: https://github.com/abdo-taher/sakani/settings/secrets/actions
2. Click **"New repository secret"** for each secret below

### 📝 Secrets to Add:

| Secret Name | Description | Your Value |
|-------------|-------------|------------|
| `HOST` | Your Hostinger server hostname | `your-server.hostinger.com` |
| `USERNAME` | Your Hostinger username | `u123456789` (your actual username) |
| `PASSWORD` | Your Hostinger password | `your-password` |
| `PORT` | SSH port | `22` |
| `PROJECT_PATH` | Full path to project on server | `/home/USERNAME/public_html/sakani` |

## 🎯 How to Find Your Hostinger Details:

### 1. Server Hostname (HOST):
- Login to: https://hpanel.hostinger.com/
- Go to **Hosting** → **Manage**
- Look for **SSH Access** section
- Copy the hostname (example: `srv123456.hstgr.cloud`)

### 2. Username:
- In Hostinger panel, look for your username (starts with `u` followed by numbers)
- Example: `u123456789`

### 3. Password:
- Use your Hostinger hosting password (not your panel password)
- If you don't know it, reset it in **SSH Access** section

### 4. Project Path:
- For shared hosting: `/home/YOUR_USERNAME/public_html/sakani`
- Replace `YOUR_USERNAME` with your actual username
- Example: `/home/u123456789/public_html/sakani`

## 🚀 Alternative: First-Time Setup Script

Since this is your first deployment, you may need to create the project directory on your server first.

### Option 1: Manual Setup
SSH to your server and create the directory:
```bash
ssh USERNAME@your-server.hostinger.com
cd public_html
git clone https://github.com/abdo-taher/sakani.git
```

### Option 2: Update Deploy Script
Let me create a setup script that creates the directory if it doesn't exist.

## ✅ Testing Your Setup

After adding the secrets:
1. Go to: https://github.com/abdo-taher/sakani/actions
2. Click **"Re-run jobs"** on the failed workflow
3. Check if it can now connect to your server

## 🔍 How to Debug:

If it still fails, check:
1. Can you SSH manually: `ssh USERNAME@HOST`
2. Does the directory exist: `ls -la /home/USERNAME/public_html/`
3. Is git installed on your server: `git --version`

---

**Next Step**: Add the GitHub secrets using your actual Hostinger details, then re-run the deployment!