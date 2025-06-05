#!/bin/bash

# Deploy static website to Vercel (voltracker project)
echo "🌐 Deploying static website to voltracker.com..."

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found. Make sure you're in the voltracker-web directory."
    exit 1
fi

# 🚨 SAFETY CHECK: Verify correct repository
REMOTE_URL=$(git remote get-url origin)
if [[ "$REMOTE_URL" == *"voltracker-app"* ]]; then
    echo "🚨 SAFETY CHECK FAILED!"
    echo "❌ Wrong repository: $REMOTE_URL"
    echo "✅ Expected: https://github.com/usabillla/voltracker.git (NOT voltracker-app)"
    echo ""
    echo "🔧 Fix with:"
    echo "   git remote remove origin"
    echo "   git remote add origin https://github.com/usabillla/voltracker.git"
    exit 1
fi
echo "✅ Repository check passed: $REMOTE_URL"

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Committing changes..."
    git add .
    git commit -m "Update static website - $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
npx vercel --prod

echo "✅ Static website deployed to voltracker.com"