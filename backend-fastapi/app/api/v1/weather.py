"""
Weather API Routes
"""
from fastapi import APIRouter, Query
from typing import Optional

from app.services import weather_service
from app.schemas import WeatherResponse

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("/current")
async def get_current_weather(
    city: str = Query(..., description="City name"),
    state: Optional[str] = Query(None, description="State name"),
    country: str = Query("IN", description="Country code")
):
    """
    Get current weather for a location.
    
    Returns temperature, humidity, wind, and other conditions.
    Optimized for Indian locations.
    """
    return await weather_service.get_current_weather(city, state, country)


@router.get("/forecast")
async def get_weather_forecast(
    city: str = Query(..., description="City name"),
    state: Optional[str] = Query(None, description="State name"),
    country: str = Query("IN", description="Country code"),
    days: int = Query(5, ge=1, le=5, description="Number of days")
):
    """
    Get weather forecast for upcoming days.
    
    Returns daily forecasts including temperature, humidity, and precipitation probability.
    Free tier supports up to 5 days.
    """
    return await weather_service.get_forecast(city, state, country, days)


@router.get("/agricultural")
async def get_agricultural_weather(
    city: str = Query(..., description="City name"),
    state: Optional[str] = Query(None, description="State name")
):
    """
    Get weather data formatted for agricultural use.
    
    Includes:
    - Current conditions
    - 5-day forecast
    - Growing conditions assessment
    - Disease risk evaluation
    - Irrigation recommendations
    - Agricultural alerts
    """
    return await weather_service.get_agricultural_weather(city, state)


@router.get("/alerts")
async def get_weather_alerts(
    city: str = Query(..., description="City name"),
    state: Optional[str] = Query(None, description="State name")
):
    """
    Get weather-based agricultural alerts.
    
    Includes alerts for:
    - Frost risk
    - Heat stress
    - Heavy rainfall
    - Disease-favorable conditions
    """
    agri_weather = await weather_service.get_agricultural_weather(city, state)
    
    if not agri_weather.get("success"):
        return agri_weather
    
    conditions = agri_weather.get("agricultural_conditions", {})
    
    alerts = []
    
    if conditions.get("frost_risk"):
        alerts.append({
            "type": "frost",
            "severity": "high",
            "message": "Frost conditions expected. Protect sensitive crops."
        })
    
    if conditions.get("heat_stress_risk"):
        alerts.append({
            "type": "heat",
            "severity": "high",
            "message": "Extreme heat expected. Increase irrigation frequency."
        })
    
    if conditions.get("disease_risk") == "high":
        alerts.append({
            "type": "disease",
            "severity": "medium",
            "message": "High disease risk due to weather. Monitor crops closely."
        })
    
    if conditions.get("irrigation_needed"):
        alerts.append({
            "type": "irrigation",
            "severity": "low",
            "message": "Irrigation recommended based on current conditions."
        })
    
    return {
        "success": True,
        "location": city,
        "alerts": alerts,
        "alert_count": len(alerts),
        "recommendations": agri_weather.get("recommendations", [])
    }
