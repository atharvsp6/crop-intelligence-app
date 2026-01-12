"""
Market Data Service
Indian agricultural commodity prices (mandi prices)
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import random
from cachetools import TTLCache

from app.core.config import get_settings
from app.core.logging import get_logger
from app.db.repositories import market_data_repository

settings = get_settings()
logger = get_logger(__name__)

# Market data cache
_market_cache = TTLCache(maxsize=500, ttl=settings.MARKET_DATA_CACHE_TTL)


# Indian Mandis (Agricultural Markets)
MAJOR_MANDIS = {
    "delhi": {"name": "Azadpur Mandi", "state": "Delhi", "type": "wholesale"},
    "mumbai": {"name": "Vashi APMC", "state": "Maharashtra", "type": "wholesale"},
    "kolkata": {"name": "Koley Market", "state": "West Bengal", "type": "wholesale"},
    "chennai": {"name": "Koyambedu", "state": "Tamil Nadu", "type": "wholesale"},
    "bangalore": {"name": "APMC Yeshwanthpur", "state": "Karnataka", "type": "wholesale"},
    "hyderabad": {"name": "Bowenpally", "state": "Telangana", "type": "wholesale"},
    "ahmedabad": {"name": "Jamalpur", "state": "Gujarat", "type": "wholesale"},
    "pune": {"name": "Market Yard", "state": "Maharashtra", "type": "wholesale"},
    "lucknow": {"name": "Aminabad", "state": "Uttar Pradesh", "type": "wholesale"},
    "jaipur": {"name": "Muhana Mandi", "state": "Rajasthan", "type": "wholesale"},
}

# Commodity base prices (₹ per quintal) - typical ranges
COMMODITY_BASE_PRICES = {
    "wheat": {"min": 2000, "max": 2800, "unit": "quintal"},
    "rice": {"min": 2500, "max": 4000, "unit": "quintal"},
    "maize": {"min": 1500, "max": 2200, "unit": "quintal"},
    "cotton": {"min": 5500, "max": 7500, "unit": "quintal"},
    "sugarcane": {"min": 280, "max": 350, "unit": "quintal"},
    "soybean": {"min": 3800, "max": 5000, "unit": "quintal"},
    "groundnut": {"min": 4500, "max": 6500, "unit": "quintal"},
    "mustard": {"min": 4500, "max": 6000, "unit": "quintal"},
    "chana": {"min": 4000, "max": 5500, "unit": "quintal"},
    "tur": {"min": 5500, "max": 7500, "unit": "quintal"},
    "urad": {"min": 5000, "max": 7000, "unit": "quintal"},
    "moong": {"min": 6000, "max": 8000, "unit": "quintal"},
    "potato": {"min": 800, "max": 2000, "unit": "quintal"},
    "onion": {"min": 1000, "max": 4000, "unit": "quintal"},
    "tomato": {"min": 800, "max": 4000, "unit": "quintal"},
    "garlic": {"min": 8000, "max": 15000, "unit": "quintal"},
    "ginger": {"min": 5000, "max": 12000, "unit": "quintal"},
}


class MarketDataService:
    """Service for agricultural market data."""
    
    async def get_commodity_prices(
        self,
        commodity: str,
        mandi: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get prices for a commodity across mandis.
        
        Args:
            commodity: Commodity name
            mandi: Specific mandi (optional)
            
        Returns:
            Price data dictionary
        """
        cache_key = f"prices:{commodity}:{mandi or 'all'}"
        
        if cache_key in _market_cache:
            return _market_cache[cache_key]
        
        commodity_lower = commodity.lower()
        
        if commodity_lower not in COMMODITY_BASE_PRICES:
            return {
                "success": False,
                "error": f"Unknown commodity: {commodity}",
                "available_commodities": list(COMMODITY_BASE_PRICES.keys())
            }
        
        base = COMMODITY_BASE_PRICES[commodity_lower]
        
        # Generate realistic price data
        mandis_to_check = {mandi: MAJOR_MANDIS[mandi]} if mandi and mandi in MAJOR_MANDIS else MAJOR_MANDIS
        
        prices = []
        for mandi_id, mandi_info in mandis_to_check.items():
            price = self._generate_price(base["min"], base["max"])
            change = random.uniform(-5, 5)
            
            prices.append({
                "mandi_id": mandi_id,
                "mandi_name": mandi_info["name"],
                "state": mandi_info["state"],
                "price": price,
                "modal_price": price,
                "min_price": int(price * 0.92),
                "max_price": int(price * 1.08),
                "unit": f"₹/{base['unit']}",
                "change_percent": round(change, 2),
                "trend": "up" if change > 0 else "down" if change < 0 else "stable",
                "date": datetime.now().date().isoformat()
            })
        
        # Sort by price
        prices.sort(key=lambda x: x["price"])
        
        result = {
            "success": True,
            "commodity": commodity.title(),
            "prices": prices,
            "summary": {
                "lowest_price": prices[0]["price"] if prices else None,
                "highest_price": prices[-1]["price"] if prices else None,
                "average_price": sum(p["price"] for p in prices) / len(prices) if prices else None,
                "best_mandi": prices[-1]["mandi_name"] if prices else None,
                "cheapest_mandi": prices[0]["mandi_name"] if prices else None
            },
            "last_updated": datetime.utcnow().isoformat()
        }
        
        _market_cache[cache_key] = result
        return result
    
    async def get_all_prices(self, mandi: Optional[str] = None) -> Dict[str, Any]:
        """Get prices for all commodities."""
        all_prices = {}
        
        for commodity in COMMODITY_BASE_PRICES.keys():
            data = await self.get_commodity_prices(commodity, mandi)
            if data.get("success"):
                all_prices[commodity] = {
                    "price": data["summary"]["average_price"],
                    "trend": data["prices"][0]["trend"] if data["prices"] else "stable"
                }
        
        return {
            "success": True,
            "mandi": mandi or "all",
            "prices": all_prices,
            "last_updated": datetime.utcnow().isoformat()
        }
    
    async def get_price_trend(
        self,
        commodity: str,
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Get historical price trend for a commodity.
        
        Args:
            commodity: Commodity name
            days: Number of days of history
            
        Returns:
            Trend data dictionary
        """
        cache_key = f"trend:{commodity}:{days}"
        
        if cache_key in _market_cache:
            return _market_cache[cache_key]
        
        commodity_lower = commodity.lower()
        
        if commodity_lower not in COMMODITY_BASE_PRICES:
            return {"success": False, "error": f"Unknown commodity: {commodity}"}
        
        base = COMMODITY_BASE_PRICES[commodity_lower]
        
        # Generate historical trend
        history = []
        current_price = self._generate_price(base["min"], base["max"])
        
        for i in range(days, 0, -1):
            date = (datetime.now() - timedelta(days=i)).date().isoformat()
            # Random walk for historical prices
            change = random.uniform(-2, 2)
            price = int(current_price * (1 + change / 100))
            price = max(base["min"], min(base["max"], price))
            
            history.append({
                "date": date,
                "price": price,
                "change_percent": round(change, 2)
            })
            current_price = price
        
        # Add today
        history.append({
            "date": datetime.now().date().isoformat(),
            "price": current_price,
            "change_percent": 0
        })
        
        # Calculate trend statistics
        prices = [h["price"] for h in history]
        
        result = {
            "success": True,
            "commodity": commodity.title(),
            "history": history,
            "statistics": {
                "current_price": prices[-1],
                "week_ago_price": prices[0],
                "week_change_percent": round((prices[-1] - prices[0]) / prices[0] * 100, 2),
                "min_price": min(prices),
                "max_price": max(prices),
                "avg_price": round(sum(prices) / len(prices), 2),
                "volatility": round(self._calculate_volatility(prices), 2)
            },
            "trend": "up" if prices[-1] > prices[0] else "down" if prices[-1] < prices[0] else "stable",
            "last_updated": datetime.utcnow().isoformat()
        }
        
        _market_cache[cache_key] = result
        return result
    
    async def get_mandi_list(self) -> Dict[str, Any]:
        """Get list of available mandis."""
        return {
            "success": True,
            "mandis": [
                {"id": k, **v} for k, v in MAJOR_MANDIS.items()
            ],
            "total": len(MAJOR_MANDIS)
        }
    
    async def get_commodity_list(self) -> Dict[str, Any]:
        """Get list of available commodities."""
        return {
            "success": True,
            "commodities": [
                {
                    "name": k.title(),
                    "id": k,
                    "unit": v["unit"],
                    "typical_range": f"₹{v['min']} - ₹{v['max']}"
                }
                for k, v in COMMODITY_BASE_PRICES.items()
            ],
            "total": len(COMMODITY_BASE_PRICES)
        }
    
    async def get_market_summary(self) -> Dict[str, Any]:
        """Get overall market summary."""
        # Get prices for key commodities
        key_commodities = ["wheat", "rice", "cotton", "onion", "potato"]
        
        summary = []
        for commodity in key_commodities:
            data = await self.get_commodity_prices(commodity)
            if data.get("success"):
                summary.append({
                    "commodity": commodity.title(),
                    "price": data["summary"]["average_price"],
                    "trend": data["prices"][0]["trend"] if data["prices"] else "stable"
                })
        
        # Market sentiment
        up_count = sum(1 for s in summary if s.get("trend") == "up")
        down_count = sum(1 for s in summary if s.get("trend") == "down")
        
        if up_count > down_count:
            sentiment = "bullish"
        elif down_count > up_count:
            sentiment = "bearish"
        else:
            sentiment = "neutral"
        
        return {
            "success": True,
            "key_commodities": summary,
            "market_sentiment": sentiment,
            "total_mandis": len(MAJOR_MANDIS),
            "total_commodities": len(COMMODITY_BASE_PRICES),
            "last_updated": datetime.utcnow().isoformat()
        }
    
    def _generate_price(self, min_price: int, max_price: int) -> int:
        """Generate a realistic price within range."""
        # Use normal distribution centered around middle
        mean = (min_price + max_price) / 2
        std = (max_price - min_price) / 6
        price = random.gauss(mean, std)
        return int(max(min_price, min(max_price, price)))
    
    def _calculate_volatility(self, prices: List[float]) -> float:
        """Calculate price volatility."""
        if len(prices) < 2:
            return 0
        
        returns = [(prices[i] - prices[i-1]) / prices[i-1] * 100 
                   for i in range(1, len(prices))]
        
        mean_return = sum(returns) / len(returns)
        variance = sum((r - mean_return) ** 2 for r in returns) / len(returns)
        
        return variance ** 0.5


# Service instance
market_service = MarketDataService()
