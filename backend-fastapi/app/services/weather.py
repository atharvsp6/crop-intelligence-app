"""
Weather Service
Fetch weather data from OpenWeatherMap (free tier)
"""
import httpx
from typing import Optional, Dict, Any, List
from datetime import datetime
from cachetools import TTLCache

from app.core.config import get_settings
from app.core.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)

# Weather cache (5 minutes TTL)
_weather_cache = TTLCache(maxsize=100, ttl=300)


class WeatherService:
    """Service for fetching weather data."""
    
    def __init__(self):
        self.api_key = settings.WEATHER_API_KEY
        self.base_url = settings.WEATHER_API_URL
        self.timeout = httpx.Timeout(10.0)
    
    def _is_configured(self) -> bool:
        """Check if weather API is configured."""
        return bool(self.api_key)
    
    async def get_current_weather(
        self,
        city: str,
        state: Optional[str] = None,
        country: str = "IN"
    ) -> Dict[str, Any]:
        """
        Get current weather for a location.
        
        Args:
            city: City name
            state: State name (optional)
            country: Country code (default: IN for India)
            
        Returns:
            Weather data dictionary
        """
        cache_key = f"weather:{city}:{state}:{country}"
        
        # Check cache
        if cache_key in _weather_cache:
            return _weather_cache[cache_key]
        
        if not self._is_configured():
            return self._mock_weather(city)
        
        try:
            location = f"{city},{state},{country}" if state else f"{city},{country}"
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/weather",
                    params={
                        "q": location,
                        "appid": self.api_key,
                        "units": "metric"
                    }
                )
                response.raise_for_status()
                data = response.json()
            
            result = {
                "success": True,
                "location": data.get("name", city),
                "temperature": data["main"]["temp"],
                "feels_like": data["main"]["feels_like"],
                "humidity": data["main"]["humidity"],
                "pressure": data["main"]["pressure"],
                "description": data["weather"][0]["description"],
                "icon": data["weather"][0]["icon"],
                "wind_speed": data["wind"]["speed"],
                "clouds": data["clouds"]["all"],
                "visibility": data.get("visibility", 10000),
                "sunrise": datetime.fromtimestamp(data["sys"]["sunrise"]).isoformat(),
                "sunset": datetime.fromtimestamp(data["sys"]["sunset"]).isoformat(),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            _weather_cache[cache_key] = result
            return result
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Weather API HTTP error: {e}")
            return {"success": False, "error": f"HTTP error: {e.response.status_code}"}
        except Exception as e:
            logger.error(f"Weather API error: {e}")
            return self._mock_weather(city)
    
    async def get_forecast(
        self,
        city: str,
        state: Optional[str] = None,
        country: str = "IN",
        days: int = 5
    ) -> Dict[str, Any]:
        """
        Get weather forecast.
        
        Args:
            city: City name
            state: State name (optional)
            country: Country code
            days: Number of days (max 5 for free tier)
            
        Returns:
            Forecast data dictionary
        """
        cache_key = f"forecast:{city}:{state}:{country}:{days}"
        
        if cache_key in _weather_cache:
            return _weather_cache[cache_key]
        
        if not self._is_configured():
            return self._mock_forecast(city, days)
        
        try:
            location = f"{city},{state},{country}" if state else f"{city},{country}"
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/forecast",
                    params={
                        "q": location,
                        "appid": self.api_key,
                        "units": "metric",
                        "cnt": days * 8  # 8 readings per day
                    }
                )
                response.raise_for_status()
                data = response.json()
            
            # Process forecast data
            forecasts = []
            seen_dates = set()
            
            for item in data["list"]:
                date = datetime.fromtimestamp(item["dt"]).date().isoformat()
                
                if date not in seen_dates and len(seen_dates) < days:
                    seen_dates.add(date)
                    forecasts.append({
                        "date": date,
                        "temperature": item["main"]["temp"],
                        "temp_min": item["main"]["temp_min"],
                        "temp_max": item["main"]["temp_max"],
                        "humidity": item["main"]["humidity"],
                        "description": item["weather"][0]["description"],
                        "icon": item["weather"][0]["icon"],
                        "wind_speed": item["wind"]["speed"],
                        "pop": item.get("pop", 0) * 100  # Probability of precipitation
                    })
            
            result = {
                "success": True,
                "location": data["city"]["name"],
                "forecasts": forecasts,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            _weather_cache[cache_key] = result
            return result
            
        except Exception as e:
            logger.error(f"Forecast API error: {e}")
            return self._mock_forecast(city, days)
    
    async def get_agricultural_weather(
        self,
        city: str,
        state: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get weather data formatted for agricultural use.
        Includes growing conditions assessment.
        """
        current = await self.get_current_weather(city, state)
        forecast = await self.get_forecast(city, state, days=5)
        
        if not current.get("success"):
            return current
        
        # Calculate agricultural metrics
        temp = current.get("temperature", 25)
        humidity = current.get("humidity", 60)
        
        # Growing conditions assessment
        conditions = {
            "temperature_status": self._assess_temperature(temp),
            "humidity_status": self._assess_humidity(humidity),
            "irrigation_needed": humidity < 40 or temp > 35,
            "disease_risk": self._assess_disease_risk(temp, humidity),
            "frost_risk": temp < 5,
            "heat_stress_risk": temp > 40
        }
        
        # Rainfall forecast
        if forecast.get("success"):
            rain_chance = max(
                f.get("pop", 0) for f in forecast.get("forecasts", [])
            )
            conditions["rain_expected"] = rain_chance > 50
            conditions["rain_probability"] = rain_chance
        
        return {
            "success": True,
            "current": current,
            "forecast": forecast.get("forecasts", []),
            "agricultural_conditions": conditions,
            "recommendations": self._get_weather_recommendations(conditions)
        }
    
    def _assess_temperature(self, temp: float) -> str:
        """Assess temperature for crops."""
        if temp < 10:
            return "cold"
        elif temp < 20:
            return "cool"
        elif temp < 30:
            return "optimal"
        elif temp < 40:
            return "warm"
        else:
            return "hot"
    
    def _assess_humidity(self, humidity: float) -> str:
        """Assess humidity level."""
        if humidity < 30:
            return "dry"
        elif humidity < 50:
            return "moderate"
        elif humidity < 70:
            return "optimal"
        else:
            return "humid"
    
    def _assess_disease_risk(self, temp: float, humidity: float) -> str:
        """Assess disease risk based on weather."""
        if humidity > 80 and 20 < temp < 30:
            return "high"
        elif humidity > 60 and 15 < temp < 35:
            return "medium"
        else:
            return "low"
    
    def _get_weather_recommendations(self, conditions: Dict) -> List[str]:
        """Generate weather-based recommendations."""
        recommendations = []
        
        if conditions.get("irrigation_needed"):
            recommendations.append("Consider irrigation - low humidity or high temperature")
        
        if conditions.get("disease_risk") == "high":
            recommendations.append("High disease risk - monitor crops for fungal infections")
        
        if conditions.get("frost_risk"):
            recommendations.append("Frost risk - protect sensitive crops")
        
        if conditions.get("heat_stress_risk"):
            recommendations.append("Heat stress risk - increase irrigation frequency")
        
        if conditions.get("rain_expected"):
            recommendations.append(f"Rain expected - delay irrigation and spraying")
        
        if not recommendations:
            recommendations.append("Weather conditions are favorable for farming")
        
        return recommendations
    
    def _mock_weather(self, city: str) -> Dict[str, Any]:
        """Return mock weather data for development."""
        import random
        return {
            "success": True,
            "location": city,
            "temperature": random.uniform(20, 35),
            "feels_like": random.uniform(22, 38),
            "humidity": random.uniform(40, 80),
            "pressure": random.uniform(1010, 1020),
            "description": "partly cloudy",
            "icon": "02d",
            "wind_speed": random.uniform(2, 10),
            "clouds": random.randint(20, 80),
            "visibility": 10000,
            "sunrise": "06:00:00",
            "sunset": "18:30:00",
            "timestamp": datetime.utcnow().isoformat(),
            "_mock": True
        }
    
    def _mock_forecast(self, city: str, days: int) -> Dict[str, Any]:
        """Return mock forecast data for development."""
        import random
        from datetime import timedelta
        
        forecasts = []
        base_date = datetime.now()
        
        for i in range(days):
            date = (base_date + timedelta(days=i)).date().isoformat()
            forecasts.append({
                "date": date,
                "temperature": random.uniform(22, 32),
                "temp_min": random.uniform(18, 25),
                "temp_max": random.uniform(30, 38),
                "humidity": random.uniform(50, 80),
                "description": random.choice(["sunny", "partly cloudy", "cloudy"]),
                "icon": "02d",
                "wind_speed": random.uniform(3, 12),
                "pop": random.uniform(0, 40)
            })
        
        return {
            "success": True,
            "location": city,
            "forecasts": forecasts,
            "timestamp": datetime.utcnow().isoformat(),
            "_mock": True
        }


# Service instance
weather_service = WeatherService()
