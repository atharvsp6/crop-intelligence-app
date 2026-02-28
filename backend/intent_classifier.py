"""
Bhoomi AI – Intent Classifier
LLM-based intent classification with strict JSON output and confidence scoring.
"""

import json
import logging
from groq_services import _chat, FAST_MODEL

logger = logging.getLogger(__name__)

SUPPORTED_INTENTS = [
    "crop_prediction",
    "crop_recommendation",
    "disease_detection",
    "market_analysis",
    "weather_query",
    "forum_post",
    "navigation",
    "general_chat",
]

INTENT_DESCRIPTIONS = {
    "crop_prediction": "User wants to predict crop yield, forecast harvest, or estimate production for a specific crop.",
    "crop_recommendation": "User wants crop suggestions based on soil, weather, region, or growing conditions.",
    "disease_detection": "User asks about plant disease, pest identification, symptoms, treatment, or crop health issues.",
    "market_analysis": "User asks about commodity prices, mandi rates, market trends, sell/hold advice, or financial planning.",
    "weather_query": "User asks about current weather, forecast, rainfall, temperature, or weather-based farming advice.",
    "forum_post": "User wants to post a question to the community forum, search forum posts, or interact with the community.",
    "navigation": "User wants to navigate to a specific page/section of the app (dashboard, chatbot, profile, etc.).",
    "general_chat": "General farming question, greeting, small talk, or anything that doesn't fit the above categories.",
}

CLASSIFICATION_PROMPT = """You are the intent classifier for Bhoomi AI, the central assistant of the YieldWise agricultural platform.

Given the user's message (which may have come from voice or text input), classify it into exactly ONE intent and extract your confidence.

SUPPORTED INTENTS:
{intent_list}

CONVERSATION CONTEXT (last messages):
{history}

RULES:
- Pick the SINGLE most relevant intent.
- confidence must be a float between 0.0 and 1.0.
- If the message is ambiguous or could match multiple intents, pick the strongest match but lower the confidence.
- If no intent is clearly matched, use "general_chat".
- For navigation requests like "go to dashboard", "open disease detector", "show me profile" → use "navigation".
- Return ONLY valid JSON, no extra text.

OUTPUT JSON SCHEMA (strict):
{{
  "intent": "<one of the supported intents>",
  "confidence": <float 0.0-1.0>,
  "reasoning": "<one sentence explaining why>"
}}"""


def classify_intent(message: str, history: list[dict] | None = None) -> dict:
    """
    Classify user message into a supported intent using LLM.

    Returns:
        dict with keys: intent, confidence, reasoning
    """
    history = history or []

    # Build intent list for the prompt
    intent_list = "\n".join(
        f"- {name}: {desc}" for name, desc in INTENT_DESCRIPTIONS.items()
    )

    # Build conversation history string (last 5 messages)
    recent = history[-5:] if len(history) > 5 else history
    if recent:
        history_str = "\n".join(
            f"  {m.get('role', 'user').upper()}: {m.get('content', '')}" for m in recent
        )
    else:
        history_str = "  (no prior context)"

    system_prompt = CLASSIFICATION_PROMPT.format(
        intent_list=intent_list,
        history=history_str,
    )

    try:
        result = _chat(
            system_prompt,
            f"User message: {message}",
            model=FAST_MODEL,
            json_mode=True,
            max_tokens=200,
            temperature=0.1,
        )

        if isinstance(result, dict):
            # Validate intent
            intent = result.get("intent", "general_chat")
            if intent not in SUPPORTED_INTENTS:
                intent = "general_chat"
                result["confidence"] = min(result.get("confidence", 0.5), 0.5)

            result["intent"] = intent
            result.setdefault("confidence", 0.7)
            result.setdefault("reasoning", "")
            return result

        # Unexpected format
        logger.warning("Intent classifier returned non-dict: %s", type(result))
        return {"intent": "general_chat", "confidence": 0.5, "reasoning": "Fallback due to unexpected LLM output."}

    except Exception as exc:
        logger.error("Intent classification failed: %s", exc)
        return {"intent": "general_chat", "confidence": 0.3, "reasoning": f"Classification error: {exc}"}
