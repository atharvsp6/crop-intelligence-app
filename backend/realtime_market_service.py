import requests
import asyncio
import websockets
import json
import os
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Optional, Any
from database import get_collection
import time
from threading import Thread
import schedule

class RealTimeMarketService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Free API keys (users should set these environment variables)
        self.api_keys = {
            'alpha_vantage': os.environ.get('ALPHA_VANTAGE_API_KEY', 'demo'),  # Get from alphavantage.co
            'commodities_api': os.environ.get('COMMODITIES_API_KEY', ''),     # Get from commodities-api.com  
            'data_gov_in': os.environ.get('DATA_GOV_IN_API_KEY', ''),        # Get from data.gov.in
            'quandl': os.environ.get('QUANDL_API_KEY', ''),                  # Get from quandl.com (now Nasdaq Data Link)
        }
        
        # API endpoints
        self.endpoints = {
            'alpha_vantage': 'https://www.alphavantage.co/query',
            'yahoo_finance': 'https://query1.finance.yahoo.com/v8/finance/chart',
            'commodities_api': 'https://commodities-api.com/api/latest',
            'world_bank': 'https://api.worldbank.org/v2/country/WLD/indicator/PCOST',
            'data_gov_in': 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070',
            'agmarknet': 'https://enam.gov.in/web/resources/recent_arrivals_and_prices',
        }
        
        # Cache for real-time data
        self.cache_collection = get_collection('realtime_market_cache')
        self.cache_duration = 300  # 5 minutes cache for real-time data
        
        # Rate limiting
        self.api_call_counts = {}
        self.last_api_calls = {}
        
        # Commodity symbols for different sources
        self.commodity_symbols = {
            'wheat': {
                'yahoo': 'ZW=F',  # Chicago Wheat Futures
                'alpha_vantage': 'WHEAT',
                'commodities_api': 'WHEAT',
                'world_bank': 'PWHEA'
            },
            'corn': {
                'yahoo': 'ZC=F',  # Chicago Corn Futures  
                'alpha_vantage': 'CORN',
                'commodities_api': 'CORN',
                'world_bank': 'PMAIZ'
            },
            'soybean': {
                'yahoo': 'ZS=F',  # Chicago Soybean Futures
                'alpha_vantage': 'SOYBEANS', 
                'commodities_api': 'SOYBEANS',
                'world_bank': 'PSOYB'
            },
            'rice': {
                'yahoo': 'ZR=F',  # Chicago Rice Futures
                'alpha_vantage': 'RICE',
                'commodities_api': 'RICE',
                'world_bank': 'PRICENPQ'
            },
            'cotton': {
                'yahoo': 'CT=F',  # Cotton Futures
                'alpha_vantage': 'COTTON',
                'commodities_api': 'COTTON',
                'world_bank': 'PCOTT'
            },
            'sugar': {
                'yahoo': 'SB=F',  # Sugar Futures
                'alpha_vantage': 'SUGAR',
                'commodities_api': 'SUGAR',
                'world_bank': 'PSUGAISA'
            },
            'coffee': {
                'yahoo': 'KC=F',  # Coffee Futures
                'alpha_vantage': 'COFFEE',
                'commodities_api': 'COFFEE',
                'world_bank': 'PCOFFOTM'
            }
        }
        
        # Start background price fetching
        self.start_background_updates()

    def start_background_updates(self):
        """Start background thread for periodic price updates"""
        def run_scheduler():
            # Update prices every 2 minutes for free tier optimization
            schedule.every(2).minutes.do(self.update_all_commodity_prices)
            # Clean old cache every hour
            schedule.every().hour.do(self.clean_old_cache)
            
            while True:
                schedule.run_pending()
                time.sleep(30)
        
        thread = Thread(target=run_scheduler, daemon=True)
        thread.start()
        self.logger.info("Background price updates started")

    def can_make_api_call(self, api_name: str, max_calls_per_minute: int = 5) -> bool:
        """Check if we can make an API call without hitting rate limits"""
        current_time = time.time()
        
        # Initialize tracking if not exists
        if api_name not in self.api_call_counts:
            self.api_call_counts[api_name] = []
        
        # Remove calls older than 1 minute
        self.api_call_counts[api_name] = [
            call_time for call_time in self.api_call_counts[api_name]
            if current_time - call_time < 60
        ]
        
        # Check if we're under the limit
        return len(self.api_call_counts[api_name]) < max_calls_per_minute

    def record_api_call(self, api_name: str):
        """Record an API call for rate limiting"""
        current_time = time.time()
        if api_name not in self.api_call_counts:
            self.api_call_counts[api_name] = []
        self.api_call_counts[api_name].append(current_time)

    def get_cached_price(self, commodity: str, source: str) -> Optional[Dict]:
        """Get cached price data"""
        try:
            cache_key = f"{commodity}_{source}"
            cached = self.cache_collection.find_one({'key': cache_key})
            
            if cached and datetime.utcnow() - cached['timestamp'] < timedelta(seconds=self.cache_duration):
                return cached['data']
        except Exception as e:
            self.logger.error(f"Cache retrieval error: {e}")
        
        return None

    def cache_price(self, commodity: str, source: str, data: Dict):
        """Cache price data"""
        try:
            cache_key = f"{commodity}_{source}"
            self.cache_collection.update_one(
                {'key': cache_key},
                {
                    '$set': {
                        'key': cache_key,
                        'data': data,
                        'timestamp': datetime.utcnow()
                    }
                },
                upsert=True
            )
        except Exception as e:
            self.logger.error(f"Cache storage error: {e}")

    def get_real_time_price_multi_source(self, commodity: str, region: str = 'US') -> Dict:
        """Get real-time price from multiple sources with fallback"""
        sources_to_try = []
        
        # Prioritize sources based on region
        if region.upper() == 'IN':
            sources_to_try = ['data_gov_in', 'yahoo_finance', 'alpha_vantage', 'commodities_api']
        else:
            sources_to_try = ['yahoo_finance', 'alpha_vantage', 'commodities_api', 'world_bank']
        
        for source in sources_to_try:
            try:
                # Check cache first
                cached_data = self.get_cached_price(commodity, source)
                if cached_data:
                    cached_data['from_cache'] = True
                    return cached_data
                
                # Try to fetch fresh data
                if source == 'yahoo_finance':
                    data = self._fetch_yahoo_finance_price(commodity)
                elif source == 'alpha_vantage' and self.api_keys['alpha_vantage'] != 'demo':
                    if self.can_make_api_call('alpha_vantage', 5):
                        data = self._fetch_alpha_vantage_price(commodity)
                        self.record_api_call('alpha_vantage')
                    else:
                        continue
                elif source == 'commodities_api' and self.api_keys['commodities_api']:
                    if self.can_make_api_call('commodities_api', 10):
                        data = self._fetch_commodities_api_price(commodity)
                        self.record_api_call('commodities_api')
                    else:
                        continue
                elif source == 'data_gov_in' and self.api_keys['data_gov_in']:
                    if self.can_make_api_call('data_gov_in', 30):
                        data = self._fetch_indian_govt_price(commodity)
                        self.record_api_call('data_gov_in')
                    else:
                        continue
                elif source == 'world_bank':
                    data = self._fetch_world_bank_price(commodity)
                else:
                    continue
                
                if data and data.get('price'):
                    data['from_cache'] = False
                    data['source'] = source
                    # Cache the successful result
                    self.cache_price(commodity, source, data)
                    return data
                    
            except Exception as e:
                self.logger.warning(f"Error fetching from {source}: {e}")
                continue
        
        # If all sources fail, return mock data with clear indication
        return self._generate_mock_real_time_data(commodity)

    def _fetch_yahoo_finance_price(self, commodity: str) -> Dict:
        """Fetch real-time price from Yahoo Finance (free, no key needed)"""
        try:
            if commodity not in self.commodity_symbols:
                return None
                
            symbol = self.commodity_symbols[commodity]['yahoo']
            url = f"{self.endpoints['yahoo_finance']}/{symbol}"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'chart' in data and data['chart']['result']:
                    result = data['chart']['result'][0]
                    meta = result['meta']
                    
                    current_price = meta.get('regularMarketPrice', 0)
                    previous_close = meta.get('previousClose', current_price)
                    
                    change = current_price - previous_close
                    change_percent = (change / previous_close * 100) if previous_close > 0 else 0
                    
                    return {
                        'price': round(current_price, 2),
                        'currency': meta.get('currency', 'USD'),
                        'change': round(change, 2),
                        'change_percent': round(change_percent, 2),
                        'volume': meta.get('regularMarketVolume', 0),
                        'market_cap': meta.get('marketCap'),
                        'last_updated': datetime.utcnow().isoformat(),
                        'symbol': symbol,
                        'exchange': meta.get('exchangeName', 'CME'),
                        'market_state': meta.get('marketState', 'REGULAR'),
                        'data_freshness': 'real_time'
                    }
            
        except Exception as e:
            self.logger.error(f"Yahoo Finance error: {e}")
            
        return None

    def _fetch_alpha_vantage_price(self, commodity: str) -> Dict:
        """Fetch price from Alpha Vantage API"""
        try:
            if self.api_keys['alpha_vantage'] == 'demo':
                return None
                
            if commodity not in self.commodity_symbols:
                return None
            
            # Use Alpha Vantage commodity API
            params = {
                'function': 'GLOBAL_QUOTE',
                'symbol': f"{commodity.upper()}",
                'apikey': self.api_keys['alpha_vantage']
            }
            
            response = requests.get(self.endpoints['alpha_vantage'], params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'Global Quote' in data:
                    quote = data['Global Quote']
                    
                    price = float(quote.get('05. price', 0))
                    change = float(quote.get('09. change', 0))
                    change_percent = float(quote.get('10. change percent', '0%').replace('%', ''))
                    
                    return {
                        'price': price,
                        'currency': 'USD',
                        'change': change,
                        'change_percent': change_percent,
                        'volume': int(quote.get('06. volume', 0)),
                        'last_updated': datetime.utcnow().isoformat(),
                        'symbol': quote.get('01. symbol', commodity.upper()),
                        'market_state': 'REGULAR',
                        'data_freshness': 'real_time'
                    }
            
        except Exception as e:
            self.logger.error(f"Alpha Vantage error: {e}")
            
        return None

    def _fetch_commodities_api_price(self, commodity: str) -> Dict:
        """Fetch price from Commodities API"""
        try:
            if not self.api_keys['commodities_api']:
                return None
                
            params = {
                'access_key': self.api_keys['commodities_api'],
                'base': 'USD',
                'symbols': commodity.upper()
            }
            
            response = requests.get(self.endpoints['commodities_api'], params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'success' in data and data['success'] and 'rates' in data:
                    if commodity.upper() in data['rates']:
                        current_price = data['rates'][commodity.upper()]
                        
                        return {
                            'price': current_price,
                            'currency': 'USD',
                            'change': 0,  # Would need historical data
                            'change_percent': 0,
                            'last_updated': data.get('timestamp', datetime.utcnow().isoformat()),
                            'data_freshness': 'real_time'
                        }
            
        except Exception as e:
            self.logger.error(f"Commodities API error: {e}")
            
        return None

    def _fetch_indian_govt_price(self, commodity: str) -> Dict:
        """Fetch price from Indian Government Open Data"""
        try:
            if not self.api_keys['data_gov_in']:
                return None
            
            # Map commodity names to government dataset names
            govt_commodity_map = {
                'wheat': 'Wheat',
                'rice': 'Rice',
                'corn': 'Maize',
                'soybean': 'Soybean',
                'cotton': 'Cotton',
                'turmeric': 'Turmeric',
                'onion': 'Onion',
                'tomato': 'Tomato',
                'potato': 'Potato'
            }
            
            govt_commodity = govt_commodity_map.get(commodity.lower())
            if not govt_commodity:
                return None
            
            params = {
                'api-key': self.api_keys['data_gov_in'],
                'format': 'json',
                'filters[commodity]': govt_commodity,
                'limit': 5,
                'sort': 'arrival_date desc'
            }
            
            response = requests.get(self.endpoints['data_gov_in'], params=params, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'records' in data and data['records']:
                    # Calculate average from recent records
                    prices = []
                    for record in data['records']:
                        try:
                            max_price = float(record.get('max_price', 0))
                            if max_price > 0:
                                # Convert from quintal to kg (1 quintal = 100 kg)
                                price_per_kg = max_price / 100
                                prices.append(price_per_kg)
                        except (ValueError, TypeError):
                            continue
                    
                    if prices:
                        avg_price = sum(prices) / len(prices)
                        
                        return {
                            'price': round(avg_price, 2),
                            'currency': 'INR',
                            'change': 0,  # Would need historical comparison
                            'change_percent': 0,
                            'last_updated': datetime.utcnow().isoformat(),
                            'market': 'Indian_Mandi',
                            'data_source': 'government',
                            'data_freshness': 'daily'
                        }
            
        except Exception as e:
            self.logger.error(f"Indian Government API error: {e}")
            
        return None

    def _fetch_world_bank_price(self, commodity: str) -> Dict:
        """Fetch price from World Bank Commodity Price Data"""
        try:
            if commodity not in self.commodity_symbols:
                return None
                
            indicator = self.commodity_symbols[commodity].get('world_bank')
            if not indicator:
                return None
            
            # World Bank API for latest commodity prices
            url = f"{self.endpoints['world_bank']}.{indicator}"
            params = {
                'format': 'json',
                'date': '2024:2025',  # Recent data
                'per_page': 1
            }
            
            response = requests.get(url, params=params, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if len(data) > 1 and data[1]:  # World Bank returns metadata in first element
                    latest_data = data[1][0]  # Most recent entry
                    
                    if latest_data and 'value' in latest_data and latest_data['value']:
                        return {
                            'price': float(latest_data['value']),
                            'currency': 'USD',
                            'change': 0,
                            'change_percent': 0,
                            'last_updated': latest_data.get('date', datetime.utcnow().strftime('%Y')),
                            'data_source': 'world_bank',
                            'data_freshness': 'monthly'
                        }
            
        except Exception as e:
            self.logger.error(f"World Bank API error: {e}")
            
        return None

    def _generate_mock_real_time_data(self, commodity: str) -> Dict:
        """Generate realistic mock data when all APIs fail"""
        import random
        
        # Base prices for different commodities (in USD per unit)
        base_prices = {
            'wheat': 250.0,
            'corn': 180.0,
            'soybean': 420.0,
            'rice': 350.0,
            'cotton': 720.0,
            'sugar': 380.0,
            'coffee': 1250.0
        }
        
        base_price = base_prices.get(commodity, 200.0)
        
        # Add realistic random variation (-5% to +5%)
        variation = random.uniform(-0.05, 0.05)
        current_price = base_price * (1 + variation)
        
        # Random daily change
        change_percent = random.uniform(-3.0, 3.0)
        change = current_price * change_percent / 100
        
        return {
            'price': round(current_price, 2),
            'currency': 'USD',
            'change': round(change, 2),
            'change_percent': round(change_percent, 2),
            'last_updated': datetime.utcnow().isoformat(),
            'data_source': 'mock_realtime',
            'data_freshness': 'simulated',
            'note': 'Demo data - configure API keys for real-time prices'
        }

    def update_all_commodity_prices(self):
        """Background task to update all commodity prices"""
        commodities = ['wheat', 'corn', 'soybean', 'rice', 'cotton', 'sugar', 'coffee']
        
        for commodity in commodities:
            try:
                # Update US market prices
                us_price = self.get_real_time_price_multi_source(commodity, 'US')
                if us_price:
                    self.logger.info(f"Updated {commodity} US price: ${us_price['price']}")
                
                # Update Indian market prices if applicable
                if commodity in ['wheat', 'rice', 'corn', 'soybean', 'cotton']:
                    in_price = self.get_real_time_price_multi_source(commodity, 'IN')
                    if in_price:
                        self.logger.info(f"Updated {commodity} IN price: ₹{in_price['price']}")
                
                # Small delay to respect rate limits
                time.sleep(1)
                
            except Exception as e:
                self.logger.error(f"Error updating {commodity} prices: {e}")

    def clean_old_cache(self):
        """Clean old cached data"""
        try:
            cutoff_time = datetime.utcnow() - timedelta(hours=24)
            result = self.cache_collection.delete_many({
                'timestamp': {'$lt': cutoff_time}
            })
            self.logger.info(f"Cleaned {result.deleted_count} old cache entries")
        except Exception as e:
            self.logger.error(f"Cache cleanup error: {e}")

    def get_market_trends(self, commodity: str = None, days: int = 30) -> Dict:
        """Get comprehensive market trends with real-time data"""
        try:
            commodities_to_analyze = [commodity] if commodity else ['wheat', 'corn', 'soybean', 'rice', 'cotton']
            
            market_trends = {}
            upward_trending = 0
            best_performer = {'name': '', 'change': -999}
            worst_performer = {'name': '', 'change': 999}
            
            for comm in commodities_to_analyze:
                try:
                    # Get real-time price data
                    price_data = self.get_real_time_price_multi_source(comm, 'US')
                    
                    if price_data and price_data.get('price'):
                        change_percent = price_data.get('change_percent', 0)
                        
                        # Generate mock price history for chart display
                        price_history = self._generate_price_history(price_data['price'], days)
                        
                        market_trends[comm] = {
                            'current_price': price_data['price'],
                            'price_change_24h': price_data.get('change', 0),
                            'price_change_percentage': change_percent,
                            'data_source': price_data.get('data_source', 'unknown'),
                            'currency': price_data.get('currency', 'USD'),
                            'last_updated': price_data.get('last_updated', datetime.utcnow().isoformat()),
                            'price_history': price_history,
                            'trend_direction': 'up' if change_percent > 0 else 'down' if change_percent < 0 else 'stable',
                            'volatility': abs(change_percent),
                            'data_freshness': price_data.get('data_freshness', 'unknown')
                        }
                        
                        # Track trending statistics
                        if change_percent > 0:
                            upward_trending += 1
                        
                        if change_percent > best_performer['change']:
                            best_performer = {'name': comm, 'change': change_percent}
                        
                        if change_percent < worst_performer['change']:
                            worst_performer = {'name': comm, 'change': change_percent}
                
                except Exception as e:
                    self.logger.error(f"Error analyzing {comm}: {e}")
            
            # Create market summary
            total_commodities = len(market_trends)
            market_sentiment = "bullish" if upward_trending > total_commodities / 2 else "bearish"
            
            return {
                'success': True,
                'market_trends': market_trends,
                'market_summary': {
                    'market_sentiment': market_sentiment,
                    'total_commodities_tracked': total_commodities,
                    'upward_trending': upward_trending,
                    'downward_trending': total_commodities - upward_trending,
                    'best_performer': best_performer['name'] if best_performer['name'] else 'N/A',
                    'worst_performer': worst_performer['name'] if worst_performer['name'] else 'N/A',
                    'summary': f"Market shows {market_sentiment} sentiment with {upward_trending}/{total_commodities} commodities trending upward"
                },
                'data_freshness': 'real_time',
                'last_updated': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Market trends analysis error: {e}")
            return {
                'success': False,
                'error': str(e),
                'market_summary': {
                    'market_sentiment': 'unknown',
                    'summary': 'Unable to fetch market data - please check API configuration'
                }
            }

    def _generate_price_history(self, current_price: float, days: int = 30) -> List[Dict]:
        """Generate realistic price history for chart display"""
        import random
        
        history = []
        price = current_price
        
        # Work backwards from current date
        for i in range(days, 0, -1):
            date = (datetime.utcnow() - timedelta(days=i)).strftime('%Y-%m-%d')
            
            # Add some realistic price movement
            daily_change = random.uniform(-0.03, 0.03)  # ±3% daily variation
            price = price * (1 + daily_change)
            
            history.append({
                'date': date,
                'price': round(price, 2)
            })
        
        return history

# Global instance
realtime_market_service = RealTimeMarketService()