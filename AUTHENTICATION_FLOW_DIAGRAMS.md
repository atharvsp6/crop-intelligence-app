# Authentication Flow Diagrams

## Overview

This document provides visual diagrams of the authentication flows and CORS handling.

## 1. Email/Password Authentication Flow

```
┌─────────────┐                                    ┌─────────────┐
│             │                                    │             │
│  Frontend   │                                    │   Backend   │
│  (Vercel)   │                                    │ (Azure/     │
│             │                                    │  Render)    │
└──────┬──────┘                                    └──────┬──────┘
       │                                                  │
       │ 1. User enters email/password                   │
       │    POST /api/auth/login                         │
       │────────────────────────────────────────────────>│
       │                                                  │
       │                              2. Validate email  │
       │                                 Check password  │
       │                                 (bcrypt verify) │
       │                                                  │
       │                              3. Generate JWT    │
       │                                 (7-day exp)     │
       │                                                  │
       │    4. Return JWT token + user data              │
       │<────────────────────────────────────────────────│
       │    { success: true, token, user }               │
       │                                                  │
       │ 5. Store token in localStorage                  │
       │                                                  │
       │ 6. Set Authorization header                     │
       │    Bearer <token>                               │
       │                                                  │
       │ 7. Access protected routes                      │
       │    GET /api/... (with token)                    │
       │────────────────────────────────────────────────>│
       │                                                  │
       │                              8. Verify JWT      │
       │                                 Check signature │
       │                                 Check expiry    │
       │                                                  │
       │    9. Return protected data                     │
       │<────────────────────────────────────────────────│
       │                                                  │
```

## 2. Google OAuth Authentication Flow

```
┌──────────┐          ┌──────────┐          ┌──────────┐          ┌──────────┐
│          │          │          │          │          │          │          │
│ Frontend │          │  Google  │          │ Backend  │          │ MongoDB  │
│ (Vercel) │          │  OAuth   │          │(Azure/   │          │  Atlas   │
│          │          │          │          │ Render)  │          │          │
└────┬─────┘          └────┬─────┘          └────┬─────┘          └────┬─────┘
     │                     │                     │                     │
     │ 1. Click "Sign in  │                     │                     │
     │    with Google"    │                     │                     │
     │                    │                     │                     │
     │ 2. Redirect to     │                     │                     │
     │    Google OAuth    │                     │                     │
     │───────────────────>│                     │                     │
     │                    │                     │                     │
     │ 3. User authorizes │                     │                     │
     │                    │                     │                     │
     │ 4. Return access_  │                     │                     │
     │    token (implicit │                     │                     │
     │    flow)           │                     │                     │
     │<───────────────────│                     │                     │
     │                    │                     │                     │
     │ 5. Send access_token                     │                     │
     │    POST /api/auth/google-login           │                     │
     │─────────────────────────────────────────>│                     │
     │                    │                     │                     │
     │                    │ 6. Validate token   │                     │
     │                    │    (Google API)     │                     │
     │                    │<────────────────────│                     │
     │                    │                     │                     │
     │                    │ 7. Return user info │                     │
     │                    │    (email, name)    │                     │
     │                    │────────────────────>│                     │
     │                    │                     │                     │
     │                    │                     │ 8. Check if user    │
     │                    │                     │    exists           │
     │                    │                     │────────────────────>│
     │                    │                     │                     │
     │                    │                     │ 9. User data        │
     │                    │                     │<────────────────────│
     │                    │                     │                     │
     │                    │                     │ 10. Create/Update   │
     │                    │                     │     user            │
     │                    │                     │     Generate JWT    │
     │                    │                     │                     │
     │ 11. Return JWT + user data               │                     │
     │<─────────────────────────────────────────│                     │
     │                    │                     │                     │
     │ 12. Store token    │                     │                     │
     │     Navigate to    │                     │                     │
     │     dashboard      │                     │                     │
     │                    │                     │                     │
```

## 3. CORS Request Flow (Multi-Layer Security)

