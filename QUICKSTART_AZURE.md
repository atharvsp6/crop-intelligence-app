# Quick Start Guide for Azure Deployment

This is a simplified quick-start guide. For comprehensive instructions, see [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md).

## Prerequisites

- Azure account ([Get free account](https://azure.microsoft.com/free/))
- Azure CLI installed ([Install guide](https://docs.microsoft.com/cli/azure/install-azure-cli))
- Node.js and npm installed
- MongoDB Atlas account ([Sign up](https://www.mongodb.com/cloud/atlas))

## Quick Deployment Steps

### 1. Clone and Setup

```bash
cd crop-intelligence-app

# Copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit .env files with your actual values
# backend/.env - Add MongoDB URI, Gemini API key, etc.
# frontend/.env - Add backend URL and Mapbox token
```

### 2. Login to Azure

```bash
az login
```

### 3. Deploy Using Automated Script (Linux/Mac)

```bash
chmod +x deploy-azure.sh
./deploy-azure.sh
```

### 4. Manual Deployment (Windows/Alternative)

**Backend:**
```powershell
# Create resource group
az group create --name crop-intelligence-rg --location eastus

# Create app service plan
az appservice plan create --name crop-intelligence-plan --resource-group crop-intelligence-rg --sku B1 --is-linux

# Create web app
az webapp create --name crop-intelligence-api --resource-group crop-intelligence-rg --plan crop-intelligence-plan --runtime "PYTHON:3.11"

# Deploy backend
cd backend
Compress-Archive -Path * -DestinationPath ..\backend.zip
az webapp deployment source config-zip --name crop-intelligence-api --resource-group crop-intelligence-rg --src ..\backend.zip
cd ..
```

**Frontend:**
```powershell
# Create static web app
az staticwebapp create --name crop-intelligence-frontend --resource-group crop-intelligence-rg --location eastus2

# Build and deploy
cd frontend
npm install
npm run build

# Get deployment token
az staticwebapp secrets list --name crop-intelligence-frontend --resource-group crop-intelligence-rg --query "properties.apiKey" -o tsv

# Install SWA CLI and deploy
npm install -g @azure/static-web-apps-cli
cd build
swa deploy --deployment-token <your-token> --app-location .
```

### 5. Configure Environment Variables

**Backend Settings:**
```bash
az webapp config appsettings set --name crop-intelligence-api --resource-group crop-intelligence-rg --settings `
  MONGO_URI="your-mongodb-connection-string" `
  JWT_SECRET_KEY="your-secret-key" `
  GEMINI_API_KEY="your-gemini-key" `
  FLASK_ENV="production"
```

**Frontend Settings:**
- Go to Azure Portal → Static Web Apps → Configuration
- Add: `REACT_APP_API_BASE=https://crop-intelligence-api.azurewebsites.net`

### 6. Enable CORS

```bash
az webapp cors add --name crop-intelligence-api --resource-group crop-intelligence-rg --allowed-origins "https://crop-intelligence-frontend.azurestaticapps.net"
```

## Your App URLs

- **Backend API**: `https://crop-intelligence-api.azurewebsites.net`
- **Frontend**: `https://crop-intelligence-frontend.azurestaticapps.net`

## Troubleshooting

**View logs:**
```bash
az webapp log tail --name crop-intelligence-api --resource-group crop-intelligence-rg
```

**Common issues:**
- Backend not starting → Check logs and environment variables
- Frontend can't connect → Verify CORS and API URL
- MongoDB errors → Check connection string and network access

## Cost

**Estimated monthly cost:**
- Development (B1 tier): ~$13/month
- Production (P1V2 tier): ~$148/month

## Need Help?

See [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md) for:
- Detailed step-by-step instructions
- MongoDB Atlas setup
- Scaling and performance tuning
- Security best practices
- CI/CD setup
- Custom domain configuration

## Important Notes

⚠️ **App names must be globally unique**. If `crop-intelligence-api` is taken, use `crop-intelligence-api-yourname`.

⚠️ **Never commit .env files** with real credentials to version control!

⚠️ **Configure all environment variables** before testing the app.
