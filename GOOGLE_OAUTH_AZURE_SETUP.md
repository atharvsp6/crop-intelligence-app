# Quick Google OAuth Setup for Azure

## Step 1: Get Your Google Client ID

If you don't have one yet:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
4. Application type: **Web application**
5. Add authorized origins:
   - `https://crop-intelligence-app.vercel.app`
6. Copy your **Client ID** (looks like: `xxx.apps.googleusercontent.com`)

## Step 2: Add to Azure App Service

### Option A: Using PowerShell Script (Automatic)

```powershell
# Run from the project root directory
.\setup-google-oauth-azure.ps1 -GoogleClientId "YOUR_GOOGLE_CLIENT_ID_HERE"
```

### Option B: Using Azure Portal (Manual)

1. Go to [Azure Portal](https://portal.azure.com)
2. Find your App Service: **crop-intelligence-api**
3. Click on **Settings** → **Configuration**
4. Click **+ New application setting**
5. Create new setting:
   - **Name:** `GOOGLE_CLIENT_ID`
   - **Value:** `YOUR_GOOGLE_CLIENT_ID_HERE` (the one from Step 1)
6. Click **Save**
7. App Service will restart automatically

### Option C: Using Azure CLI

```bash
az webapp config appsettings set `
  --resource-group crop-intelligence-rg `
  --name crop-intelligence-api `
  --settings GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID_HERE"
```

## Step 3: Test

1. Go to https://crop-intelligence-app.vercel.app
2. Click "Continue with Google" button
3. Sign in with your Google account
4. Should redirect to dashboard

## Verification

If you want to verify the setting was applied:

```powershell
az webapp config appsettings list `
  --resource-group crop-intelligence-rg `
  --name crop-intelligence-api
```

Look for `GOOGLE_CLIENT_ID` in the list.

## Troubleshooting

**Still getting 404?**
- Wait 1-2 minutes for the app service to fully restart
- Refresh your browser (Ctrl+F5 to clear cache)
- Check that GOOGLE_CLIENT_ID is set correctly above

**Invalid Client ID error?**
- Verify the Client ID format (should end with `.apps.googleusercontent.com`)
- Make sure you copied it correctly from Google Cloud Console
- Check that https://crop-intelligence-app.vercel.app is in Authorized origins

**CORS errors?**
- These are normal warnings in browser - they don't break functionality
- Ignore Cross-Origin-Opener-Policy warnings

---

**Which method do you prefer?**
- **A (PowerShell)**: Fastest, paste one command
- **B (Portal)**: Visual, easy to verify
- **C (CLI)**: If you prefer command line

Ready to set it up? Provide your Google Client ID!
