# Google OAuth 2.0 Setup Guide

This guide walks you through setting up Google OAuth 2.0 authentication for the Crop Intelligence App.

## Prerequisites

- A Google account
- Access to Google Cloud Console (https://console.cloud.google.com/)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "NEW PROJECT"
4. Enter a project name (e.g., "Crop Intelligence App")
5. Click "CREATE"
6. Wait for the project to be created, then select it

## Step 2: Enable Google+ API

1. In the Google Cloud Console, search for "Google+ API"
2. Click on "Google+ API" from the results
3. Click the "ENABLE" button
4. Wait for it to enable

## Step 3: Create OAuth 2.0 Credentials

1. In the Google Cloud Console, go to "Credentials" (left sidebar)
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. If prompted, click "Configure OAuth Consent Screen" first:
   - Select "External" as User Type
   - Click "CREATE"
   - Fill in the required app information:
     - App name: "Crop Intelligence"
     - User support email: Your email
     - Developer contact email: Your email
   - Click "SAVE AND CONTINUE"
   - Skip the optional scopes, click "SAVE AND CONTINUE"
   - Click "BACK TO DASHBOARD"

4. Now create OAuth credentials:
   - In Credentials page, click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "Crop Intelligence OAuth"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for local development)
     - `http://localhost:5173` (if using Vite)
     - Your frontend domain (e.g., `https://crop-intelligence-app.vercel.app`)
   - Authorized redirect URIs:
     - `http://localhost:3000` (for local development)
     - Your frontend domain (e.g., `https://crop-intelligence-app.vercel.app`)
   - Click "CREATE"

5. Copy the **Client ID** from the dialog

## Step 4: Configure Frontend

### For Local Development

1. Create or update `.env.local` in the frontend directory:
```bash
REACT_APP_API_BASE=http://localhost:5001
REACT_APP_GOOGLE_CLIENT_ID=<your-client-id-from-step-3>
REACT_APP_MAPBOX_TOKEN=<your-mapbox-token>
```

### For Production (Azure/Vercel)

1. Set environment variables in your deployment platform:

**For Vercel:**
- Go to Project Settings → Environment Variables
- Add: `REACT_APP_GOOGLE_CLIENT_ID=<your-client-id>`
- Redeploy

**For Azure Static Web Apps:**
- Add the environment variable in the GitHub Actions workflow or through Azure Portal
- Ensure it's prefixed with `REACT_APP_`

2. Update `.env.production` file:
```bash
REACT_APP_API_BASE=https://your-backend-url.azurewebsites.net
REACT_APP_GOOGLE_CLIENT_ID=<your-client-id>
REACT_APP_MAPBOX_TOKEN=<your-mapbox-token>
```

## Step 5: Configure Backend

### Set Google Client ID in Backend

For the backend to verify Google tokens, you need to set the `GOOGLE_CLIENT_ID` environment variable:

**Environment Variables to Add:**
```bash
GOOGLE_CLIENT_ID=<your-client-id-from-step-3>
```

**For Local Development:**
Add to `.env` or set in your shell:
```bash
export GOOGLE_CLIENT_ID="<your-client-id>"
```

**For Deployed Backend (Azure App Service):**
1. Go to Azure Portal
2. Select your App Service
3. Go to Settings → Configuration
4. Add new application setting:
   - Name: `GOOGLE_CLIENT_ID`
   - Value: `<your-client-id>`
5. Click "Save"

## Step 6: Test the Setup

### Local Testing

1. Start the backend:
```bash
cd backend
python -m flask run --port 5001
```

2. Start the frontend:
```bash
cd frontend
npm start
```

3. Go to http://localhost:3000
4. Try clicking "Continue with Google"
5. Sign in with your Google account
6. You should be redirected to the dashboard

### Troubleshooting

**Issue:** "Invalid Client ID" error
- Ensure `REACT_APP_GOOGLE_CLIENT_ID` is set correctly in `.env.local` or environment variables
- Check that the domain is in the authorized origins list

**Issue:** CORS errors
- Make sure backend has CORS enabled (already configured)
- Verify the backend URL is correct in `REACT_APP_API_BASE`

**Issue:** Token verification fails on backend
- Ensure `GOOGLE_CLIENT_ID` is set correctly on the backend
- Restart the backend server after changing environment variables
- Check that the Client ID matches between frontend and backend

**Issue:** Redirect URI mismatch
- Add all your frontend domains (local, staging, production) to the OAuth credentials
- Make sure the domain matches exactly (https vs http, www vs non-www)

## Security Considerations

1. **Never commit Client IDs or secrets** to version control
2. Always use environment variables
3. For sensitive data, use Azure Key Vault or similar solutions
4. Keep your Google Cloud project updated
5. Regularly review authorized apps in your Google Account settings

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)
- [Google Auth Library for Python](https://google-auth.readthedocs.io/)

## Features Enabled by Google OAuth

After setup, users can:
- Sign in with their Google account
- Automatically sign up with pre-filled information
- Faster authentication process
- Single sign-on across devices

## API Endpoints

The app now supports the following authentication endpoints:

- `POST /api/auth/login` - Traditional email/password login
- `POST /api/auth/register` - Traditional registration
- `POST /api/auth/google-login` - Google OAuth login (requires `idToken`)
- `GET /api/auth/verify` - Verify JWT token
- `GET /api/auth/profile` - Get user profile (requires JWT token)
- `PUT /api/auth/profile` - Update user profile (requires JWT token)
