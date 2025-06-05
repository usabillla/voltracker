#!/bin/bash

# Deploy static website to Vercel (voltracker project)
echo "🌐 Deploying static website to voltracker.com..."

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found. Make sure you're in the voltracker-web directory."
    exit 1
fi

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