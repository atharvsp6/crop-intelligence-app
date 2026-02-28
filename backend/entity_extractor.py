"""
Bhoomi AI – Entity Extractor
LLM-based structured entity extraction with per-intent JSON schemas.
"""

import json
import logging
from groq_services import _chat, FAST_MODEL

logger = logging.getLogger(__name__)

# ── Per-intent entity schemas ──────────────────────────────────────────

ENTITY_SCHEMAS: dict[str, dict] = {
    "crop_prediction": {
        "crop": {"type": "string", "required": True, "description": "Name of the crop (e.g. wheat, rice)"},
        "region": {"type": "string", "required": False, "description": "State or district in India"},
        "season": {"type": "string", "required": False, "description": "Kharif, Rabi, Zaid, or month"},
        "area_acres": {"type": "number", "required": False, "description": "Land area in acres"},
    },
    "crop_recommendation": {
        "soil_type": {"type": "string", "required": False, "description": "Soil type (alluvial, black, red, laterite, etc.)"},
        "temperature": {"type": "number", "required": False, "description": "Temperature in celsius"},
        "humidity": {"type": "number", "required": False, "description": "Humidity percentage"},
        "rainfall": {"type": "number", "required": False, "description": "Annual rainfall in mm"},
        "water_availability": {"type": "string", "required": False, "description": "low, medium, or high"},
        "region": {"type": "string", "required": False, "description": "State or district"},
        "season": {"type": "string", "required": False, "description": "Kharif, Rabi, Zaid"},
        "budget": {"type": "string", "required": False, "description": "Farmer's budget"},
        "land_size": {"type": "string", "required": False, "description": "Land area"},
    },
    "disease_detection": {
        "crop": {"type": "string", "required": False, "description": "Affected crop name"},
        "symptoms": {"type": "string", "required": False, "description": "Observed symptoms"},
        "disease_name": {"type": "string", "required": False, "description": "Known disease name if mentioned"},
        "severity": {"type": "string", "required": False, "description": "mild, moderate, or severe"},
        "region": {"type": "string", "required": False, "description": "Location/state"},
    },
    "market_analysis": {
        "crop": {"type": "string", "required": False, "description": "Commodity name"},
        "region": {"type": "string", "required": False, "description": "Market/state"},
        "analysis_type": {"type": "string", "required": False, "description": "price, trend, prediction, mandi, sell_advice"},
    },
    "weather_query": {
        "location": {"type": "string", "required": False, "description": "City, district, or state name"},
        "query_type": {"type": "string", "required": False, "description": "current, forecast, alerts, rainfall"},
        "crop": {"type": "string", "required": False, "description": "Crop relevant to weather advisory"},
    },
    "forum_post": {
        "question": {"type": "string", "required": False, "description": "The forum question to post or search"},
        "category": {"type": "string", "required": False, "description": "Forum category"},
        "action": {"type": "string", "required": False, "description": "post, search, or browse"},
    },
    "navigation": {
        "target": {"type": "string", "required": True, "description": "Target page/section name"},
    },
    "general_chat": {
        "topic": {"type": "string", "required": False, "description": "Topic of conversation if identifiable"},
    },
}

# ── Navigation mapping (normalised target → app route) ────────────────

NAVIGATION_MAP = {
    "dashboard": "/dashboard",
    "home": "/dashboard",
    "crop predictor": "/dashboard/crop-predictor",
    "crop prediction": "/dashboard/crop-predictor",
    "predict": "/dashboard/crop-predictor",
    "yield": "/dashboard/crop-predictor",
    "disease detector": "/dashboard/disease-detector",
    "disease detection": "/dashboard/disease-detector",
    "disease": "/dashboard/disease-detector",
    "financial dashboard": "/dashboard/financial-dashboard",
    "finance": "/dashboard/financial-dashboard",
    "market intelligence": "/dashboard/market-intelligence",
    "market": "/dashboard/market-intelligence",
    "mandi": "/dashboard/mandi-data",
    "mandi data": "/dashboard/mandi-data",
    "mandi prices": "/dashboard/mandi-data",
    "community forum": "/dashboard/community-forum",
    "forum": "/dashboard/community-forum",
    "chatbot": "/dashboard/chatbot",
    "chat": "/dashboard/chatbot",
    "multilingual chatbot": "/dashboard/multilingual-chatbot",
    "multilingual": "/dashboard/multilingual-chatbot",
    "smart advisor": "/dashboard/smart-advisor",
    "advisor": "/dashboard/smart-advisor",
    "profile": "/dashboard/profile",
    "settings": "/dashboard/profile",
}

EXTRACTION_PROMPT = """You are the entity extractor for Bhoomi AI, the assistant of the YieldWise agricultural platform.

Given the classified intent "{intent}" and the user's message, extract structured entities.

ENTITY SCHEMA for intent "{intent}":
{schema_desc}

RULES:
- Extract ONLY entities that are explicitly mentioned or clearly implied.
- Do NOT hallucinate or guess values that aren't in the message.
- Use null for any entity not found in the message.
- For navigation intent, normalise the target to one of: {nav_targets}
- Return ONLY valid JSON matching the schema.

OUTPUT: A JSON object with the entity keys listed above. Use null for missing values."""


def extract_entities(message: str, intent: str) -> dict:
    """
    Extract structured entities from user message based on classified intent.

    Returns:
        dict of extracted entities (values may be null/None for unmentioned entities)
    """
    schema = ENTITY_SCHEMAS.get(intent, ENTITY_SCHEMAS["general_chat"])

    schema_desc = "\n".join(
        f"  - {name} ({spec['type']}, {'required' if spec.get('required') else 'optional'}): {spec['description']}"
        for name, spec in schema.items()
    )

    nav_targets = ", ".join(sorted(NAVIGATION_MAP.keys()))

    system_prompt = EXTRACTION_PROMPT.format(
        intent=intent,
        schema_desc=schema_desc,
        nav_targets=nav_targets,
    )

    try:
        result = _chat(
            system_prompt,
            f"User message: {message}",
            model=FAST_MODEL,
            json_mode=True,
            max_tokens=300,
            temperature=0.1,
        )

        if isinstance(result, dict):
            # For navigation, resolve the route
            if intent == "navigation" and result.get("target"):
                target = str(result["target"]).lower().strip()
                result["route"] = NAVIGATION_MAP.get(target)
                # Fuzzy match if exact lookup fails
                if not result["route"]:
                    for key, route in NAVIGATION_MAP.items():
                        if key in target or target in key:
                            result["route"] = route
                            break
                # Final fallback – search in full message
                if not result["route"]:
                    msg_lower = message.lower()
                    for key, route in NAVIGATION_MAP.items():
                        if key in msg_lower:
                            result["route"] = route
                            break
            return result

        logger.warning("Entity extractor returned non-dict: %s", type(result))
        return {}

    except Exception as exc:
        logger.error("Entity extraction failed: %s", exc)
        return {}


def get_missing_required(intent: str, entities: dict) -> list[str]:
    """Return list of required entity names that are missing or null."""
    schema = ENTITY_SCHEMAS.get(intent, {})
    missing = []
    for name, spec in schema.items():
        if spec.get("required") and not entities.get(name):
            missing.append(name)
    return missing
