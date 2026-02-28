"""
Groq-powered AI services for YieldWise.
Provides crop recommendation, disease intelligence, market prediction,
financial planning, weather alerts, forum AI assistant, and voice advisory.
"""

import os
import json
import logging
from datetime import datetime
from database import get_collection

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lazy Groq client initialisation
# ---------------------------------------------------------------------------
_groq_client = None

def _get_client():
    """Return a cached Groq client (created on first call)."""
    global _groq_client
    if _groq_client is None:
        try:
            from groq import Groq
            api_key = os.environ.get("GROQ_API_KEY")
            if not api_key:
                logger.warning("GROQ_API_KEY not set – Groq services will be unavailable")
                return None
            _groq_client = Groq(api_key=api_key)
            logger.info("Groq client initialised successfully")
        except ImportError:
            logger.warning("groq package not installed – run `pip install groq`")
            return None
        except Exception as exc:
            logger.error("Failed to initialise Groq client: %s", exc)
            return None
    return _groq_client


MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
FAST_MODEL = os.environ.get("GROQ_FAST_MODEL", "llama-3.1-8b-instant")
MAX_TOKENS = 1024

# ---------------------------------------------------------------------------
# Helper – call Groq chat completions
# ---------------------------------------------------------------------------

def _gemini_fallback(system_prompt: str, user_prompt: str, *,
                     max_tokens: int = MAX_TOKENS, temperature: float = 0.7,
                     json_mode: bool = False):
    """Fallback to Google Gemini when Groq returns 403 (geo-blocked)."""
    try:
        import google.generativeai as genai
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return None
        genai.configure(api_key=api_key)
        model_name = os.environ.get("MULTILINGUAL_GEMINI_MODEL") or "gemini-2.0-flash-exp"
        model = genai.GenerativeModel(model_name)

        combined_prompt = f"{system_prompt}\n\nUser: {user_prompt}"
        if json_mode:
            combined_prompt += "\n\nIMPORTANT: Respond ONLY with valid JSON, no markdown fences."

        gen_config = {"max_output_tokens": max_tokens, "temperature": temperature}
        if json_mode:
            gen_config["response_mime_type"] = "application/json"

        resp = model.generate_content(combined_prompt, generation_config=gen_config)
        text = resp.text.strip()

        if json_mode:
            # Strip markdown fences if present
            if text.startswith("```"):
                text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
            try:
                return json.loads(text)
            except json.JSONDecodeError:
                return {"raw": text}
        return text
    except Exception as fallback_exc:
        logger.error("Gemini fallback also failed: %s", fallback_exc)
        return None


def _chat(system_prompt: str, user_prompt: str, *, model: str | None = None,
          max_tokens: int = MAX_TOKENS, temperature: float = 0.7, json_mode: bool = False):
    """Low-level wrapper around Groq chat completions with Gemini fallback."""
    client = _get_client()
    if client is None:
        # No Groq client — try Gemini directly
        fallback = _gemini_fallback(system_prompt, user_prompt,
                                    max_tokens=max_tokens, temperature=temperature,
                                    json_mode=json_mode)
        if fallback is not None:
            return fallback
        return {"error": "Groq API not configured. Set GROQ_API_KEY."}

    kwargs = dict(
        model=model or MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=max_tokens,
        temperature=temperature,
    )
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    try:
        resp = client.chat.completions.create(**kwargs)
        text = resp.choices[0].message.content
        if json_mode:
            try:
                return json.loads(text)
            except json.JSONDecodeError:
                return {"raw": text}
        return text
    except Exception as exc:
        exc_str = str(exc)
        logger.error("Groq API error: %s", exc)

        # If Groq returns 403 (geo-blocked), fall back to Gemini
        if "403" in exc_str or "Forbidden" in exc_str:
            logger.info("Groq returned 403 — falling back to Gemini")
            fallback = _gemini_fallback(system_prompt, user_prompt,
                                        max_tokens=max_tokens, temperature=temperature,
                                        json_mode=json_mode)
            if fallback is not None:
                return fallback

        return {"error": exc_str}


# =====================================================================
# 2. AI-Powered Crop Recommendation System
# =====================================================================

