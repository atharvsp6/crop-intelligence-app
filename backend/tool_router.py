"""
Bhoomi AI – Tool Router
Maps classified intents to internal API functions and executes them.
Uses a registry-pattern dictionary for clean extensibility.
"""

import logging
from datetime import datetime
from database import get_collection

logger = logging.getLogger(__name__)


# ── Internal tool functions ────────────────────────────────────────────

def _tool_crop_prediction(entities: dict, user_id: str | None = None) -> dict:
    """Route to crop yield prediction."""
    try:
        from flask_ready_crop_yield_predictor.flask_ready_crop_yield_predictor import predict_yield

        crop = entities.get("crop", "wheat")
        region = entities.get("region", "India")
        season = entities.get("season", "")
        area = entities.get("area_acres")

        # Use the ML predictor
        prediction = predict_yield(crop=crop, state=region)

        summary = f"Based on our model, the predicted yield for {crop}"
        if region and region != "India":
            summary += f" in {region}"
        summary += f" is approximately {prediction.get('predicted_yield', 'N/A')} tonnes per hectare."

        return {
            "action_taken": "crop_yield_prediction",
            "prediction": prediction,
            "summary": summary,
            "navigate_to": "/dashboard/crop-predictor",
        }
    except Exception as exc:
        logger.error("Crop prediction tool error: %s", exc)
        return {
            "action_taken": "crop_yield_prediction",
            "error": str(exc),
            "summary": "I couldn't run the crop yield prediction right now. Please try using the Crop Predictor page directly.",
            "navigate_to": "/dashboard/crop-predictor",
        }


def _tool_crop_recommendation(entities: dict, user_id: str | None = None) -> dict:
    """Route to Groq-powered crop recommendation."""
    try:
        from groq_services import get_crop_recommendation

        result = get_crop_recommendation(
            soil_type=entities.get("soil_type", "not specified"),
            temperature=float(entities.get("temperature") or 25),
            humidity=float(entities.get("humidity") or 60),
            rainfall=float(entities.get("rainfall") or 800),
            water_availability=entities.get("water_availability", "medium"),
            region=entities.get("region", "India"),
            season=entities.get("season", ""),
            budget=entities.get("budget", ""),
            land_size=entities.get("land_size", ""),
        )

        if isinstance(result, dict) and "recommendations" in result:
            top_crops = [r.get("crop", "?") for r in result["recommendations"][:3]]
            summary = f"Based on your conditions, I recommend: {', '.join(top_crops)}."
        else:
            summary = "Here are my crop recommendations based on your conditions."

        return {
            "action_taken": "crop_recommendation",
            "result": result,
            "summary": summary,
        }
    except Exception as exc:
        logger.error("Crop recommendation tool error: %s", exc)
        return {
            "action_taken": "crop_recommendation",
            "error": str(exc),
            "summary": "I couldn't generate crop recommendations right now. Please try the Smart Advisor.",
            "navigate_to": "/dashboard/smart-advisor",
        }


def _tool_disease_detection(entities: dict, user_id: str | None = None) -> dict:
    """Route to disease identification or treatment."""
    try:
        disease_name = entities.get("disease_name")
        symptoms = entities.get("symptoms")
        crop = entities.get("crop", "not specified")
        region = entities.get("region", "India")
        severity = entities.get("severity", "moderate")

        if disease_name:
            from groq_services import get_disease_treatment
            result = get_disease_treatment(
                disease_name=disease_name,
                crop=crop,
                severity=severity,
                region=region,
            )
            summary = f"Here's a treatment plan for {disease_name} in {crop}."
        elif symptoms:
            from groq_services import get_pest_identification
            result = get_pest_identification(
                symptoms=symptoms,
                crop=crop,
                region=region,
            )
            summary = "I've analysed the symptoms you described. Here are the possible diseases."
        else:
            return {
                "action_taken": "disease_detection",
                "summary": "To help detect a disease, please describe the symptoms you're observing or upload a photo on the Disease Detector page.",
                "navigate_to": "/dashboard/disease-detector",
            }

        return {
            "action_taken": "disease_detection",
            "result": result,
            "summary": summary,
        }
    except Exception as exc:
        logger.error("Disease detection tool error: %s", exc)
        return {
            "action_taken": "disease_detection",
            "error": str(exc),
            "summary": "I couldn't process the disease query. Please try the Disease Detector page.",
            "navigate_to": "/dashboard/disease-detector",
        }


def _tool_market_analysis(entities: dict, user_id: str | None = None) -> dict:
    """Route to market analysis / mandi data."""
    try:
        crop = entities.get("crop", "wheat")
        region = entities.get("region", "India")
        analysis_type = (entities.get("analysis_type") or "").lower()

        # If asking specifically about mandi prices, fetch mandi data
        if analysis_type in ("mandi", "price", "prices"):
            from market_data_service import MarketDataService
            mds = MarketDataService()
            mandi_result = mds.get_mandi_data(commodity=crop, limit=10)
            summary_data = mandi_result.get("summary", {})
            avg_price = summary_data.get("average_price_per_kg")
            if avg_price:
                summary = f"The average mandi price for {crop} is ₹{avg_price}/kg across {summary_data.get('markets_tracked', 'multiple')} markets."
            else:
                summary = f"Here's the latest mandi data for {crop}."
            return {
                "action_taken": "mandi_data",
                "result": mandi_result,
                "summary": summary,
                "navigate_to": "/dashboard/mandi-data",
            }

        # Otherwise use Groq market prediction
        from groq_services import get_market_prediction
        result = get_market_prediction(crop=crop, region=region)

        if isinstance(result, dict):
            advisory = result.get("advisory", {})
            rec = advisory.get("recommendation", "")
            summary = f"Market analysis for {crop}: {rec}." if rec else f"Here's the market analysis for {crop}."
        else:
            summary = f"Here's the market analysis for {crop}."

        return {
            "action_taken": "market_analysis",
            "result": result,
            "summary": summary,
            "navigate_to": "/dashboard/market-intelligence",
        }
    except Exception as exc:
        logger.error("Market analysis tool error: %s", exc)
        return {
            "action_taken": "market_analysis",
            "error": str(exc),
            "summary": "I couldn't fetch market data right now. Please check the Market Intelligence page.",
            "navigate_to": "/dashboard/market-intelligence",
        }


