# Deploying Crop Intelligence App to Azure

This guide walks you through deploying both the frontend (React) and backend (Flask) to Azure.

## Architecture Overview

- **Frontend**: Azure Static Web Apps (React application)
- **Backend**: Azure App Service (Python Flask API)
- **Database**: MongoDB Atlas (external)

## Prerequisites

1. **Azure Account**: [Sign up for free](https://azure.microsoft.com/free/)
2. **Azure CLI**: [Install Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli)
3. **Node.js & npm**: For building the frontend
4. **Python 3.11**: For local testing
5. **Git**: For deployment
6. **MongoDB Atlas Account**: [Sign up](https://www.mongodb.com/cloud/atlas)

## Part 1: Deploy Backend (Flask API) to Azure App Service

### Step 1: Login to Azure

```bash
az login
```

### Step 2: Create Resource Group

```bash
# Choose a region near you (e.g., eastus, westus2, centralindia)
az group create --name crop-intelligence-rg --location eastus
```

### Step 3: Create App Service Plan

```bash
# Using B1 (Basic) tier - good for development/small production
az appservice plan create \
  --name crop-intelligence-plan \
  --resource-group crop-intelligence-rg \
  --sku B1 \
  --is-linux
```

For production, consider upgrading to P1V2 or higher:
```bash
az appservice plan create \
  --name crop-intelligence-plan \
  --resource-group crop-intelligence-rg \
  --sku P1V2 \
  --is-linux
```

### Step 4: Create Web App for Backend

```bash
az webapp create \
  --name crop-intelligence-api \
  --resource-group crop-intelligence-rg \
  --plan crop-intelligence-plan \
  --runtime "PYTHON:3.11"
```

**Note**: The name `crop-intelligence-api` must be globally unique. If taken, try `crop-intelligence-api-yourname` or similar.

### Step 5: Configure Backend Environment Variables

```bash
# Set MongoDB connection string
az webapp config appsettings set \
  --name crop-intelligence-api \
  --resource-group crop-intelligence-rg \
  --settings MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority"

# Set JWT secret (generate a strong random key)
az webapp config appsettings set \
  --name crop-intelligence-api \
  --resource-group crop-intelligence-rg \
  --settings JWT_SECRET_KEY="your-super-secret-jwt-key-change-this"

# Set Gemini API key
az webapp config appsettings set \
  --name crop-intelligence-api \
  --resource-group crop-intelligence-rg \
  --settings GEMINI_API_KEY="your-gemini-api-key"

# Set other environment variables
az webapp config appsettings set \
  --name crop-intelligence-api \
  --resource-group crop-intelligence-rg \
  --settings \
    FLASK_ENV="production" \
    FLASK_DEBUG="0" \
    TFHUB_CACHE_DIR="/home/site/wwwroot/.tfhub_cache" \
    DISEASE_SERVICE_URL="https://plant-disease-detection-api-nni5.onrender.com/predict" \
    DISEASE_SERVICE_TIMEOUT="30"
```

### Step 6: Configure Startup Command

```bash
az webapp config set \
  --name crop-intelligence-api \
  --resource-group crop-intelligence-rg \
  --startup-file "startup.sh"
```

### Step 7: Deploy Backend Code

Navigate to the backend directory and deploy:

```bash
cd backend

# Initialize git if not already done
git init
git add .
git commit -m "Initial backend deployment"

# Configure deployment
az webapp deployment source config-local-git \
  --name crop-intelligence-api \
  --resource-group crop-intelligence-rg

# Get deployment credentials
az webapp deployment list-publishing-credentials \
  --name crop-intelligence-api \
  --resource-group crop-intelligence-rg \
  --query "{username:publishingUserName,password:publishingPassword}" \
  --output json

# Add Azure remote and push (use credentials from above)
git remote add azure https://crop-intelligence-api.scm.azurewebsites.net:443/crop-intelligence-api.git
git push azure master
```

Alternatively, deploy using ZIP:

```bash
cd backend
zip -r backend.zip . -x "*.git*" -x "*__pycache__*" -x "*.pyc"

az webapp deployment source config-zip \
  --name crop-intelligence-api \
  --resource-group crop-intelligence-rg \
  --src backend.zip
```

### Step 8: Enable CORS for Backend

```bash
az webapp cors add \
  --name crop-intelligence-api \
  --resource-group crop-intelligence-rg \
  --allowed-origins "https://crop-intelligence-frontend.azurestaticapps.net"
```

You can add multiple origins or use `*` for testing (not recommended for production).

### Step 9: Verify Backend Deployment

```bash
# Check logs
az webapp log tail \
  --name crop-intelligence-api \
  --resource-group crop-intelligence-rg

# Or open in browser
az webapp browse \
  --name crop-intelligence-api \
  --resource-group crop-intelligence-rg
```

Your backend should now be live at: `https://crop-intelligence-api.azurewebsites.net`

## Part 2: Deploy Frontend (React) to Azure Static Web Apps

### Step 1: Create Static Web App

```bash
az staticwebapp create \
  --name crop-intelligence-frontend \
  --resource-group crop-intelligence-rg \
  --location eastus2
```

**Note**: Static Web Apps are available in limited regions. Use `eastus2`, `westus2`, `centralus`, or `westeurope`.

### Step 2: Build Frontend Locally

```bash
cd frontend

# Create .env file with your backend URL
echo "REACT_APP_API_BASE=https://crop-intelligence-api.azurewebsites.net" > .env
echo "REACT_APP_MAPBOX_TOKEN=your-mapbox-token" >> .env

# Install dependencies and build
npm install
npm run build
```

### Step 3: Deploy Frontend

Option A: Deploy using Azure CLI

```bash
# Get deployment token
az staticwebapp secrets list \
  --name crop-intelligence-frontend \
  --resource-group crop-intelligence-rg \
  --query "properties.apiKey" \
  --output tsv

# Install Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Deploy
cd frontend/build
swa deploy --app-location . --deployment-token <token-from-above>
```

Option B: Deploy from GitHub (Recommended for CI/CD)

1. Push your code to GitHub
2. Go to Azure Portal → Static Web Apps → crop-intelligence-frontend
3. Click "Manage deployment token" and copy it
4. In GitHub, go to Settings → Secrets → New repository secret
5. Add `AZURE_STATIC_WEB_APPS_API_TOKEN` with the deployment token
6. Azure will automatically create a GitHub Actions workflow

Configure the workflow to use these settings:
- **App location**: `/frontend`
- **Api location**: (leave empty)
- **Output location**: `build`

### Step 4: Configure Frontend Environment Variables

In Azure Portal:
1. Go to your Static Web App
2. Click "Configuration"
3. Add application settings:
   - `REACT_APP_API_BASE`: `https://crop-intelligence-api.azurewebsites.net`
   - `REACT_APP_MAPBOX_TOKEN`: your mapbox token

### Step 5: Configure Custom Domain (Optional)

```bash
# Add custom domain
az staticwebapp hostname set \
  --name crop-intelligence-frontend \
  --resource-group crop-intelligence-rg \
  --hostname www.yourdomain.com
```

Then add a CNAME record in your DNS:
- Name: `www`
- Value: `<your-static-app>.azurestaticapps.net`

## Part 3: MongoDB Atlas Setup

### Step 1: Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (M0 tier)
3. Choose a cloud provider and region (preferably close to Azure region)

### Step 2: Create Database User

1. Database Access → Add New Database User
2. Create a user with read/write access
3. Save the username and password

### Step 3: Configure Network Access

1. Network Access → Add IP Address
2. For Azure: Add `0.0.0.0/0` (allow from anywhere) 
   - More secure: Get Azure App Service outbound IPs and whitelist them
   
```bash
az webapp show \
  --name crop-intelligence-api \
  --resource-group crop-intelligence-rg \
  --query outboundIpAddresses \
  --output tsv
```

### Step 4: Get Connection String

1. Clusters → Connect → Connect your application
2. Copy the connection string
3. Replace `<password>` with your database user password
4. Update the backend's `MONGO_URI` environment variable

## Part 4: Configure CORS and API Communication

### Update Backend CORS Settings

Update the CORS configuration in your backend to allow your frontend domain:

```bash
az webapp config appsettings set \
  --name crop-intelligence-api \
  --resource-group crop-intelligence-rg \
  --settings ALLOWED_ORIGINS="https://crop-intelligence-frontend.azurestaticapps.net"
```

## Part 5: Monitoring and Troubleshooting

### View Backend Logs

```bash
# Stream logs
az webapp log tail \
  --name crop-intelligence-api \
  --resource-group crop-intelligence-rg

# Download logs
az webapp log download \
  --name crop-intelligence-api \
  --resource-group crop-intelligence-rg \
  --log-file backend-logs.zip
```

### Enable Application Insights (Recommended)

```bash
# Create Application Insights
az monitor app-insights component create \
  --app crop-intelligence-insights \
  --location eastus \
  --resource-group crop-intelligence-rg

# Link to Web App
az monitor app-insights component connect-webapp \
  --app crop-intelligence-insights \
  --resource-group crop-intelligence-rg \
  --web-app crop-intelligence-api
```

### Common Issues

#### Backend not starting
- Check logs: `az webapp log tail`
- Verify `startup.sh` has proper line endings (LF, not CRLF)
- Ensure all dependencies in `requirements.txt` are compatible

#### Frontend can't connect to backend
- Verify CORS is enabled on backend
- Check `REACT_APP_API_BASE` environment variable
- Ensure backend is running and accessible

#### MongoDB connection fails
- Verify connection string format
- Check network access whitelist in Atlas
- Ensure database user credentials are correct

## Part 6: Scaling and Performance

### Scale Backend

```bash
# Scale up (more powerful instance)
az appservice plan update \
  --name crop-intelligence-plan \
  --resource-group crop-intelligence-rg \
  --sku P1V2

# Scale out (more instances)
az appservice plan update \
  --name crop-intelligence-plan \
  --resource-group crop-intelligence-rg \
  --number-of-workers 2
```

### Enable CDN for Frontend

```bash
# Create CDN profile
az cdn profile create \
  --name crop-intelligence-cdn \
  --resource-group crop-intelligence-rg \
  --sku Standard_Microsoft

# Create CDN endpoint
az cdn endpoint create \
  --name crop-intelligence-endpoint \
  --profile-name crop-intelligence-cdn \
  --resource-group crop-intelligence-rg \
  --origin crop-intelligence-frontend.azurestaticapps.net
```

## Cost Estimation

**Free Tier (Development):**
- App Service: B1 tier = ~$13/month
- Static Web Apps: Free tier = $0
- MongoDB Atlas: M0 tier = $0
- **Total**: ~$13/month

**Production Tier:**
- App Service: P1V2 tier = ~$80/month
- Static Web Apps: Standard tier = $9/month
- MongoDB Atlas: M10 tier = ~$57/month
- Application Insights = ~$2/month (first 5GB free)
- **Total**: ~$148/month

## Security Best Practices

1. **Enable HTTPS Only**:
```bash
az webapp update \
  --name crop-intelligence-api \
  --resource-group crop-intelligence-rg \
  --https-only true
```

2. **Enable Managed Identity** for secure access to Azure resources

3. **Use Azure Key Vault** for secrets:
```bash
az keyvault create \
  --name crop-intelligence-vault \
  --resource-group crop-intelligence-rg \
  --location eastus
```

4. **Set up Azure Front Door** for DDoS protection

5. **Enable Azure Monitor** for alerts and monitoring

## Continuous Deployment

### GitHub Actions for Backend

Create `.github/workflows/backend-deploy.yml`:

```yaml
name: Deploy Backend to Azure

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      
      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: crop-intelligence-api
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: ./backend
```

### GitHub Actions for Frontend

Azure Static Web Apps automatically creates a GitHub Actions workflow when connected.

## Next Steps

1. **Configure custom domain** for professional URLs
2. **Set up monitoring** with Application Insights
3. **Enable auto-scaling** based on traffic
4. **Configure backup** for MongoDB Atlas
5. **Set up staging environment** for testing
6. **Implement CI/CD pipelines** with GitHub Actions

## Useful Commands Reference

```bash
# Restart backend
az webapp restart --name crop-intelligence-api --resource-group crop-intelligence-rg

# Update app settings
az webapp config appsettings set --name crop-intelligence-api --resource-group crop-intelligence-rg --settings KEY=VALUE

# View current configuration
az webapp config show --name crop-intelligence-api --resource-group crop-intelligence-rg

# Delete resources (careful!)
az group delete --name crop-intelligence-rg --yes
```

## Support

For issues:
- [Azure Support](https://azure.microsoft.com/support/)
- [Azure Documentation](https://docs.microsoft.com/azure/)
- [MongoDB Atlas Support](https://www.mongodb.com/support)

---

**Congratulations!** Your Crop Intelligence App is now deployed to Azure! 🎉

Access your app at:
- Frontend: `https://crop-intelligence-frontend.azurestaticapps.net`
- Backend API: `https://crop-intelligence-api.azurewebsites.net`
