#!/bin/bash

# git-auto-merge.sh
# Automates the workflow:
# 1. Add, commit, and push changes on the current branch
# 2. Checkout main, pull latest, merge current branch, and push
# 3. Return to your original branch
#
# USAGE:
#   chmod +x git-auto-merge.sh
#   ./git-auto-merge.sh
#
# Make sure you have no uncommitted changes you want to keep unstaged!

# Exit on any error
set -e

# Save the current branch name
current_branch=$(git rev-parse --abbrev-ref HEAD)

echo "Current branch: $current_branch"

# 1. Add, commit, and push changes on the current branch
git add .
echo "Enter commit message:"
read commit_message
git commit -m "$commit_message"
git push

# 2. Checkout main and pull latest
git checkout main
git pull

# 3. Merge the feature branch into main and push
git merge "$current_branch"
git push

# 4. Return to the original branch
git checkout "$current_branch"

echo "✅ Workflow complete! You are back on $current_branch."

# Optional: Uncomment the next line to delete the feature branch after merging
# git branch -d "$current_branch"