```
┌─────────────────────────────────────────────────────────────────┐
│ Browser (Frontend)                                              │
│ Origin: https://your-app.vercel.app                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ 1. HTTP Request with Origin header
                             │    GET /api/auth/verify
                             │    Origin: https://your-app.vercel.app
                             │    Authorization: Bearer <token>
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Backend - Flask-CORS Layer                                     │
│ Configuration: origins="*", supports_credentials=False          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ 2. Request passes CORS extension
                             │    (wildcard allows all origins)
                             │    (credentials NOT enabled yet)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Backend - Route Handler                                        │
│ Process request, generate response                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ 3. Response ready
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Backend - after_request() Handler                              │
│                                                                 │
│ 4. Validate Origin:                                            │
│    ┌─────────────────────────────────────────┐                │
│    │ Is origin in allowed_origin_set?        │                │
│    │ - Check FRONTEND_URL                    │                │
│    │ - Check ALLOWED_ORIGINS                 │                │
│    │ - Check *.vercel.app pattern            │                │
│    │ - Check *.azurewebsites.net pattern     │                │
│    │ - Check *.onrender.com pattern          │                │
│    └─────────────────┬───────────────────────┘                │
│                      │                                         │
│          ┌───────────┴───────────┐                             │
│          │                       │                             │
│      ✓ YES                   ✗ NO                              │
│          │                       │                             │
│          ▼                       ▼                             │
│    ┌──────────┐          ┌──────────┐                         │
│    │ ALLOWED  │          │ BLOCKED  │                         │
│    └────┬─────┘          └────┬─────┘                         │
│         │                     │                                │
│         │ Set headers:        │ No credentials header          │
│         │ - Access-Control-   │ Log: BLOCKED                   │
│         │   Allow-Origin      │                                │
│         │ - Access-Control-   │                                │
│         │   Allow-Credentials:│                                │
│         │   true              │                                │
│         │ Log: ALLOWED        │                                │
│         │                     │                                │
└─────────┴─────────────────────┴─────────────────────────────────┘
          │                     │
          │                     │
          ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Response sent to browser                                        │
│                                                                 │
│ If ALLOWED:                      If BLOCKED:                   │
│ - Includes credentials           - No credentials              │
│ - Auth headers processed         - Auth headers ignored        │
│ - Protected data returned        - Request fails               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 4. Backend Switching Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Initial State: Azure Backend                                   │
│                                                                 │
│ Frontend: https://your-app.vercel.app                          │
│ Backend:  https://your-app.azurewebsites.net                   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ User decides to switch to Render
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Deploy Backend to Render                               │
│                                                                 │
│ 1. Push code to GitHub                                         │
│ 2. Render auto-deploys from GitHub                             │
│ 3. Set environment variables in Render Dashboard:              │
│    - JWT_SECRET_KEY (same as Azure)                            │
│    - MONGO_URI (same database)                                 │
│    - FRONTEND_URL=https://your-app.vercel.app                  │
│    - ALLOWED_ORIGINS=https://your-app.vercel.app               │
│ 4. Verify: curl https://your-app.onrender.com/ping             │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Update Frontend Configuration                          │
│                                                                 │
│ 1. Go to Vercel Dashboard                                      │
│ 2. Project → Settings → Environment Variables                  │
│ 3. Update REACT_APP_API_BASE:                                  │
│    From: https://your-app.azurewebsites.net                    │
│    To:   https://your-app.onrender.com                         │
│ 4. Save and redeploy                                           │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Verification                                            │
│                                                                 │
│ ✓ Frontend makes requests to Render backend                    │
│ ✓ CORS automatically allows *.onrender.com                     │
│ ✓ Same database, same users, same tokens                       │
│ ✓ No code changes required                                     │
│ ✓ Users stay logged in                                         │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ New State: Render Backend                                      │
│                                                                 │
│ Frontend: https://your-app.vercel.app (unchanged)              │
│ Backend:  https://your-app.onrender.com (switched)             │
│                                                                 │
│ Total time: ~5 minutes                                         │
│ Code changes: 0                                                │
│ Data migration: 0 (same database)                              │
└─────────────────────────────────────────────────────────────────┘
```

## 5. Environment Variable Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│ Deployment Platform Configuration                              │
└─────────────────────────────────────────────────────────────────┘

