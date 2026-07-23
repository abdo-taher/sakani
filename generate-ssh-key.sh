#!/bin/bash

# Generate SSH Key for Sakani Deployment
echo "🔐 Generating SSH Key for Sakani Deployment..."

# Check if key already exists
if [ -f ~/.ssh/id_ed25519 ]; then
    echo "⚠️  SSH key already exists at ~/.ssh/id_ed25519"
    echo "Do you want to use the existing key? (y/n)"
    read -r response
    if [[ "$response" != "y" ]]; then
        echo "💡 Please use the existing key or remove it first with: rm ~/.ssh/id_ed25519*"
        exit 1
    fi
else
    # Generate new SSH key
    ssh-keygen -t ed25519 -C "sakani-deployment" -f ~/.ssh/id_ed25519 -N ""
    echo "✅ SSH key generated successfully!"
fi

echo ""
echo "📋 COPY THESE VALUES TO GITHUB SECRETS:"
echo "================================="
echo ""
echo "🔓 PUBLIC KEY (Add to Hostinger):"
echo "================================="
cat ~/.ssh/id_ed25519.pub
echo ""
echo ""
echo "🔑 PRIVATE KEY (Add to GitHub SECRET: SSH_KEY):"
echo "============================================="
cat ~/.ssh/id_ed25519
echo ""
echo ""
echo "📝 Next Steps:"
echo "1. Copy the PUBLIC KEY above to Hostinger SSH Keys"
echo "2. Copy the PRIVATE KEY above to GitHub Secret 'SSH_KEY'"
echo "3. Remove PASSWORD secret from GitHub"
echo "4. Re-run the deployment"
echo ""
echo "🌐 GitHub Secrets: https://github.com/abdo-taher/sakani/settings/secrets/actions"
echo "🏠 Hostinger Panel: https://hpanel.hostinger.com/"