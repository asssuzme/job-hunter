#!/bin/bash

# Direct push with embedded credentials (temporary use only)
echo "Pushing directly to GitHub..."

# Set the remote with credentials embedded
git remote set-url origin https://asssuzme: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@github.com/asssuzme/job-hunter.git

# Push everything
git push -u origin main --force

# Clean up - remove credentials from remote
git remote set-url origin https://github.com/asssuzme/job-hunter.git

echo "Done! Check: https://github.com/asssuzme/job-hunter"