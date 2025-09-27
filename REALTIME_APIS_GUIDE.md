# Real-Time Market Data APIs Configuration
# Free APIs for live commodity pricing

## 1. Alpha Vantage (Recommended)
- **URL**: https://www.alphavantage.co/support/#api-key
- **Free Tier**: 500 API calls per day, 5 per minute
- **Features**: Real-time and historical commodity data
- **Setup**: Get free API key from above URL

## 2. Yahoo Finance (No API key needed)
- **Features**: Real-time futures and commodity data
- **Unlimited**: No rate limits for basic usage
- **Commodities**: Wheat (ZW=F), Corn (ZC=F), Soybean (ZS=F), etc.

## 3. Commodities API
- **URL**: https://commodities-api.com/
- **Free Tier**: 1000 requests per month
- **Features**: Real-time commodity prices in multiple currencies
- **Setup**: Register for free API key

## 4. World Bank Commodity Prices
- **URL**: https://www.worldbank.org/en/research/commodity-markets
- **Free**: Unlimited access
- **Features**: Historical and some real-time data

## 5. Indian Government APIs
- **AgMarkNet**: https://agmarknet.gov.in/ (Indian mandi prices)
- **Data.gov.in**: Real-time agricultural commodity prices
- **Setup**: Register for API key at data.gov.in

## WebSocket Implementation
For truly real-time data, we'll implement:
- WebSocket connections for live price streaming
- Auto-refresh every 30 seconds for free tier APIs
- Fallback mechanisms when APIs fail
- Caching to optimize API usage

## Setup Instructions:
1. Get Alpha Vantage API key (most important)
2. Get Commodities API key (backup)
3. Get Data.gov.in API key (for Indian prices)
4. Environment variables will be configured automatically