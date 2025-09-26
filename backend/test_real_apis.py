#!/usr/bin/env python3
"""
Test script for essential API integration for Indian agricultural data
Run this after adding your API keys to .env file
"""
import os
import sys
import requests
import json
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_govt_open_data_api():
    """Test Government of India Open Data API for Mandi Prices"""
    api_key = os.getenv('GOVT_OPEN_DATA_KEY')
    if not api_key or api_key == 'your_data_gov_in_api_key_here':
        print("⚠️  Government Open Data API key not configured")
        return False
    
    try:
        # Test the specific mandi prices dataset
        url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
        params = {
            'api-key': api_key,
            'format': 'json',
            'limit': 5,
            'filters[commodity]': 'Wheat'  # Test with wheat
        }
        
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'records' in data and len(data['records']) > 0:
                print("✅ Government Mandi Prices API working")
                print(f"   Retrieved {len(data['records'])} mandi price records")
                
                # Show sample data
                sample = data['records'][0]
                commodity = sample.get('commodity', 'Unknown')
                market = sample.get('market', 'Unknown')
                price = sample.get('max_price', 'N/A')
                print(f"   Sample: {commodity} at {market} - ₹{price}/quintal")
                return True
        
        print("❌ Government Open Data API failed")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        return False
        
    except Exception as e:
        print(f"❌ Government Open Data API error: {e}")
        return False

def test_exchange_rate_api():
    """Test ExchangeRate-API for currency conversion"""
    api_key = os.getenv('EXCHANGERATE_API_KEY')
    if not api_key or api_key == 'your_exchange_rate_api_key_here':
        print("⚠️  ExchangeRate API key not configured (optional)")
        return False
    
    try:
        url = f"https://v6.exchangerate-api.com/v6/{api_key}/latest/USD"
        
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('result') == 'success' and 'conversion_rates' in data:
                inr_rate = data['conversion_rates'].get('INR', 'N/A')
                print("✅ ExchangeRate API working")
                print(f"   USD to INR rate: ₹{inr_rate}")
                return True
        
        print("❌ ExchangeRate API failed")
        print(f"   Status: {response.status_code}")
        return False
        
    except Exception as e:
        print(f"❌ ExchangeRate API error: {e}")
        return False

def main():
    """Main test function"""
    print("🌾 TESTING ESSENTIAL APIS FOR INDIAN AGRICULTURAL DATA")
    print("=" * 60)
    
    # Load environment variables
    load_dotenv()
    
    # Test only essential APIs
    api_tests = [
        ("Government Mandi Prices (India)", test_govt_open_data_api),
        ("ExchangeRate API (Optional)", test_exchange_rate_api)
    ]
    
    results = []
    for name, test_func in api_tests:
        print(f"\n📡 Testing {name}...")
        try:
            success = test_func()
            results.append((name, success))
        except Exception as e:
            print(f"❌ {name} test failed: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 ESSENTIAL API INTEGRATION TEST SUMMARY")
    print("=" * 60)
    
    working_apis = 0
    total_apis = len(results)
    
    for name, success in results:
        status = "✅ WORKING" if success else "❌ FAILED/NOT CONFIGURED"
        print(f"{status:<25} {name}")
        if success:
            working_apis += 1
    
    print(f"\n📈 Success Rate: {working_apis}/{total_apis} essential APIs working")
    
    if working_apis >= 1:  # At least government data working
        print(f"\n🎉 Great! Your Indian agricultural data integration is working.")
        print("💡 Your app will use real government mandi prices.")
        print("🌾 Perfect setup for Indian farming application!")
    else:
        print("\n⚠️  No essential APIs are currently working.")
        print("📝 Check the STREAMLINED_API_GUIDE.md for setup instructions.")
        print("🔄 Your app will continue using realistic simulated Indian data.")
    
    print(f"\n🔧 Next steps:")
    print("1. Ensure GOVT_OPEN_DATA_KEY is correctly configured")
    print("2. Restart your Flask server: python app_integrated.py")
    print("3. Test the Financial Dashboard - should show 'indian_govt_mandi_live'")
    
    return working_apis

