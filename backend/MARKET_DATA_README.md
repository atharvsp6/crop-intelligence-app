# Real-Time Market Data Integration

## Overview
The crop intelligence app now uses real-time agricultural market data instead of hardcoded values for ROI calculations and market trends analysis.

## Data Sources

### Primary Sources
1. **Yahoo Finance** - Real-time futures prices for major commodities
2. **Alpha Vantage** - Commodity price APIs (requires free API key)
3. **World Bank Commodity Price Data** - Monthly commodity price indices
4. **USDA NASS** - Agricultural statistics and production costs

### API Keys Required
Add these to your `.env` file:

```env
# Market Data APIs (Free Tier Available)
ALPHA_VANTAGE_API_KEY=get_free_key_from_alphavantage.co
QUANDL_API_KEY=get_free_key_from_nasdaq.com/quandl
USDA_API_KEY=get_free_key_from_nass.usda.gov
```

### Getting API Keys

1. **Alpha Vantage** (Free 5 requests/minute, 500/day)
   - Visit: https://www.alphavantage.co/support/#api-key
   - Sign up for free API key
   - Provides real-time commodity prices

2. **USDA NASS** (Free, no rate limits)
   - Visit: https://quickstats.nass.usda.gov/api
   - Register for free API key
   - Provides agricultural production costs and statistics

3. **Quandl/Nasdaq Data Link** (Free 50 requests/day)
   - Visit: https://data.nasdaq.com/sign-up
   - Sign up for free account
   - Provides economic and financial data

## Features

### Real-Time Pricing
- **Live commodity prices** from futures markets
- **Price change indicators** (24h change, percentage)
- **Data source attribution** (which API provided the data)
- **Regional price adjustments** for different markets

### Production Costs
- **Real USDA cost data** for seed, fertilizer, labor, etc.
- **Regional cost variations** (US, EU, India, Brazil, Australia)
- **Inflation adjustments** for current year estimates
- **Detailed cost breakdowns** per acre and total

### Market Analysis
- **Historical price charts** (30, 60, 90 day periods)
- **Price volatility calculations** (annualized)
- **Moving averages** (7-day, 30-day)
- **Trend analysis** (upward, downward, stable)
- **Support/resistance levels**

### Risk Assessment
- **Market volatility risk** based on price movements
- **ROI-based risk scoring** (high/medium/low)
- **Recommendations** based on real market conditions

## API Endpoints

### Real-Time Price Data
```
GET /api/financial/real-time-price?commodity=wheat&region=US
```
Returns current market price with change indicators.

### Production Costs
```
GET /api/financial/production-costs?crop_type=wheat&region=US&area_acres=100
```
Returns detailed cost breakdown based on real USDA data.

### Historical Prices
```
GET /api/financial/historical-prices?commodity=wheat&days=30
```
Returns price history for trend analysis.

### Enhanced Market Trends
```
GET /api/financial/market-trends?crop_type=wheat&days=30
```
Now uses real data instead of simulated trends.

## Data Quality & Fallbacks

### Fallback System
- **Primary**: Yahoo Finance (most reliable)
- **Secondary**: Alpha Vantage (if API key available)
- **Tertiary**: World Bank data
- **Final**: Realistic fallback prices (current 2024 market rates)

### Realistic Fallback Prices (2024)
- Wheat: $0.52/kg
- Rice: $0.78/kg  
- Corn: $0.42/kg
- Soybean: $0.89/kg
- Cotton: $1.85/kg

### Cache System
- **1-hour cache** for real-time prices
- **MongoDB storage** for historical data
- **Automatic refresh** when cache expires

## Implementation Details

### Market Data Service (`market_data_service.py`)
- Handles all external API calls
- Implements fallback logic
- Manages data caching
- Provides regional adjustments

### Updated Financial Analyzer (`financial_analyzer.py`)
- Uses real market data for all calculations
- Enhanced risk assessment with market volatility
- Comprehensive recommendations based on real conditions
- Detailed cost analysis with USDA data

## Benefits

### For Users
- **Accurate ROI calculations** based on current market conditions
- **Real-time market insights** for better decision making
- **Comprehensive cost analysis** using USDA production data
- **Risk assessment** based on actual market volatility

### For Developers  
- **Multiple data sources** ensure reliability
- **Fallback system** prevents application failures
- **Caching system** optimizes API usage
- **Comprehensive error handling**

## Usage Example

```javascript
// Frontend: Get real-time wheat price
const response = await fetch('/api/financial/real-time-price?commodity=wheat', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const data = await response.json();
console.log('Current wheat price:', data.data.price, 'USD/kg');
console.log('24h change:', data.data.change_percent, '%');
console.log('Data source:', data.data.source);
```

## Data Sources Attribution
- Commodity futures prices: Yahoo Finance
- Agricultural statistics: USDA National Agricultural Statistics Service  
- Global commodity indices: World Bank Open Data
- Financial data: Alpha Vantage, Quandl/Nasdaq Data Link

All price calculations now use real market data with appropriate fallbacks to ensure the application always provides meaningful, up-to-date information for agricultural investment decisions.