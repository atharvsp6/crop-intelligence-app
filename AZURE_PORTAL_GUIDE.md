# Azure Portal Deployment Guide - Step by Step

This guide will walk you through deploying your Crop Intelligence App using the **Azure Portal web interface** (no command line required).

## 📋 Before You Start

**You will need:**
1. Azure account - [Sign up for free](https://azure.microsoft.com/free/)
2. MongoDB Atlas account - [Sign up](https://www.mongodb.com/cloud/atlas)
3. Google Gemini API key - [Get it here](https://makersuite.google.com/app/apikey)
4. Mapbox API token - [Get it here](https://www.mapbox.com/)
5. Your project files ready

**Estimated time:** 30-45 minutes

---

## Part 1: Setup MongoDB Atlas Database

### Step 1: Create MongoDB Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click **"Sign In"** or **"Try Free"** if you don't have an account
3. After logging in, click **"Create"** to create a new cluster
4. Choose **"M0 Free"** tier (perfect for getting started)
5. Select a cloud provider and region:
   - Provider: **Azure**
   - Region: Choose closest to where you'll deploy (e.g., **East US**, **Central India**)
6. Cluster Name: `CropIntelligence` (or any name you like)
7. Click **"Create Cluster"** (takes 3-5 minutes)

### Step 2: Create Database User

1. On the left menu, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `cropapp_user` (or any name)
5. Click **"Autogenerate Secure Password"** 
6. **📝 IMPORTANT:** Copy and save this password somewhere safe!
7. Database User Privileges: Select **"Read and write to any database"**
8. Click **"Add User"**

### Step 3: Configure Network Access

1. On the left menu, click **"Network Access"**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (easier for Azure)
   - This adds `0.0.0.0/0`
   - For production, you can restrict this to Azure IPs later
4. Click **"Confirm"**

### Step 4: Get Connection String

1. Go back to **"Database"** in the left menu
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Driver: **Python**, Version: **3.11 or later**
5. **Copy the connection string** - it looks like:
   ```
   mongodb+srv://cropapp_user:<password>@cropintelligence.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Replace `<password>`** with the actual password you saved earlier
7. **📝 Save this complete connection string** - you'll need it soon!

---

## Part 2: Deploy Backend (Flask API)

### Step 1: Create Resource Group

1. Go to [Azure Portal](https://portal.azure.com/)
2. Sign in with your Azure account
3. In the search bar at the top, type **"Resource groups"** and click it
4. Click **"+ Create"**
5. Fill in:
   - Subscription: Select your subscription
   - Resource group name: `crop-intelligence-rg`
   - Region: **East US** (or your preferred region)
6. Click **"Review + create"**
7. Click **"Create"**

### Step 2: Create App Service Plan

1. In the search bar, type **"App Service plans"** and click it
2. Click **"+ Create"**
3. Fill in:
   - Subscription: Your subscription
   - Resource Group: Select `crop-intelligence-rg`
   - Name: `crop-intelligence-plan`
   - Operating System: **Linux**
   - Region: **East US** (same as resource group)
   - Pricing Tier: Click **"Change size"**
     - For testing: Select **"Dev/Test"** tab → **B1** (~$13/month)
     - For production: Select **"Production"** tab → **P1V2** (~$80/month)
   - Click **"Apply"**
4. Click **"Review + create"**
5. Click **"Create"**

### Step 3: Create App Service (Backend)

1. In the search bar, type **"App Services"** and click it
2. Click **"+ Create"**
3. **Basics tab:**
   - Subscription: Your subscription
   - Resource Group: `crop-intelligence-rg`
   - Name: `crop-intelligence-api` 
     - ⚠️ This must be globally unique! If taken, try `crop-intelligence-api-yourname`
     - **📝 Note this name** - you'll need it for the frontend!
   - Publish: **Code**
   - Runtime stack: **Python 3.11**
   - Operating System: **Linux**
   - Region: **East US** (same as before)
   - App Service Plan: Select `crop-intelligence-plan`
4. Click **"Next: Deployment >"**
5. **Deployment tab:**
   - Continuous deployment: **Disable** (for now)
   - Click **"Next: Networking >"**
6. **Networking tab:**
   - Enable public access: **On**
   - Click **"Next: Monitoring >"**
7. **Monitoring tab:**
   - Enable Application Insights: **Yes** (recommended)
   - Click **"Review + create"**
8. Click **"Create"**
9. Wait for deployment to complete (1-2 minutes)
10. Click **"Go to resource"**

### Step 4: Configure Backend Environment Variables

1. You should be on your App Service page (`crop-intelligence-api`)
2. In the left menu, scroll down and click **"Configuration"**
3. Under **"Application settings"** tab, click **"+ New application setting"** for each:

   **Add these settings one by one:**

   | Name | Value |
   |------|-------|
   | `MONGO_URI` | Your MongoDB connection string from Step 4 of Part 1 |
   | `JWT_SECRET_KEY` | Any random string (e.g., `my-super-secret-key-2026-xyz`) |
   | `GEMINI_API_KEY` | Your Google Gemini API key |
   | `FLASK_ENV` | `production` |
   | `FLASK_DEBUG` | `0` |
   | `PORT` | `8000` |
   | `TFHUB_CACHE_DIR` | `/home/site/wwwroot/.tfhub_cache` |
   | `DISEASE_SERVICE_URL` | `https://plant-disease-detection-api-nni5.onrender.com/predict` |
   | `DISEASE_SERVICE_TIMEOUT` | `30` |

   **To add each setting:**
   - Click **"+ New application setting"**
   - Enter Name and Value
   - Click **"OK"**

4. After adding all settings, click **"Save"** at the top
5. Click **"Continue"** when prompted (app will restart)

### Step 5: Configure Startup Command

1. Still in **"Configuration"**
2. Click the **"General settings"** tab
3. Under **"Startup Command"**, enter:
   ```
   gunicorn --bind=0.0.0.0:8000 --workers=2 --threads=4 --timeout=300 app:app
   ```
4. Click **"Save"** at the top

### Step 6: Deploy Backend Code

**Option A: Using Local Git (Recommended)**

1. In the left menu, click **"Deployment Center"**
2. Under **"Source"**, select **"Local Git"**
3. Click **"Save"** at the top
4. You'll see a **Git Clone URI** like:
   ```
   https://crop-intelligence-api.scm.azurewebsites.net/crop-intelligence-api.git
   ```
5. Click **"Local Git/FTPS credentials"** tab
6. Under **"Application scope"**:
   - Username: (already set)
   - Password: **Set a password** (remember this!)
   - Click **"Save"**

7. **On your computer, open PowerShell in the project folder:**
   ```powershell
   cd backend
   
   # Initialize git if not done
   git init
   git add .
   git commit -m "Initial backend deployment"
   
   # Add Azure remote (replace with your Git Clone URI)
   git remote add azure https://crop-intelligence-api.scm.azurewebsites.net/crop-intelligence-api.git
   
   # Push to Azure (enter password when prompted)
   git push azure master
   ```

**Option B: Using ZIP Deploy (Easier)**

1. **On your computer:**
   - Navigate to the `backend` folder
   - Select all files (Ctrl+A)
   - Right-click → **Send to** → **Compressed (zipped) folder**
   - Name it `backend.zip`

2. **In Azure Portal:**
   - In your App Service, in the left menu, click **"Advanced Tools"**
   - Click **"Go →"** (opens Kudu)
   - At the top menu, click **"Tools"** → **"Zip Push Deploy"**
   - Drag and drop your `backend.zip` file to the `/home/site/wwwroot` folder
   - Wait for extraction to complete

3. **Back in Azure Portal:**
   - Go to your App Service
   - Click **"Restart"** in the top menu

### Step 7: Enable CORS

1. In your App Service, in the left menu, click **"CORS"**
2. Under **"Allowed Origins"**, add:
   ```
   http://localhost:3000
   ```
   (We'll add the frontend URL later)
3. Click **"Save"** at the top

### Step 8: Verify Backend Deployment

1. In your App Service overview page, find the **URL** (should be like: `https://crop-intelligence-api.azurewebsites.net`)
2. Click on it to open in a new tab
3. You should see a response (might be JSON or a simple message)
4. **📝 Copy this URL** - you'll need it for the frontend!

**Check logs if there's an error:**
1. In the left menu, click **"Log stream"**
2. Wait for logs to appear
3. Look for any error messages

---

## Part 3: Deploy Frontend (React App)

### Step 1: Update Frontend Configuration

1. **On your computer**, navigate to the `frontend` folder
2. Create or edit the `.env` file:
   ```
   REACT_APP_API_BASE=https://crop-intelligence-api.azurewebsites.net
   REACT_APP_MAPBOX_TOKEN=your-mapbox-token-here
   ```
   Replace:
   - `crop-intelligence-api` with your actual backend app name
   - `your-mapbox-token-here` with your Mapbox token

### Step 2: Build Frontend

1. **Open PowerShell** in the `frontend` folder:
   ```powershell
   # Install dependencies (if not done)
   npm install
   
   # Build the production version
   npm run build
   ```

2. This creates a `build` folder with all the files ready to deploy

### Step 3: Create Static Web App

1. Go back to [Azure Portal](https://portal.azure.com/)
2. In the search bar, type **"Static Web Apps"** and click it
3. Click **"+ Create"**
4. **Basics tab:**
   - Subscription: Your subscription
   - Resource Group: `crop-intelligence-rg`
   - Name: `crop-intelligence-frontend`
     - ⚠️ Must be globally unique! If taken, try `crop-intelligence-frontend-yourname`
   - Plan type: **Free** (perfect for getting started)
   - Region: **East US 2** (or closest available for Static Web Apps)
   - Deployment source: **Other** (we'll upload manually)
5. Click **"Review + create"**
6. Click **"Create"**
7. Wait for deployment (1-2 minutes)
8. Click **"Go to resource"**

### Step 4: Deploy Frontend Files

**Option A: Using Azure Portal Upload**

1. In your Static Web App, find the **URL** (like: `https://crop-intelligence-frontend.azurestaticapps.net`)
2. Click **"Manage deployment token"** in the top menu
3. Click **"Copy"** to copy the deployment token
4. **📝 Save this token**

5. **Install Azure Static Web Apps CLI:**
   ```powershell
   npm install -g @azure/static-web-apps-cli
   ```

6. **Deploy from the build folder:**
   ```powershell
   cd frontend\build
   
   # Deploy (replace YOUR_TOKEN with the token you copied)
   swa deploy --app-location . --deployment-token YOUR_TOKEN
   ```

**Option B: Using GitHub (Better for updates)**

1. Push your code to GitHub repository
2. In Azure Portal, **delete** the current Static Web App
3. Create a **new** Static Web App, but this time:
   - Deployment source: **GitHub**
   - Sign in to GitHub
   - Select your repository and branch
   - Build presets: **React**
   - App location: `/frontend`
   - Output location: `build`
4. Azure will automatically deploy and create a GitHub Actions workflow

### Step 5: Configure Frontend Environment Variables

1. In your Static Web App, in the left menu, click **"Configuration"**
2. Click **"+ Add"** under Application settings
3. Add these settings:
   
   | Name | Value |
   |------|-------|
   | `REACT_APP_API_BASE` | `https://crop-intelligence-api.azurewebsites.net` |
   | `REACT_APP_MAPBOX_TOKEN` | Your Mapbox token |

4. Click **"Save"**

### Step 6: Update Backend CORS

Now that you have your frontend URL, update backend CORS:

1. Go back to your **App Service** (`crop-intelligence-api`)
2. Click **"CORS"** in the left menu
3. Add your frontend URL:
   ```
   https://crop-intelligence-frontend.azurestaticapps.net
   ```
   (Replace with your actual Static Web App URL)
4. Click **"Save"**

### Step 7: Test Your Application

1. Open your frontend URL in a browser:
   ```
   https://crop-intelligence-frontend.azurestaticapps.net
   ```

2. **Test the following:**
   - ✅ Page loads correctly
   - ✅ Can register a new account
   - ✅ Can login
   - ✅ Weather data loads
   - ✅ Can use crop predictor
   - ✅ Chatbot responds
   - ✅ Disease detection works

3. **If something doesn't work:**
   - Open browser DevTools (F12)
   - Check the Console tab for errors
   - Check Network tab for failed API calls

---

## 🎯 Quick Reference - Your App URLs

After deployment, your app will be available at:

- **Frontend**: `https://crop-intelligence-frontend.azurestaticapps.net`
- **Backend API**: `https://crop-intelligence-api.azurewebsites.net`

**Save these URLs!**

---

## 🔧 Troubleshooting Common Issues

### Backend Issues

**Problem: App Service shows "Application Error"**
- Solution: Check logs
  1. Go to App Service → **Log stream**
  2. Look for Python errors
  3. Common fixes:
     - Verify all environment variables are set
     - Check MongoDB connection string is correct
     - Ensure startup command is set

**Problem: 500 Internal Server Error**
- Check environment variables (especially `MONGO_URI`, `GEMINI_API_KEY`)
- Verify MongoDB network access allows Azure IPs
- Check Log stream for specific errors

**Problem: Backend is slow**
- Upgrade from B1 to P1V2 plan
- Increase workers in startup command

### Frontend Issues

**Problem: Can't login or API calls fail**
- Check CORS settings on backend
- Verify `REACT_APP_API_BASE` is correct (no trailing slash)
- Check browser console for CORS errors

**Problem: Page shows but data doesn't load**
- Verify backend is running (visit backend URL)
- Check frontend environment variables
- Check browser DevTools Network tab

**Problem: "Failed to fetch" errors**
- Backend CORS not configured correctly
- Backend app might be stopped - restart it
- Check frontend .env has correct backend URL

### Database Issues

**Problem: MongoDB connection timeout**
- Check Network Access in MongoDB Atlas
- Verify connection string has correct password
- Ensure `0.0.0.0/0` is in IP whitelist

**Problem: Authentication failed**
- Double-check database user password
- Verify username in connection string matches

---

## 💰 Cost Management

### Current Setup Costs (Approximate)

**Free/Development Tier:**
- App Service (B1): **$13/month**
- Static Web App (Free): **$0/month**
- MongoDB Atlas (M0): **$0/month**
- **Total: ~$13/month**

**Production Tier:**
- App Service (P1V2): **$80/month**
- Static Web App (Standard): **$9/month**
- MongoDB Atlas (M10): **$57/month**
- Application Insights: **~$2/month** (5GB free)
- **Total: ~$148/month**

### How to Monitor Costs

1. In Azure Portal, search for **"Cost Management + Billing"**
2. Click **"Cost analysis"**
3. Filter by Resource Group: `crop-intelligence-rg`
4. Set up **Budget alerts**:
   - Click **"Budgets"**
   - **"+ Add"**
   - Set amount (e.g., $20/month)
   - Set alert at 80% and 100%

### How to Reduce Costs

**If not using the app:**
1. **Stop the App Service** (doesn't delete, just pauses billing):
   - Go to App Service → Click **"Stop"** in top menu
   - Click **"Start"** when you need it again

**For development:**
- Use **B1 tier** instead of P1V2
- Use **Free Static Web App** tier
- Use **M0 Free MongoDB Atlas** tier

---

## 📊 Monitoring Your App

### Enable Application Insights

1. Go to your App Service
2. In the left menu, click **"Application Insights"**
3. Click **"Turn on Application Insights"**
4. Click **"Apply"**
5. After a few minutes, you'll see:
   - Performance metrics
   - Failed requests
   - Response times
   - Live metrics

### Set Up Alerts

1. Go to App Service
2. Click **"Alerts"** in left menu
3. Click **"+ Create"** → **"Alert rule"**
4. Example alert:
   - Signal: **HTTP Server Errors**
   - Threshold: **Greater than 5** in 5 minutes
   - Action: Send email notification

---

## 🔒 Security Checklist

- ✅ Enable HTTPS Only on App Service
- ✅ Use strong JWT secret key
- ✅ Keep API keys in App Settings (not in code)
- ✅ Restrict MongoDB network access to Azure IPs (optional)
- ✅ Enable Application Insights for monitoring
- ✅ Set up budget alerts
- ✅ Never commit `.env` files to Git
- ✅ Use managed identity for Azure resources (advanced)

---

## 🚀 Next Steps

1. **Test thoroughly** - Try all features
2. **Set up custom domain** (optional):
   - Go to Static Web App → **Custom domains**
   - Add your domain
3. **Enable CI/CD** with GitHub:
   - Automatically deploy on git push
4. **Monitor performance**:
   - Use Application Insights
5. **Scale as needed**:
   - Upgrade App Service Plan when traffic increases

---

## 📞 Need Help?

**Check the logs first:**
- Backend: App Service → **Log stream**
- Frontend: Browser DevTools (F12) → Console

**Common resources:**
- [Azure App Service Docs](https://docs.microsoft.com/azure/app-service/)
- [Azure Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps/)
- [MongoDB Atlas Docs](https://docs.mongodb.com/manual/)

**Still stuck?**
- Check the comprehensive [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md) guide
- Review error messages in Log stream
- Verify all environment variables are set correctly

---

## ✅ Deployment Checklist

Use this to track your progress:

**Part 1: MongoDB**
- [ ] Created MongoDB Atlas cluster
- [ ] Created database user and saved password
- [ ] Configured network access (0.0.0.0/0)
- [ ] Copied connection string with password

**Part 2: Backend**
- [ ] Created resource group
- [ ] Created App Service plan
- [ ] Created App Service
- [ ] Configured all environment variables
- [ ] Set startup command
- [ ] Deployed backend code
- [ ] Enabled CORS
- [ ] Verified backend URL works

**Part 3: Frontend**
- [ ] Updated frontend .env file
- [ ] Built frontend (npm run build)
- [ ] Created Static Web App
- [ ] Deployed frontend files
- [ ] Configured frontend environment variables
- [ ] Updated backend CORS with frontend URL
- [ ] Tested complete application

**Final**
- [ ] All features working
- [ ] Set up monitoring
- [ ] Set up budget alerts
- [ ] Documented URLs

---

**🎉 Congratulations!** Your Crop Intelligence App is now live on Azure!

**Your URLs:**
- Frontend: `https://your-app-name.azurestaticapps.net`
- Backend: `https://your-api-name.azurewebsites.net`
