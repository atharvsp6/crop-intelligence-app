# Railway Deployment Guide

## Backend Environment Variables

Copy these to Railway's Environment Variables section:

```
MONGO_URI=mongodb+srv://atharvsp6_db_user:nLgyKD4CL9u7C936@yieldwise.gkf09zm.mongodb.net/?retryWrites=true&w=majority&appName=yieldwise
GEMINI_API_KEY=AIzaSyAn3AFf1Td8kXng_SIRoSJtY5NcDuBhvEk
MULTILINGUAL_GEMINI_MODEL=gemini-2.5-flash
YIELD_GEMINI_MODEL=gemini-2.0-flash
OPENWEATHER_API_KEY=08f5499847d13b9f685f30c31f635af8
GOVT_OPEN_DATA_KEY=579b464db66ec23bdd000001f8c6e078e51046dd71a836bebe03d085
ALPHA_VANTAGE_API_KEY=PZ22ROWS50Q4506B
COMMODITIES_API_KEY=
DATA_GOV_IN_API_KEY=579b464db66ec23bdd000001f8c6e078e51046dd71a836bebe03d085
QUANDL_API_KEY=pgyvEgE2xLNsDeZZhr8x
EXCHANGERATE_API_KEY=4af03c8708291313288210d9
JWT_SECRET_KEY=3f8c9a1e2d4b6f7a8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b
JWT_EXPIRY_HOURS=24
FLASK_ENV=production
CORS_ORIGINS=http://localhost:3000,https://crop-intelligence-app.vercel.app
NEWS_API_KEY=RAXU22USDMR301IY
SECRET_KEY=gA7$wP!9zL#qT2@eXrV1^mK8sN&bJ6uYfC0*dH3oZ
FRONTEND_URL=https://crop-intelligence-app.vercel.app
ALLOWED_ORIGINS=https://crop-intelligence-app.vercel.app,http://localhost:3000
MAPBOX_API_KEY=pk.eyJ1IjoiYXRoYXJ2c3AiLCJhIjoiY21kbjlwZGtnMWl4ODJsc2ZqcDR5cHVnaCJ9.6_LgxGqTbI7Q4HqHH5lPzQ
```

## Deployment Steps

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Create Railway Project:**
   - Go to https://railway.app/
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository: `crop-intelligence-app`
   - Set root directory to `backend`

3. **Configure Railway:**
   - Railway should auto-detect Python and use the Procfile
   - If needed, manually set:
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `gunicorn -w 1 --timeout 120 -b 0.0.0.0:$PORT app_integrated:app`

4. **Add Environment Variables:**
   - In Railway dashboard, go to your service
   - Click "Variables" tab
   - Add all the environment variables listed above
   - **Important:** Change `FLASK_ENV` to `production`

5. **Deploy:**
   - Click "Deploy" or trigger a redeploy
   - Wait for build and deployment to complete
   - Railway will provide a public URL (e.g., `https://your-app.up.railway.app`)

6. **Update Frontend:**
   - Update Vercel environment variable:
     - `REACT_APP_API_BASE=https://your-railway-url.up.railway.app`
   - Redeploy frontend on Vercel

7. **Test:**
   - Visit your Railway backend URL + `/ping` to verify it's running
   - Test your frontend with the new backend

## Files Created for Railway

- `Procfile` - Tells Railway how to start the app
- `railway.json` - Railway-specific configuration
- `requirements.txt` - Already exists with all dependencies including gunicorn

## Resource Optimization for Free Tier

Your backend is configured with:
- 1 worker (minimal memory usage)
- 120s timeout (for ML model predictions)
- Lazy model loading (models load on-demand)
- Memory cleanup after predictions

This should work within Railway's free tier limits (512MB RAM).

## Troubleshooting

If deployment fails:
1. Check Railway logs for errors
2. Verify all environment variables are set
3. Ensure root directory is set to `backend`
4. Check that gunicorn is in requirements.txt
5. Make sure the Procfile exists in the backend folder

## Health Check

Your backend has a health check endpoint at `/ping` that Railway will use to monitor the service.
