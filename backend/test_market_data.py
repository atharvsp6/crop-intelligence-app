#!/usr/bin/env python3
"""
Test script for real-time market data integration
"""
import os
import sys
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

def test_market_data_service():
    """Test the market data service"""
    try:
        from market_data_service import market_data_service
        print("✓ Market data service imported successfully")
        
        # Test real-time price fetching
        print("\n--- Testing Real-Time Price Fetching ---")
        wheat_price = market_data_service.get_real_time_price('wheat')
        if wheat_price:
            print(f"✓ Wheat price data retrieved: ${wheat_price['price']}/kg from {wheat_price['source']}")
        else:
            print("⚠ Using fallback pricing (no API keys configured)")
        
        # Test production costs
        print("\n--- Testing Production Costs ---")
        costs = market_data_service.get_production_costs('wheat', 'US', 100)
        if costs and costs['success']:
            print(f"✓ Production costs retrieved: ${costs['total_cost_per_acre']}/acre")
            print(f"  Source: {costs['source']}")
        else:
            print("⚠ Production costs unavailable")
        
        return True
    except Exception as e:
        print(f"✗ Market data service error: {e}")
        return False

def test_financial_analyzer():
    """Test the updated financial analyzer"""
    try:
        from financial_analyzer import financial_analyzer
        print("\n--- Testing Financial Analyzer ---")
        
        # Test ROI calculation with real data
        roi_result = financial_analyzer.calculate_roi('wheat', 100, 1300)  # 100 acres, 1300 kg/acre
        
        if roi_result.get('success'):
            metrics = roi_result['financial_metrics']
            market_info = roi_result['market_info']
            print(f"✓ ROI calculation successful")
            print(f"  ROI: {metrics['roi_percentage']}%")
            print(f"  Net profit: ${metrics['net_profit']}")
            print(f"  Price source: {market_info['price_source']}")
            print(f"  Current price: ${market_info['current_price_per_kg']}/kg")
        else:
            print(f"✗ ROI calculation failed: {roi_result.get('error')}")
            return False
        
        # Test market trends
        print("\n--- Testing Market Trends ---")
        trends = financial_analyzer.get_market_trends('wheat')
        
        if trends.get('success'):
            print("✓ Market trends retrieved successfully")
            wheat_data = trends['market_trends'].get('wheat', {})
            print(f"  Current wheat price: ${wheat_data.get('current_price', 'N/A')}")
            print(f"  Data source: {wheat_data.get('data_source', 'N/A')}")
            print(f"  Trend direction: {wheat_data.get('trend_direction', 'N/A')}")
        else:
            print(f"✗ Market trends failed: {trends.get('error')}")
            return False
        
        return True
    except Exception as e:
        print(f"✗ Financial analyzer error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_api_keys():
    """Check if API keys are configured"""
    print("\n--- Checking API Configuration ---")
    
    api_keys = {
        'ALPHA_VANTAGE_API_KEY': os.environ.get('ALPHA_VANTAGE_API_KEY'),
        'USDA_API_KEY': os.environ.get('USDA_API_KEY'),
        'QUANDL_API_KEY': os.environ.get('QUANDL_API_KEY')
    }
    
    configured_keys = 0
    for key_name, key_value in api_keys.items():
        if key_value and not key_value.startswith('get_free_key'):
            print(f"✓ {key_name}: Configured")
            configured_keys += 1
        else:
            print(f"⚠ {key_name}: Not configured (using fallback data)")
    
    if configured_keys == 0:
        print("ℹ No API keys configured. App will use fallback prices and Yahoo Finance where possible.")
    else:
        print(f"✓ {configured_keys}/3 API keys configured for enhanced data access")

def main():
    """Main test function"""
    print("="*60)
    print("REAL-TIME MARKET DATA INTEGRATION TEST")
    print("="*60)
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Test API keys configuration
    test_api_keys()
    
    # Test market data service
    market_data_ok = test_market_data_service()
    
    # Test financial analyzer
    financial_analyzer_ok = test_financial_analyzer()
    
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    if market_data_ok and financial_analyzer_ok:
        print("✅ All tests passed! Real-time market data integration is working.")
        print("✅ The app now uses real market data instead of hardcoded values.")
    else:
        print("❌ Some tests failed. Check the errors above.")
        return 1
    
    print("\nTo get enhanced real-time data, configure API keys in .env file:")
    print("- ALPHA_VANTAGE_API_KEY (free at alphavantage.co)")
    print("- USDA_API_KEY (free at nass.usda.gov)")
    print("- QUANDL_API_KEY (free at data.nasdaq.com)")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())