def _tool_weather_query(entities: dict, user_id: str | None = None) -> dict:
    """Route to weather service."""
    try:
        from weather_service import WeatherService
        ws = WeatherService()

        location = entities.get("location")
        query_type = (entities.get("query_type") or "current").lower()

        if not location:
            return {
                "action_taken": "weather_query",
                "summary": "Which location would you like the weather for? Please provide a city or district name.",
                "requires_followup": True,
            }

        # Geocode the location name using the existing service method
        coords = ws.get_coordinates_by_city(location)
        if not coords:
            return {
                "action_taken": "weather_query",
                "summary": f"I couldn't find the location '{location}'. Please try a different city or district name.",
                "requires_followup": True,
            }

        lat, lon = coords["lat"], coords["lon"]

        if query_type == "forecast":
            weather_data = ws.get_weather_forecast(lat, lon, location_name=location)
        else:
            weather_data = ws.get_current_weather(lat, lon, location_name=location)

        if weather_data.get("success"):
            curr = weather_data.get("current", {})
            loc_name = weather_data.get("location", {}).get("name", location)
            temp = curr.get("temperature", "N/A")
            desc = curr.get("description", "")
            humidity = curr.get("humidity", "N/A")
            summary = f"Weather in {loc_name}: {temp}°C, {desc}. Humidity: {humidity}%."
        else:
            summary = f"I got weather data for {location} but it may be incomplete."

        return {
            "action_taken": "weather_query",
            "result": weather_data,
            "summary": summary,
        }
    except Exception as exc:
        logger.error("Weather tool error: %s", exc)
        return {
            "action_taken": "weather_query",
            "error": str(exc),
            "summary": "I couldn't fetch weather data right now. Please try again.",
        }


def _tool_forum_post(entities: dict, user_id: str | None = None) -> dict:
    """Route to forum actions."""
    action = (entities.get("action") or "browse").lower()
    question = entities.get("question", "")

    if action == "post" and question:
        return {
            "action_taken": "forum_post",
            "summary": f"I'll take you to the Community Forum so you can post your question: \"{question}\"",
            "navigate_to": "/dashboard/community-forum",
            "prefill": {"question": question, "category": entities.get("category", "general")},
        }

    if action == "search" and question:
        return {
            "action_taken": "forum_search",
            "summary": f"Let me take you to the forum to search for: \"{question}\"",
            "navigate_to": "/dashboard/community-forum",
            "prefill": {"search": question},
        }

    return {
        "action_taken": "forum_browse",
        "summary": "Opening the Community Forum for you.",
        "navigate_to": "/dashboard/community-forum",
    }


def _tool_navigation(entities: dict, user_id: str | None = None) -> dict:
    """Handle explicit navigation requests."""
    route = entities.get("route")
    target = entities.get("target", "dashboard")

    if route:
        # Build a friendly label from the route
        label = route.split("/")[-1].replace("-", " ").title()
        return {
            "action_taken": "navigation",
            "summary": f"Navigating to {label}.",
            "navigate_to": route,
        }

    return {
        "action_taken": "navigation",
        "summary": f"I'm not sure which page you mean by '{target}'. Could you try again?",
        "requires_followup": True,
    }


def _tool_general_chat(entities: dict, user_id: str | None = None) -> dict:
    """Placeholder — general chat is handled directly by the orchestrator's summariser."""
    return {
        "action_taken": "general_chat",
        "summary": "",  # Will be overridden by the orchestrator
    }


# ── Tool Registry ────────────────────────────────────────────────────

TOOL_REGISTRY: dict[str, callable] = {
    "crop_prediction": _tool_crop_prediction,
    "crop_recommendation": _tool_crop_recommendation,
    "disease_detection": _tool_disease_detection,
    "market_analysis": _tool_market_analysis,
    "weather_query": _tool_weather_query,
    "forum_post": _tool_forum_post,
    "navigation": _tool_navigation,
    "general_chat": _tool_general_chat,
}


def route_to_tool(intent: str, entities: dict, user_id: str | None = None) -> dict:
    """
    Look up the tool function for the given intent and execute it.

    Returns:
        dict with keys: action_taken, summary, and optionally result, navigate_to, requires_followup, error
    """
    tool_fn = TOOL_REGISTRY.get(intent, _tool_general_chat)
    try:
        return tool_fn(entities, user_id)
    except Exception as exc:
        logger.error("Tool execution failed for intent '%s': %s", intent, exc)
        return {
            "action_taken": intent,
            "error": str(exc),
            "summary": "Something went wrong while processing your request. Please try again.",
        }
