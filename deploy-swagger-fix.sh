#!/bin/bash

# Deploy script to update VPS with latest Swagger changes
echo "🚀 Deploying Swagger fixes to production..."

# Check if git repository is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Committing latest changes..."
    git add .
    git commit -m "Fix: Update Swagger production URL to https://api.ost.edu.vn and fix member management system"
fi

# Force push to overcome any git locks
echo "📤 Pushing to repository..."
git push origin main --force-with-lease

echo "✅ Deployment script completed!"
echo "📋 Manual VPS deployment steps:"
echo "1. SSH into your VPS"
echo "2. Navigate to project directory"
echo "3. Run: git pull origin main"
echo "4. Run: npm install"
echo "5. Restart the application service"
echo ""
echo "🔗 New Swagger URL: https://api.ost.edu.vn/api-docs"