def get_crop_recommendation(soil_type: str, temperature: float, humidity: float,
                            rainfall: float, water_availability: str,
                            region: str = "India", season: str = "",
                            budget: str = "", land_size: str = "",
                            language: str = "en"):
    """Recommend best crops based on farmer's conditions."""
    lang_map = {
        "en": "English", "hi": "Hindi (Devanagari)", "mr": "Marathi (Devanagari)",
        "ta": "Tamil script", "te": "Telugu script", "bn": "Bengali script",
    }
    lang_instruction = lang_map.get(language, "English")

    system = (
        "You are an expert agricultural scientist and crop advisor. "
        "Provide specific, actionable crop recommendations based on the farmer's conditions. "
        f"Respond entirely in {lang_instruction}. "
        "Return valid JSON with this structure: "
        '{"recommendations": [{"crop": "name", "suitability_score": 0-100, '
        '"reason": "why suitable", "expected_yield_per_acre": "X kg", '
        '"growing_season": "months", "water_requirement": "low/medium/high", '
        '"estimated_cost_per_acre": "₹X", "expected_revenue_per_acre": "₹X", '
        '"tips": ["tip1","tip2"]}], '
        '"general_advice": "overall advice", "best_season_tip": "seasonal note"}'
    )

    user = (
        f"Recommend the best crops for these conditions:\n"
        f"- Soil type: {soil_type}\n"
        f"- Temperature: {temperature}°C\n"
        f"- Humidity: {humidity}%\n"
        f"- Annual rainfall: {rainfall} mm\n"
        f"- Water availability: {water_availability}\n"
        f"- Region: {region}\n"
        f"- Season: {season or 'current'}\n"
        f"- Budget: {budget or 'not specified'}\n"
        f"- Land size: {land_size or 'not specified'}\n"
        "Recommend top 5 crops ranked by profitability & suitability."
    )

    result = _chat(system, user, json_mode=True, max_tokens=1500)

    # Store in DB
    try:
        col = get_collection("groq_crop_recommendations")
        col.insert_one({
            "input": {"soil_type": soil_type, "temperature": temperature,
                      "humidity": humidity, "rainfall": rainfall,
                      "water_availability": water_availability, "region": region},
            "result": result if isinstance(result, dict) else {"raw": result},
            "created_at": datetime.utcnow(),
        })
    except Exception:
        pass

    return result


# =====================================================================
# 3. Real-Time Disease & Pest Intelligence
# =====================================================================

def get_disease_treatment(disease_name: str, crop: str, severity: str = "moderate",
                          region: str = "India", language: str = "en"):
    """Generate detailed treatment plan for a detected disease."""
    lang_map = {
        "en": "English", "hi": "Hindi (Devanagari)", "mr": "Marathi (Devanagari)",
        "ta": "Tamil script", "te": "Telugu script", "bn": "Bengali script",
    }
    lang_instruction = lang_map.get(language, "English")

    system = (
        "You are a plant pathologist and pest management expert. "
        f"Respond entirely in {lang_instruction}. "
        "Return valid JSON: "
        '{"disease_info": {"name": "...", "scientific_name": "...", "type": "fungal/bacterial/viral/pest", '
        '"description": "..."}, '
        '"severity_assessment": {"level": "...", "spread_risk": "...", "crop_loss_estimate": "..."}, '
        '"treatment_plan": {"immediate_actions": ["..."], '
        '"organic_remedies": [{"name": "...", "application": "...", "frequency": "..."}], '
        '"chemical_treatments": [{"name": "...", "dosage": "...", "application_method": "...", "safety_period": "..."}], '
        '"biological_controls": ["..."]}, '
        '"prevention": {"cultural_practices": ["..."], "resistant_varieties": ["..."], '
        '"monitoring_schedule": "..."}, '
        '"estimated_recovery_time": "...", "when_to_seek_expert": "..."}'
    )

    user = (
        f"Provide a comprehensive treatment plan for:\n"
        f"- Disease/Pest: {disease_name}\n"
        f"- Affected crop: {crop}\n"
        f"- Severity: {severity}\n"
        f"- Region: {region}\n"
        "Include both organic and chemical solutions with local remedies."
    )

    return _chat(system, user, json_mode=True, max_tokens=1500)


def get_pest_identification(symptoms: str, crop: str, region: str = "India",
                            language: str = "en"):
    """Identify pest/disease from described symptoms."""
    lang_map = {
        "en": "English", "hi": "Hindi (Devanagari)", "mr": "Marathi (Devanagari)",
        "ta": "Tamil script", "te": "Telugu script", "bn": "Bengali script",
    }
    lang_instruction = lang_map.get(language, "English")

    system = (
        "You are an expert crop disease diagnostician. "
        f"Respond entirely in {lang_instruction}. "
        "Return valid JSON: "
        '{"possible_diseases": [{"name": "...", "confidence": "high/medium/low", '
        '"matching_symptoms": ["..."], "description": "..."}], '
        '"recommended_tests": ["..."], "immediate_action": "...", '
        '"prevention_tips": ["..."]}'
    )

    user = (
        f"Identify the disease or pest based on these symptoms:\n"
        f"- Crop: {crop}\n"
        f"- Symptoms: {symptoms}\n"
        f"- Region: {region}\n"
    )

    return _chat(system, user, json_mode=True)


