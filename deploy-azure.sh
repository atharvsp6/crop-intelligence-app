#!/bin/bash
# Quick Azure Deployment Script for Crop Intelligence App
# This script helps deploy the application to Azure

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}Crop Intelligence Azure Deployment${NC}"
echo -e "${GREEN}==================================${NC}"
echo

# Configuration
RESOURCE_GROUP="crop-intelligence-rg"
LOCATION="eastus"
BACKEND_APP_NAME="crop-intelligence-api"
FRONTEND_APP_NAME="crop-intelligence-frontend"
APP_SERVICE_PLAN="crop-intelligence-plan"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed.${NC}"
    echo "Please install it from: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

echo -e "${YELLOW}Checking Azure login status...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}Not logged in. Please login to Azure:${NC}"
    az login
else
    echo -e "${GREEN}✓ Already logged in to Azure${NC}"
fi

echo
echo -e "${YELLOW}Select deployment option:${NC}"
echo "1) Deploy Backend only"
echo "2) Deploy Frontend only"
echo "3) Deploy Both (Full deployment)"
echo "4) Create Azure resources only (no deployment)"
read -p "Enter choice [1-4]: " choice

deploy_backend() {
    echo
    echo -e "${GREEN}Deploying Backend to Azure App Service...${NC}"
    
    # Check if resource group exists
    if ! az group show --name $RESOURCE_GROUP &> /dev/null; then
        echo -e "${YELLOW}Creating resource group...${NC}"
        az group create --name $RESOURCE_GROUP --location $LOCATION
    fi
    
    # Check if app service plan exists
    if ! az appservice plan show --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP &> /dev/null; then
        echo -e "${YELLOW}Creating App Service Plan...${NC}"
        az appservice plan create \
            --name $APP_SERVICE_PLAN \
            --resource-group $RESOURCE_GROUP \
            --sku B1 \
            --is-linux
    fi
    
    # Check if web app exists
    if ! az webapp show --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
        echo -e "${YELLOW}Creating Web App...${NC}"
        az webapp create \
            --name $BACKEND_APP_NAME \
            --resource-group $RESOURCE_GROUP \
            --plan $APP_SERVICE_PLAN \
            --runtime "PYTHON:3.11"
    fi
    
    # Set startup command
    echo -e "${YELLOW}Configuring startup command...${NC}"
    az webapp config set \
        --name $BACKEND_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --startup-file "startup.sh"
    
    # Deploy code
    echo -e "${YELLOW}Deploying backend code...${NC}"
    cd backend
    zip -r ../backend-deploy.zip . -x "*.git*" -x "*__pycache__*" -x "*.pyc" -x "*.env"
    cd ..
    
    az webapp deployment source config-zip \
        --name $BACKEND_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --src backend-deploy.zip
    
    rm backend-deploy.zip
    
    echo -e "${GREEN}✓ Backend deployed successfully!${NC}"
    echo -e "Backend URL: ${GREEN}https://${BACKEND_APP_NAME}.azurewebsites.net${NC}"
    echo
    echo -e "${YELLOW}IMPORTANT: Don't forget to configure environment variables!${NC}"
    echo "Run: az webapp config appsettings set --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP --settings KEY=VALUE"
}

deploy_frontend() {
    echo
    echo -e "${GREEN}Deploying Frontend to Azure Static Web Apps...${NC}"
    
    # Check if resource group exists
    if ! az group show --name $RESOURCE_GROUP &> /dev/null; then
        echo -e "${YELLOW}Creating resource group...${NC}"
        az group create --name $RESOURCE_GROUP --location $LOCATION
    fi
    
    # Check if static web app exists
    if ! az staticwebapp show --name $FRONTEND_APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
        echo -e "${YELLOW}Creating Static Web App...${NC}"
        az staticwebapp create \
            --name $FRONTEND_APP_NAME \
            --resource-group $RESOURCE_GROUP \
            --location "eastus2"
    fi
    
    # Build frontend
    echo -e "${YELLOW}Building frontend...${NC}"
    cd frontend
    
    if [ ! -f ".env" ]; then
        echo -e "${RED}Warning: .env file not found in frontend directory${NC}"
        echo "Creating .env from .env.example..."
        cp .env.example .env
        echo -e "${YELLOW}Please edit frontend/.env with your backend URL and API keys${NC}"
        read -p "Press Enter after editing .env file..."
    fi
    
    npm install
    npm run build
    
    # Get deployment token
    echo -e "${YELLOW}Getting deployment token...${NC}"
    DEPLOY_TOKEN=$(az staticwebapp secrets list \
        --name $FRONTEND_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --query "properties.apiKey" \
        --output tsv)
    
    # Deploy using SWA CLI
    if ! command -v swa &> /dev/null; then
        echo -e "${YELLOW}Installing Azure Static Web Apps CLI...${NC}"
        npm install -g @azure/static-web-apps-cli
    fi
    
    cd build
    swa deploy --deployment-token "$DEPLOY_TOKEN" --app-location .
    cd ../..
    
    echo -e "${GREEN}✓ Frontend deployed successfully!${NC}"
    echo -e "Frontend URL: ${GREEN}https://${FRONTEND_APP_NAME}.azurestaticapps.net${NC}"
}

create_resources() {
    echo
    echo -e "${GREEN}Creating Azure resources...${NC}"
    
    # Create resource group
    echo -e "${YELLOW}Creating resource group...${NC}"
    az group create --name $RESOURCE_GROUP --location $LOCATION
    
    # Create app service plan
    echo -e "${YELLOW}Creating App Service Plan...${NC}"
    az appservice plan create \
        --name $APP_SERVICE_PLAN \
        --resource-group $RESOURCE_GROUP \
        --sku B1 \
        --is-linux
    
    # Create web app
    echo -e "${YELLOW}Creating Web App for Backend...${NC}"
    az webapp create \
        --name $BACKEND_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --plan $APP_SERVICE_PLAN \
        --runtime "PYTHON:3.11"
    
    # Create static web app
    echo -e "${YELLOW}Creating Static Web App for Frontend...${NC}"
    az staticwebapp create \
        --name $FRONTEND_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --location "eastus2"
    
    echo -e "${GREEN}✓ All Azure resources created successfully!${NC}"
    echo
    echo "Backend App: https://${BACKEND_APP_NAME}.azurewebsites.net"
    echo "Frontend App: https://${FRONTEND_APP_NAME}.azurestaticapps.net"
}

case $choice in
    1)
        deploy_backend
        ;;
    2)
        deploy_frontend
        ;;
    3)
        deploy_backend
        deploy_frontend
        ;;
    4)
        create_resources
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}==================================${NC}"
echo
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Configure environment variables for the backend"
echo "2. Update CORS settings to allow frontend domain"
echo "3. Test the application"
echo
echo "For detailed instructions, see AZURE_DEPLOYMENT.md"