if __name__ == "__main__":
    working_count = main()
    exit_code = 0 if working_count > 0 else 1
    sys.exit(exit_code)

def test_alpha_vantage_api():
    """Test Alpha Vantage API for commodity data"""
    api_key = os.getenv('ALPHA_VANTAGE_API_KEY')
    if not api_key:
        print("⚠️  Alpha Vantage API key not configured")
        return False
    
    try:
        # Test commodity data (e.g., wheat)
        url = "https://www.alphavantage.co/query"
        params = {
            'function': 'OVERVIEW',
            'symbol': 'WEAT',  # Agricultural ETF
            'apikey': api_key
        }
        
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'Symbol' in data:
                print("✅ Alpha Vantage API working")
                print(f"   Symbol: {data.get('Symbol', 'N/A')}")
                return True
        
        print("❌ Alpha Vantage API failed")
        print(f"   Response: {response.text[:100]}...")
        return False
        
    except Exception as e:
        print(f"❌ Alpha Vantage API error: {e}")
        return False

def test_quandl_api():
    """Test Quandl API for commodity data"""
    api_key = os.getenv('QUANDL_API_KEY')
    if not api_key or api_key == 'your_quandl_api_key_here':
        print("⚠️  Quandl API key not configured")
        return False
    
    try:
        # Test wheat futures data
        url = f"https://data.nasdaq.com/api/v3/datasets/CHRIS/CME_W1.json"
        params = {
            'api_key': api_key,
            'rows': 5
        }
        
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'dataset' in data:
                print("✅ Quandl API working")
                print(f"   Dataset: {data['dataset']['name']}")
                return True
        
        print("❌ Quandl API failed")
        print(f"   Status: {response.status_code}")
        return False
        
    except Exception as e:
        print(f"❌ Quandl API error: {e}")
        return False

def test_exchange_rate_api():
    """Test ExchangeRate-API for USD to INR conversion"""
    api_key = os.getenv('EXCHANGERATE_API_KEY')
    if not api_key or api_key == 'your_exchangerate_api_key_here':
        print("⚠️  ExchangeRate API key not configured")
        return False
    
    try:
        # Test USD to INR conversion
        url = f"https://v6.exchangerate-api.com/v6/{api_key}/pair/USD/INR"
        
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('result') == 'success':
                rate = data.get('conversion_rate', 0)
                print("✅ ExchangeRate API working")
                print(f"   USD to INR rate: {rate}")
                return True
        
        print("❌ ExchangeRate API failed")
        print(f"   Status: {response.status_code}")
        return False
        
    except Exception as e:
        print(f"❌ ExchangeRate API error: {e}")
        return False

