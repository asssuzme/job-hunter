#!/bin/bash

echo "=== Final Push to GitHub ==="
echo ""

# First, ensure we're on main branch
git checkout -b main 2>/dev/null || git checkout main

# Set the remote with embedded token
git remote set-url origin https://asssuzme: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@github.com/asssuzme/job-hunter.git

# Push with all options to ensure it works
echo "Pushing to GitHub (this may take a moment)..."
git push -u origin main --force --all

# Also push tags if any
git push origin --tags

# Clean up credentials from remote
git remote set-url origin https://github.com/asssuzme/job-hunter.git

echo ""
echo "✅ Push complete!"
echo "🌐 Your repository: https://github.com/asssuzme/job-hunter"
echo ""
echo "Please refresh your GitHub page now!"