# =====================================================================
# 4. Market Price Prediction & Farm-Gate Advisory
# =====================================================================

def get_market_prediction(crop: str, region: str = "India",
                          current_price: float | None = None,
                          language: str = "en"):
    """Predict market trend and provide sell/hold recommendation."""
    lang_map = {
        "en": "English", "hi": "Hindi (Devanagari)", "mr": "Marathi (Devanagari)",
        "ta": "Tamil script", "te": "Telugu script", "bn": "Bengali script",
    }
    lang_instruction = lang_map.get(language, "English")

    price_ctx = f"Current market price: ₹{current_price}/kg" if current_price else "Current price not provided"

    system = (
        "You are a commodity market analyst specialising in agricultural products. "
        f"Respond entirely in {lang_instruction}. "
        "Return valid JSON: "
        '{"crop": "...", "current_analysis": {"price_trend": "rising/stable/falling", '
        '"demand_outlook": "...", "supply_situation": "..."}, '
        '"prediction": {"short_term_7d": {"direction": "up/stable/down", "estimated_change_pct": X, "confidence": "..."}, '
        '"medium_term_30d": {"direction": "...", "estimated_change_pct": X, "confidence": "..."}, '
        '"best_selling_window": "..."}, '
        '"advisory": {"recommendation": "SELL/HOLD/WAIT", "reason": "...", '
        '"best_mandis": [{"name": "...", "expected_price": "₹X/kg", "distance_note": "..."}], '
        '"storage_advice": "..."}, '
        '"risk_factors": ["..."], "market_insights": "..."}'
    )

    user = (
        f"Provide market analysis and price prediction for:\n"
        f"- Crop: {crop}\n"
        f"- Region: {region}\n"
        f"- {price_ctx}\n"
        "Give actionable sell/hold advice with specific mandi recommendations."
    )

    return _chat(system, user, json_mode=True, max_tokens=1500)


# =====================================================================
# 5. Financial Planning Assistant
# =====================================================================

def get_financial_plan(crop: str, area_acres: float, region: str = "India",
                       budget: float | None = None, current_season: str = "",
                       language: str = "en"):
    """Generate comprehensive farm financial plan."""
    lang_map = {
        "en": "English", "hi": "Hindi (Devanagari)", "mr": "Marathi (Devanagari)",
        "ta": "Tamil script", "te": "Telugu script", "bn": "Bengali script",
    }
    lang_instruction = lang_map.get(language, "English")

    budget_ctx = f"Budget: ₹{budget}" if budget else "Budget: not specified"

    system = (
        "You are an agricultural financial advisor with deep knowledge of Indian farming economics. "
        f"Respond entirely in {lang_instruction}. "
        "Return valid JSON: "
        '{"financial_summary": {"total_investment": "₹X", "expected_revenue": "₹X", '
        '"expected_profit": "₹X", "roi_percentage": X, "breakeven_yield": "X kg/acre"}, '
        '"cost_breakdown": [{"category": "...", "amount": "₹X", "percentage": X}], '
        '"revenue_projection": {"optimistic": "₹X", "realistic": "₹X", "pessimistic": "₹X"}, '
        '"crop_rotation_plan": [{"season": "...", "crop": "...", "reason": "..."}], '
        '"risk_mitigation": [{"risk": "...", "mitigation": "...", "insurance_option": "..."}], '
        '"government_schemes": [{"name": "...", "benefit": "...", "how_to_apply": "..."}], '
        '"monthly_cash_flow": [{"month": "...", "expense": "₹X", "income": "₹X"}], '
        '"business_plan_summary": "..."}'
    )

    user = (
        f"Create a comprehensive financial plan for:\n"
        f"- Crop: {crop}\n"
        f"- Land area: {area_acres} acres\n"
        f"- Region: {region}\n"
        f"- {budget_ctx}\n"
        f"- Season: {current_season or 'current'}\n"
        "Include ROI analysis, crop rotation, government schemes, and risk mitigation."
    )

    return _chat(system, user, json_mode=True, max_tokens=2000)


# =====================================================================
# 6. Weather-Triggered Smart Alerts
# =====================================================================