def test_yahoo_finance_api():
    """Test Yahoo Finance API via RapidAPI"""
    api_key = os.getenv('YAHOO_FINANCE_API_KEY')
    if not api_key or api_key == 'your_yahoo_finance_api_key_here':
        print("⚠️  Yahoo Finance API key not configured")
        return False
    
    try:
        # Test commodity quote (Gold as example)
        url = "https://yahoo-finance1.p.rapidapi.com/v8/finance/quote"
        headers = {
            'X-RapidAPI-Key': api_key,
            'X-RapidAPI-Host': 'yahoo-finance1.p.rapidapi.com'
        }
        params = {
            'symbols': 'GC=F'  # Gold futures
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'quoteResponse' in data:
                print("✅ Yahoo Finance API working")
                results = data['quoteResponse'].get('result', [])
                if results:
                    print(f"   Symbol: {results[0].get('symbol', 'N/A')}")
                return True
        
        print("❌ Yahoo Finance API failed")
        print(f"   Status: {response.status_code}")
        return False
        
    except Exception as e:
        print(f"❌ Yahoo Finance API error: {e}")
        return False

def test_news_api():
    """Test NewsAPI for agricultural news"""
    api_key = os.getenv('NEWS_API_KEY')
    if not api_key or api_key == 'your_news_api_key_for_agriculture_news':
        print("⚠️  News API key not configured")
        return False
    
    try:
        # Test agricultural news from India
        url = "https://newsapi.org/v2/everything"
        params = {
            'q': 'agriculture India crops',
            'language': 'en',
            'sortBy': 'relevancy',
            'pageSize': 5,
            'apiKey': api_key
        }
        
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'ok':
                articles = data.get('articles', [])
                print("✅ News API working")
                print(f"   Found {len(articles)} agriculture articles")
                return True
        
        print("❌ News API failed")
        print(f"   Status: {response.status_code}")
        return False
        
    except Exception as e:
        print(f"❌ News API error: {e}")
        return False

def test_usda_api():
    """Test USDA NASS API"""
    api_key = os.getenv('USDA_API_KEY')
    if not api_key or api_key == 'your_usda_nass_api_key_here':
        print("⚠️  USDA API key not configured")
        return False
    
    try:
        # Test USDA crop data
        url = "https://quickstats.nass.usda.gov/api/api_GET/"
        params = {
            'key': api_key,
            'source_desc': 'SURVEY',
            'commodity_desc': 'WHEAT',
            'year': '2023',
            'agg_level_desc': 'STATE',
            'format': 'JSON'
        }
        
        response = requests.get(url, params=params, timeout=15)
        if response.status_code == 200:
            data = response.json()
            if 'data' in data and len(data['data']) > 0:
                print("✅ USDA API working")
                print(f"   Retrieved {len(data['data'])} wheat records")
                return True
        
        print("❌ USDA API failed")
        print(f"   Status: {response.status_code}")
        return False
        
    except Exception as e:
        print(f"❌ USDA API error: {e}")
        return False

def main():
    """Main test function"""
    print("🌾 TESTING ESSENTIAL APIS FOR INDIAN AGRICULTURAL DATA")
    print("=" * 60)
    
    # Load environment variables
    load_dotenv()
    
    # Test only essential APIs
    api_tests = [
        ("Government Mandi Prices (India)", test_govt_open_data_api),
        ("ExchangeRate API (Optional)", test_exchange_rate_api)
    ]
    
    results = []
    for name, test_func in api_tests:
        print(f"\n📡 Testing {name}...")
        try:
            success = test_func()
            results.append((name, success))
        except Exception as e:
            print(f"❌ {name} test failed: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 ESSENTIAL API INTEGRATION TEST SUMMARY")
    print("=" * 60)
    
    working_apis = 0
    total_apis = len(results)
    
    for name, success in results:
        status = "✅ WORKING" if success else "❌ FAILED/NOT CONFIGURED"
        print(f"{status:<25} {name}")
        if success:
            working_apis += 1
    
    print(f"\n📈 Success Rate: {working_apis}/{total_apis} essential APIs working")
    
    if working_apis >= 1:  # At least government data working
        print(f"\n🎉 Great! Your Indian agricultural data integration is working.")
        print("💡 Your app will use real government mandi prices.")
        print("🌾 Perfect setup for Indian farming application!")
    else:
        print("\n⚠️  No essential APIs are currently working.")
        print("📝 Check the STREAMLINED_API_GUIDE.md for setup instructions.")
        print("🔄 Your app will continue using realistic simulated Indian data.")
    
    print(f"\n🔧 Next steps:")
    print("1. Ensure GOVT_OPEN_DATA_KEY is correctly configured")
    print("2. Restart your Flask server: python app_integrated.py")
    print("3. Test the Financial Dashboard - should show 'indian_govt_mandi_live'")
    
    return working_apis

if __name__ == '__main__':
    working_count = main()
    sys.exit(0 if working_count > 0 else 1)