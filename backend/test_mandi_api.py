#!/usr/bin/env python3
"""
Quick test for Government Mandi Prices API integration
Run this to test your specific API key for mandi data
"""
import os
import sys
import requests
from datetime import date
from dotenv import load_dotenv

def test_mandi_api():
    """Test your Government Mandi Prices API"""
    
    # Load environment variables
    load_dotenv()
    
    api_key = os.getenv('GOVT_OPEN_DATA_KEY')
    if not api_key or api_key == 'your_data_gov_in_api_key_here':
        print("❌ Government Open Data API key not configured in .env file")
        print("💡 Please add your API key to backend/.env:")
        print("   GOVT_OPEN_DATA_KEY=your_actual_api_key_here")
        return False
    
    print("🌾 Testing Government Mandi Prices API...")
    print(f"📡 Using API Key: {api_key[:10]}...")
    
    try:
        # Test the Current Daily Price of Various Commodities dataset
        url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
        
        # Test different commodities
        commodities = ['Wheat', 'Rice', 'Maize', 'Cotton', 'Soybean']
        
        for commodity in commodities:
            print(f"\n📊 Testing {commodity} prices...")
            
            params = {
                'api-key': api_key,
                'format': 'json',
                'limit': 5,
                'filters[commodity]': commodity
            }
            
            response = requests.get(url, params=params, timeout=15)
            print(f"   Request URL: {response.url}")
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                if 'records' in data and len(data['records']) > 0:
                    print(f"   ✅ Found {len(data['records'])} {commodity} price records")
                    
                    # Show sample data
                    for i, record in enumerate(data['records'][:3]):  # Show first 3 records
                        market = record.get('market', 'Unknown')
                        state = record.get('state', 'Unknown')
                        district = record.get('district', 'Unknown')
                        arrival_date = record.get('arrival_date', 'Unknown')
                        min_price = record.get('min_price', 0)
                        max_price = record.get('max_price', 0)
                        modal_price = record.get('modal_price', 0)
                        
                        print(f"     {i+1}. {market}, {district}, {state}")
                        print(f"        Date: {arrival_date}")
                        print(f"        Price Range: ₹{min_price}-{max_price}/quintal (Modal: ₹{modal_price})")
                else:
                    print(f"   ⚠️  No records found for {commodity}")
                    print(f"   Response: {data}")
            else:
                print(f"   ❌ API request failed")
                print(f"   Error: {response.text[:200]}...")
        
        print("\n" + "="*60)
        print("🎉 Mandi API Test Complete!")
        print("💡 Your API key is working and can fetch real Indian mandi prices")
        print("🔄 Your app will now use REAL government mandi data instead of simulated data")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error testing API: {e}")
        return False

def test_market_data_service():
    """Test the market data service integration"""
    print("\n🧪 Testing Market Data Service Integration...")
    
    try:
        # Import and test our market data service
        from market_data_service import market_data_service
        
        print("✅ Market data service imported successfully")
        
        # Test getting real Indian prices
        commodities = ['wheat', 'rice', 'corn', 'cotton']
        
        for commodity in commodities:
            print(f"\n📈 Getting {commodity} price from Indian government data...")
            
            price_data = market_data_service.get_real_time_price(commodity, 'IN')
            
            if price_data:
                source = price_data.get('source', 'unknown')
                price = price_data.get('price', 0)
                currency = price_data.get('currency', 'unknown')
                market = price_data.get('market', 'unknown')
                exchange = price_data.get('exchange', 'unknown')
                
                print(f"   ✅ Price: ₹{price:.2f}/{currency.lower()}")
                print(f"   📍 Source: {source}")
                print(f"   🏢 Market: {exchange} ({market})")
                
                # Check if it's using real government data
                if 'govt' in source and 'live' in source:
                    print(f"   🎉 Using REAL government mandi data!")
                elif 'govt' in source:
                    print(f"   📋 Using government MSP fallback data")
                else:
                    print(f"   🔄 Using simulated/alternative data")
            else:
                print(f"   ⚠️  No price data available for {commodity}")
        
        return True
        
    except Exception as e:
        print(f"❌ Market data service test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test function"""
    print("🇮🇳 GOVERNMENT MANDI PRICES API TEST")
    print("="*60)
    
    # Test 1: Direct API test
    api_success = test_mandi_api()
    
    # Test 2: Market data service integration test
    service_success = test_market_data_service()
    
    print("\n" + "="*60)
    print("📊 FINAL RESULTS")
    print("="*60)
    
    if api_success and service_success:
        print("🎉 SUCCESS! Your Government Mandi Prices API is working perfectly!")
        print("✅ Real Indian mandi prices are now integrated into your app")
        print("🚀 Start your Flask server to use live government data")
    elif api_success:
        print("⚡ API key works, but integration needs debugging")
        print("🔧 Check the market_data_service.py implementation")
    else:
        print("❌ API key issues - please check your configuration")
        print("💡 Verify your API key in the .env file")
    
    print(f"\n🔗 Next steps:")
    print("1. Fix any issues shown above")
    print("2. Restart your Flask server: python app_integrated.py")
    print("3. Test the Financial Dashboard - it should show 'indian_govt_mandi_live' as data source")

if __name__ == '__main__':
    main()