"""
Bhoomi AI – Flask Routes
Single unified endpoint replacing the old voice-intent / voice-answer pipeline.
"""

import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bhoomi_engine import BhoomiEngine

logger = logging.getLogger(__name__)

bhoomi_bp = Blueprint("bhoomi", __name__, url_prefix="/api/bhoomi")

# Lazy-initialised engine singleton
_engine: BhoomiEngine | None = None


def _get_engine() -> BhoomiEngine:
    global _engine
    if _engine is None:
        _engine = BhoomiEngine()
    return _engine


# ── POST /api/bhoomi/process ──────────────────────────────────────────

@bhoomi_bp.route("/process", methods=["POST"])
@jwt_required()
def bhoomi_process():
    """
    Unified Bhoomi AI processing endpoint.

    Accepts:
        {
            "message": "user text or transcript",
            "input_type": "text" | "voice"    (optional, default "text")
        }

    Returns:
        {
            "success": true,
            "intent": "...",
            "confidence": 0.0,
            "entities": {...},
            "response_text": "...",
            "data": {...},
            "navigate_to": "/route-or-null",
            "requires_followup": false
        }
    """
    try:
        data = request.get_json(force=True)
        message = (data.get("message") or "").strip()
        input_type = data.get("input_type", "text")
        lat = data.get("lat")
        lon = data.get("lon")

        if not message:
            return jsonify({
                "success": False,
                "error": "Empty message. Please provide text or a voice transcript.",
            }), 400

        user_id = get_jwt_identity() or "anonymous"

        # Build location context from browser geolocation
        location_ctx = None
        if lat is not None and lon is not None:
            try:
                location_ctx = {"lat": float(lat), "lon": float(lon)}
            except (ValueError, TypeError):
                pass

        engine = _get_engine()
        result = engine.process(message, str(user_id), input_type, location=location_ctx)

        return jsonify({"success": True, **result})

    except Exception as exc:
        logger.error("Bhoomi process error: %s", exc, exc_info=True)
        return jsonify({
            "success": False,
            "error": "Bhoomi AI encountered an internal error. Please try again.",
            "intent": "general_chat",
            "confidence": 0,
            "entities": {},
            "response_text": "Sorry, something went wrong. Please try again.",
            "data": {},
            "navigate_to": None,
            "requires_followup": False,
        }), 500


# ── POST /api/bhoomi/clear-history ────────────────────────────────────

@bhoomi_bp.route("/clear-history", methods=["POST"])
@jwt_required()
def bhoomi_clear_history():
    """Clear the conversation history for the current user."""
    try:
        user_id = get_jwt_identity() or "anonymous"

        engine = _get_engine()
        engine.clear_history(str(user_id))

        return jsonify({"success": True, "message": "Conversation history cleared."})
    except Exception as exc:
        logger.error("Bhoomi clear-history error: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


# ── GET /api/bhoomi/status ────────────────────────────────────────────

@bhoomi_bp.route("/status", methods=["GET"])
def bhoomi_status():
    """Health check for Bhoomi AI subsystem."""
    return jsonify({
        "success": True,
        "service": "bhoomi_ai",
        "version": "1.0.0",
        "capabilities": [
            "text_input",
            "voice_input",
            "intent_classification",
            "entity_extraction",
            "crop_prediction",
            "crop_recommendation",
            "disease_detection",
            "market_analysis",
            "weather_query",
            "forum_post",
            "navigation",
            "general_chat",
            "conversation_memory",
        ],
    })
