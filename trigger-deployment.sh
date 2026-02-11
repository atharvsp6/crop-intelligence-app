#!/bin/bash
# Trigger GitHub Actions workflow for Azure deployment

REPO_OWNER="athar"  # Change to your GitHub username
REPO_NAME="crop-intelligence-app"
WORKFLOW_ID="main_crop-intelligence-api.yml"
GITHUB_TOKEN="$1"  # Pass as first argument

if [ -z "$GITHUB_TOKEN" ]; then
    echo "Usage: ./trigger-deployment.sh <GITHUB_TOKEN>"
    echo ""
    echo "How to get GitHub Personal Access Token:"
    echo "1. Go to https://github.com/settings/tokens"
    echo "2. Click 'Generate new token' -> 'Generate new token (classic)'"
    echo "3. Select scopes: 'repo' and 'workflow'"
    echo "4. Copy the token and use it as argument"
    exit 1
fi

echo "Triggering GitHub Actions workflow for deployment..."
echo "Repository: $REPO_OWNER/$REPO_NAME"
echo "Workflow: $WORKFLOW_ID"
echo ""

curl -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/actions/workflows/$WORKFLOW_ID/dispatches \
  -d '{"ref":"main","inputs":{}}'

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Workflow triggered successfully!"
    echo "Deployment should start in a few seconds."
    echo ""
    echo "Monitor progress at: https://github.com/$REPO_OWNER/$REPO_NAME/actions"
else
    echo ""
    echo "✗ Failed to trigger workflow. Check your GitHub token."
fi