Backend (Azure App Service):
┌─────────────────────────────────────────────────────────────────┐
│ Azure Portal → App Service → Configuration → Application       │
│ Settings                                                        │
│                                                                 │
│ ✓ JWT_SECRET_KEY           = <32-char-random-string>           │
│ ✓ MONGO_URI                = mongodb+srv://...                 │
│ ✓ FRONTEND_URL             = https://your-app.vercel.app       │
│ ✓ ALLOWED_ORIGINS          = https://your-app.vercel.app       │
│ ✓ GEMINI_API_KEY           = AIza...                           │
│                                                                 │
│ Optional:                                                       │
│ - OPENWEATHER_API_KEY                                           │
│ - DATA_GOV_IN_API_KEY                                           │
│ - ALPHA_VANTAGE_API_KEY                                         │
└─────────────────────────────────────────────────────────────────┘

Backend (Render):
┌─────────────────────────────────────────────────────────────────┐
│ Render Dashboard → Web Service → Environment                   │
│                                                                 │
│ ✓ JWT_SECRET_KEY           = <same-as-azure>                   │
│ ✓ MONGO_URI                = mongodb+srv://... (same db)       │
│ ✓ FRONTEND_URL             = https://your-app.vercel.app       │
│ ✓ ALLOWED_ORIGINS          = https://your-app.vercel.app       │
│ ✓ GEMINI_API_KEY           = AIza...                           │
└─────────────────────────────────────────────────────────────────┘

Frontend (Vercel):
┌─────────────────────────────────────────────────────────────────┐
│ Vercel Dashboard → Project → Settings → Environment Variables  │
│                                                                 │
│ ✓ REACT_APP_API_BASE       = https://your-backend-url          │
│   (Azure or Render)                                             │
│                                                                 │
│ Optional:                                                       │
│ ✓ REACT_APP_GOOGLE_CLIENT_ID = xxx.apps.googleusercontent.com  │
└─────────────────────────────────────────────────────────────────┘
```

## 6. Error Handling Flow

```
User Action → Frontend → Backend → Result

Email/Password Login:
┌────────────────┐
│ User submits   │
│ login form     │
└────────┬───────┘
         │
         ▼
    ┌────────────────────────┐
    │ Frontend validates     │
    │ - Email format         │
    │ - Password not empty   │
    └────────┬───────────────┘
             │
             ▼
        ┌─────────────────────┐
        │ POST /api/auth/     │
        │ login with timeout  │
        │ (10 seconds)        │
        └─────┬───────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
  ✓ Success         ✗ Error
    │                   │
    │              ┌────┴─────────────────────────┐
    │              │                              │
    │         Network Error              Server Error
    │              │                              │
    │              ▼                              ▼
    │    "Cannot connect to     "Invalid email or password"
    │     server. Please        "Server error. Please try
    │     check your backend     again later."
    │     URL."
    │              │                              │
    │              └──────────┬───────────────────┘
    │                         │
    ▼                         ▼
Store token         Show error message
Redirect           Suggest email/password
                   or registration

Google OAuth:
┌────────────────┐
│ User clicks    │
│ "Sign in with  │
│ Google"        │
└────────┬───────┘
         │
         ▼
    ┌────────────────────────┐
    │ Google OAuth popup     │
    └────────┬───────────────┘
             │
    ┌────────┴────────┐
    │                 │
  ✓ Success       ✗ Cancelled
    │                 │
    │                 ▼
    │           "Google sign-in was
    │            cancelled. Please use
    │            email/password login."
    │
    ▼
Get access_token
    │
    ▼
POST /api/auth/google-login
    │
    ┌─────────┴─────────┐
    │                   │
  ✓ Success         ✗ Error
    │                   │
    │              ┌────┴─────────────────────────┐
    │              │                              │
    │         CORS Error                  Auth Failed
    │              │                              │
    │              ▼                              ▼
    │    "Connection error.      "Google authentication
    │     Please try             failed. Please try
    │     email/password          email/password login."
    │     login below."
    │              │                              │
    │              └──────────┬───────────────────┘
    │                         │
    ▼                         ▼
Store token         Show error + fallback
Redirect           guidance
```

## Summary

These diagrams illustrate:

1. **Authentication Flows**: Both email/password and Google OAuth
2. **CORS Security**: Multi-layer validation before enabling credentials
3. **Backend Switching**: Seamless migration without code changes
4. **Configuration**: Environment variables for all platforms
5. **Error Handling**: User-friendly messages with fallback options

All flows are designed to work seamlessly across Azure, Render, and any deployment platform.
