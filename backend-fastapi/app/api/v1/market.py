"""
Market Data API Routes
"""
from fastapi import APIRouter, Query
from typing import Optional

from app.services import market_service

router = APIRouter(prefix="/market", tags=["Market Data"])


@router.get("/commodities")
async def get_commodity_list():
    """
    Get list of available commodities.
    
    Returns all commodities with price tracking available.
    """
    return await market_service.get_commodity_list()


@router.get("/mandis")
async def get_mandi_list():
    """
    Get list of available mandis (agricultural markets).
    
    Returns major mandis across India with their details.
    """
    return await market_service.get_mandi_list()


@router.get("/prices/{commodity}")
async def get_commodity_prices(
    commodity: str,
    mandi: Optional[str] = Query(None, description="Specific mandi ID")
):
    """
    Get prices for a specific commodity.
    
    Returns prices across all mandis or a specific mandi.
    Includes min, max, and modal prices.
    """
    return await market_service.get_commodity_prices(commodity, mandi)


@router.get("/prices")
async def get_all_prices(
    mandi: Optional[str] = Query(None, description="Specific mandi ID")
):
    """
    Get prices for all commodities.
    
    Quick overview of current market prices.
    """
    return await market_service.get_all_prices(mandi)


@router.get("/trend/{commodity}")
async def get_price_trend(
    commodity: str,
    days: int = Query(7, ge=1, le=30, description="Number of days")
):
    """
    Get historical price trend for a commodity.
    
    Returns daily prices and trend analysis for the specified period.
    """
    return await market_service.get_price_trend(commodity, days)


@router.get("/summary")
async def get_market_summary():
    """
    Get overall market summary.
    
    Includes:
    - Key commodity prices
    - Market sentiment
    - Price trends
    """
    return await market_service.get_market_summary()


@router.get("/compare")
async def compare_mandi_prices(
    commodity: str = Query(..., description="Commodity name")
):
    """
    Compare prices across mandis for a commodity.
    
    Useful for finding the best market to sell produce.
    """
    result = await market_service.get_commodity_prices(commodity)
    
    if not result.get("success"):
        return result
    
    prices = result.get("prices", [])
    
    # Sort by price descending (best for selling)
    prices_sorted = sorted(prices, key=lambda x: x["price"], reverse=True)
    
    return {
        "success": True,
        "commodity": commodity.title(),
        "best_market": prices_sorted[0] if prices_sorted else None,
        "worst_market": prices_sorted[-1] if prices_sorted else None,
        "price_difference": prices_sorted[0]["price"] - prices_sorted[-1]["price"] if len(prices_sorted) >= 2 else 0,
        "all_markets": prices_sorted,
        "recommendation": f"Sell at {prices_sorted[0]['mandi_name']} for best price" if prices_sorted else None
    }


@router.get("/best-price")
async def find_best_price(
    commodity: str = Query(..., description="Commodity name"),
    state: Optional[str] = Query(None, description="Filter by state")
):
    """
    Find the best selling price for a commodity.
    
    Returns the mandi offering the highest price.
    """
    result = await market_service.get_commodity_prices(commodity)
    
    if not result.get("success"):
        return result
    
    prices = result.get("prices", [])
    
    # Filter by state if provided
    if state:
        prices = [p for p in prices if p.get("state", "").lower() == state.lower()]
    
    if not prices:
        return {
            "success": False,
            "error": f"No prices found for {commodity}" + (f" in {state}" if state else "")
        }
    
    # Find best price
    best = max(prices, key=lambda x: x["price"])
    
    return {
        "success": True,
        "commodity": commodity.title(),
        "best_market": best,
        "recommendation": f"Sell at {best['mandi_name']} ({best['state']}) at ₹{best['price']}/{best['unit'].split('/')[1]}"
    }