def get_weather_alerts(weather_data: dict, crops: list[str],
                       region: str = "India", language: str = "en"):
    """Analyse weather forecast and generate smart farming alerts."""
    lang_map = {
        "en": "English", "hi": "Hindi (Devanagari)", "mr": "Marathi (Devanagari)",
        "ta": "Tamil script", "te": "Telugu script", "bn": "Bengali script",
    }
    lang_instruction = lang_map.get(language, "English")

    system = (
        "You are an agro-meteorologist who advises farmers based on weather conditions. "
        f"Respond entirely in {lang_instruction}. "
        "Return valid JSON: "
        '{"alerts": [{"severity": "critical/warning/info", "title": "...", '
        '"description": "...", "affected_crops": ["..."], '
        '"recommended_actions": ["..."], "time_window": "..."}], '
        '"daily_plan": {"irrigation": "...", "spraying": "...", '
        '"harvesting": "...", "planting": "..."}, '
        '"weekly_outlook": "...", "long_term_advisory": "..."}'
    )

    weather_str = json.dumps(weather_data, default=str) if isinstance(weather_data, dict) else str(weather_data)

    user = (
        f"Analyse this weather data and generate smart farming alerts:\n"
        f"- Weather data: {weather_str}\n"
        f"- Crops being grown: {', '.join(crops)}\n"
        f"- Region: {region}\n"
        "Provide actionable alerts with severity levels and recommended actions."
    )

    return _chat(system, user, json_mode=True, max_tokens=1500)


# =====================================================================
# 9. Community Forum AI Assistant
# =====================================================================

def get_forum_ai_answer(question: str, category: str = "general",
                        language: str = "en"):
    """Answer a farmer's forum question using AI."""
    lang_map = {
        "en": "English", "hi": "Hindi (Devanagari)", "mr": "Marathi (Devanagari)",
        "ta": "Tamil script", "te": "Telugu script", "bn": "Bengali script",
    }
    lang_instruction = lang_map.get(language, "English")

    system = (
        "You are an experienced agricultural expert answering questions in a farmer's community forum. "
        f"Respond entirely in {lang_instruction}. "
        "Be practical, friendly, and provide specific advice that farmers can easily follow. "
        "Return valid JSON: "
        '{"answer": "...", "key_points": ["..."], '
        '"related_topics": ["..."], "expert_tips": ["..."], '
        '"references": ["..."]}'
    )

    user = (
        f"Answer this farmer's question (Category: {category}):\n\n"
        f"{question}\n\n"
        "Provide a helpful, practical answer."
    )

    return _chat(system, user, json_mode=True, model=FAST_MODEL)


def moderate_forum_post(content: str, language: str = "en"):
    """Check forum post for appropriateness and suggest improvements."""
    system = (
        "You are a community forum moderator for a farming platform. "
        "Check the post for: spam, inappropriate content, misinformation. "
        "Return valid JSON: "
        '{"is_appropriate": true/false, "issues": ["..."], '
        '"suggestions": ["..."], "category_suggestion": "...", '
        '"quality_score": 0-100}'
    )

    return _chat(system, f"Moderate this forum post:\n\n{content}",
                 json_mode=True, model=FAST_MODEL, temperature=0.3)


# =====================================================================
# 10. Voice Advisory System (text generation for TTS)
# =====================================================================

def get_voice_advisory(query: str, context: str = "", language: str = "en"):
    """Generate a concise spoken-style advisory response for TTS output."""
    lang_map = {
        "en": "English", "hi": "Hindi (Devanagari)", "mr": "Marathi (Devanagari)",
        "ta": "Tamil script", "te": "Telugu script", "bn": "Bengali script",
    }
    lang_instruction = lang_map.get(language, "English")

    system = (
        "You are a friendly agricultural voice assistant helping farmers. "
        f"Respond entirely in {lang_instruction}. "
        "Keep responses SHORT (under 150 words), conversational, and easy to understand when spoken aloud. "
        "Avoid complex jargon – explain simply. "
        "Return valid JSON: "
        '{"spoken_response": "...", "key_advice": ["..."], '
        '"follow_up_question": "..."}'
    )

    ctx = f"\nContext: {context}" if context else ""
    user = f"Farmer asks: {query}{ctx}"

    return _chat(system, user, json_mode=True, model=FAST_MODEL, max_tokens=500, temperature=0.8)


# =====================================================================
# General quick-advice endpoint (used across modules)
# =====================================================================

def get_quick_advice(topic: str, details: str, language: str = "en"):
    """Get quick farming advice on any topic."""
    lang_map = {
        "en": "English", "hi": "Hindi (Devanagari)", "mr": "Marathi (Devanagari)",
        "ta": "Tamil script", "te": "Telugu script", "bn": "Bengali script",
    }
    lang_instruction = lang_map.get(language, "English")

    system = (
        "You are an agricultural AI assistant. Give concise, actionable advice. "
        f"Respond entirely in {lang_instruction}."
    )

    return _chat(system, f"Topic: {topic}\nDetails: {details}", model=FAST_MODEL)
