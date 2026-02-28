"""
Bhoomi AI – Core Orchestration Engine
Central pipeline: input → intent classification → entity extraction → tool routing → response generation.
Maintains conversational memory in MongoDB.
"""

import json
import logging
from datetime import datetime, timedelta
from database import get_collection
from intent_classifier import classify_intent, SUPPORTED_INTENTS
from entity_extractor import extract_entities, get_missing_required
from tool_router import route_to_tool
from groq_services import _chat, MODEL, FAST_MODEL

logger = logging.getLogger(__name__)

# ── Constants ──────────────────────────────────────────────────────────

CONFIDENCE_THRESHOLD = 0.7
MAX_HISTORY_MESSAGES = 5
SESSION_TTL_HOURS = 2

# ── Response summarisation prompt ─────────────────────────────────────

SUMMARISE_PROMPT = """You are Bhoomi AI, the intelligent farming assistant of YieldWise.

Given the user's original message, the classified intent, extracted entities, and tool result,
compose a helpful, concise, natural-language response for the user.

USER MESSAGE: {message}
INTENT: {intent}
ENTITIES: {entities}
TOOL RESULT: {tool_result}

RULES:
- Be conversational, warm, and to the point.
- If data is available in the tool result, summarise the key findings.
- If there was an error, apologise and suggest what the user can do instead.
- Keep the response under 200 words.
- Do NOT repeat raw JSON to the user. Speak naturally.
- If the tool suggests navigating somewhere, mention it naturally.
- Use Indian context (₹, quintal, hectare, mandi, etc.) where relevant.

Respond with ONLY the natural-language message text (no JSON wrapper)."""

GENERAL_CHAT_PROMPT = """You are Bhoomi AI, the intelligent farming assistant of YieldWise — an agricultural intelligence platform for Indian farmers.

CONVERSATION HISTORY:
{history}

RULES:
- Be friendly, concise, and practical.
- If the question is about farming, crops, soil, weather, pests, markets, or rural life, answer with expertise.
- For greetings, respond warmly and offer help.
- If it's clearly off-topic, politely steer back to farming.
- Keep responses under 150 words.
- Use Indian context where relevant.

Respond naturally as Bhoomi AI."""

CLARIFICATION_PROMPT = """You are Bhoomi AI, a friendly farming assistant. The user's message was classified as "{intent}" but the confidence is low ({confidence:.0%}).

User said: "{message}"

Ask a brief, friendly clarification question to confirm what they need. Mention the most likely interpretation and ask if that's correct. Keep it under 50 words."""

MISSING_ENTITY_PROMPT = """You are Bhoomi AI, a friendly farming assistant. The user wants to {intent_label} but some required information is missing.

User said: "{message}"
Missing information: {missing}

Ask a brief, friendly follow-up question to get the missing details. Keep it under 50 words."""


class BhoomiEngine:
    """
    Core orchestrator for the Bhoomi AI assistant.
    Manages the full pipeline from input to structured response.
    """

    def __init__(self):
        self.sessions_collection = get_collection("bhoomi_sessions")
        self.analytics_collection = get_collection("bhoomi_analytics")

    # ── Session / Memory Management ────────────────────────────────────

    def _get_session(self, user_id: str) -> dict:
        """Retrieve or create a conversation session for the user."""
        session = self.sessions_collection.find_one({"user_id": user_id})
        cutoff = datetime.utcnow() - timedelta(hours=SESSION_TTL_HOURS)

        if session and session.get("updated_at", datetime.min) > cutoff:
            return session

        # Create new session
        new_session = {
            "user_id": user_id,
            "messages": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        self.sessions_collection.update_one(
            {"user_id": user_id},
            {"$set": new_session},
            upsert=True,
        )
        return new_session

    def _append_message(self, user_id: str, role: str, content: str):
        """Append a message to the session history, keeping last N messages."""
        self.sessions_collection.update_one(
            {"user_id": user_id},
            {
                "$push": {
                    "messages": {
                        "$each": [{"role": role, "content": content, "ts": datetime.utcnow()}],
                        "$slice": -MAX_HISTORY_MESSAGES * 2,   # keep pairs
                    }
                },
                "$set": {"updated_at": datetime.utcnow()},
            },
            upsert=True,
        )

    def _get_history(self, user_id: str) -> list[dict]:
        """Return recent conversation messages."""
        session = self._get_session(user_id)
        return session.get("messages", [])[-MAX_HISTORY_MESSAGES * 2:]

    def clear_history(self, user_id: str):
        """Clear conversation history for a user."""
        self.sessions_collection.update_one(
            {"user_id": user_id},
            {"$set": {"messages": [], "updated_at": datetime.utcnow()}},
        )

    # ── Response generation helpers ────────────────────────────────────

    def _summarise_response(self, message: str, intent: str, entities: dict, tool_result: dict) -> str:
        """Use LLM to generate a natural-language summary of the tool output."""
        # If the tool already produced a good summary, use it directly for speed
        tool_summary = tool_result.get("summary", "")
        if tool_summary and intent in ("navigation", "forum_post"):
            return tool_summary

        prompt = SUMMARISE_PROMPT.format(
            message=message,
            intent=intent,
            entities=json.dumps(entities, default=str),
            tool_result=json.dumps(tool_result, default=str)[:2000],  # truncate to avoid token overflow
        )

        try:
            result = _chat(prompt, message, model=FAST_MODEL, max_tokens=400, temperature=0.6)
            if isinstance(result, str):
                return result
            if isinstance(result, dict):
                return result.get("raw", tool_summary or "Here's what I found.")
            return tool_summary or "Here's what I found."
        except Exception as exc:
            logger.warning("Summarisation failed: %s", exc)
            return tool_summary or "I found some information for you."

    def _general_chat_response(self, message: str, history: list[dict]) -> str:
        """Generate a conversational response for general chat."""
        history_str = "\n".join(
            f"  {m.get('role', 'user').upper()}: {m.get('content', '')}" for m in history[-6:]
        ) or "  (new conversation)"

        prompt = GENERAL_CHAT_PROMPT.format(history=history_str)

        try:
            result = _chat(prompt, message, model=FAST_MODEL, max_tokens=300, temperature=0.7)
            if isinstance(result, str):
                return result
            if isinstance(result, dict):
                return result.get("raw", "I'm here to help with farming questions! What would you like to know?")
            return "I'm here to help with farming questions! What would you like to know?"
        except Exception as exc:
            logger.warning("General chat failed: %s", exc)
            return "I'm Bhoomi AI, your farming assistant. How can I help you today?"

    def _ask_clarification(self, message: str, intent: str, confidence: float) -> str:
        """Generate a clarification question when confidence is low."""
        prompt = CLARIFICATION_PROMPT.format(
            intent=intent,
            confidence=confidence,
            message=message,
        )
        try:
            result = _chat(prompt, message, model=FAST_MODEL, max_tokens=100, temperature=0.6)
            if isinstance(result, str):
                return result
            return "I'm not quite sure what you need. Could you rephrase your request?"
        except Exception:
            return "Could you please clarify your request? I want to make sure I help you correctly."

    def _ask_missing_entities(self, message: str, intent: str, missing: list[str]) -> str:
        """Generate a follow-up question for missing required entities."""
        intent_labels = {
            "crop_prediction": "predict crop yield",
            "crop_recommendation": "recommend crops",
            "disease_detection": "detect plant disease",
            "navigation": "navigate to a page",
        }
        intent_label = intent_labels.get(intent, intent.replace("_", " "))
        missing_str = ", ".join(m.replace("_", " ") for m in missing)

        prompt = MISSING_ENTITY_PROMPT.format(
            intent_label=intent_label,
            message=message,
            missing=missing_str,
        )
        try:
            result = _chat(prompt, message, model=FAST_MODEL, max_tokens=100, temperature=0.6)
            if isinstance(result, str):
                return result
            return f"To help you {intent_label}, I need to know: {missing_str}. Could you provide that?"
        except Exception:
            return f"Could you also tell me the {missing_str}?"

    # ── Analytics ──────────────────────────────────────────────────────

    def _log_analytics(self, user_id: str, message: str, intent: str,
                       confidence: float, entities: dict, response_text: str,
                       input_type: str, latency_ms: int | None = None):
        """Log interaction for analytics."""
        try:
            self.analytics_collection.insert_one({
                "user_id": user_id,
                "input_type": input_type,
                "message": message,
                "intent": intent,
                "confidence": confidence,
                "entities": entities,
                "response_preview": response_text[:200],
                "latency_ms": latency_ms,
                "timestamp": datetime.utcnow(),
            })
        except Exception as exc:
            logger.debug("Analytics logging failed: %s", exc)

    # ── Main processing pipeline ──────────────────────────────────────

    def process(self, message: str, user_id: str, input_type: str = "text") -> dict:
        """
        Main entry point. Processes a user message through the full Bhoomi AI pipeline.

        Args:
            message: User's text (transcribed if voice)
            user_id: Authenticated user ID
            input_type: "text" or "voice"

        Returns:
            Structured response dict matching the BhoomiResponse schema
        """
        start = datetime.utcnow()

        if not message or not message.strip():
            return self._build_response(
                intent="general_chat",
                confidence=1.0,
                entities={},
                response_text="I didn't catch that. Could you say something or type your question?",
                requires_followup=True,
            )

        message = message.strip()

        # 1. Get conversation history
        history = self._get_history(user_id)

        # 2. Classify intent
        classification = classify_intent(message, history)
        intent = classification.get("intent", "general_chat")
        confidence = float(classification.get("confidence", 0.5))

        # 3. Confidence check — ask for clarification if too low
        if confidence < CONFIDENCE_THRESHOLD and intent != "general_chat":
            clarification = self._ask_clarification(message, intent, confidence)
            self._append_message(user_id, "user", message)
            self._append_message(user_id, "assistant", clarification)

            elapsed = int((datetime.utcnow() - start).total_seconds() * 1000)
            self._log_analytics(user_id, message, intent, confidence, {}, clarification, input_type, elapsed)

            return self._build_response(
                intent=intent,
                confidence=confidence,
                entities={},
                response_text=clarification,
                requires_followup=True,
            )

        # 4. Extract entities
        entities = extract_entities(message, intent)

        # 5. Check required entities
        missing = get_missing_required(intent, entities)
        if missing:
            followup = self._ask_missing_entities(message, intent, missing)
            self._append_message(user_id, "user", message)
            self._append_message(user_id, "assistant", followup)

            elapsed = int((datetime.utcnow() - start).total_seconds() * 1000)
            self._log_analytics(user_id, message, intent, confidence, entities, followup, input_type, elapsed)

            return self._build_response(
                intent=intent,
                confidence=confidence,
                entities=entities,
                response_text=followup,
                requires_followup=True,
            )

        # 6. Route to tool
        if intent == "general_chat":
            response_text = self._general_chat_response(message, history)
            tool_data = {}
            navigate_to = None
        else:
            tool_result = route_to_tool(intent, entities, user_id)
            tool_data = tool_result.get("result", {})
            navigate_to = tool_result.get("navigate_to")
            requires_followup = tool_result.get("requires_followup", False)

            if requires_followup:
                response_text = tool_result.get("summary", "")
                self._append_message(user_id, "user", message)
                self._append_message(user_id, "assistant", response_text)

                elapsed = int((datetime.utcnow() - start).total_seconds() * 1000)
                self._log_analytics(user_id, message, intent, confidence, entities, response_text, input_type, elapsed)

                return self._build_response(
                    intent=intent,
                    confidence=confidence,
                    entities=entities,
                    response_text=response_text,
                    data=tool_data,
                    navigate_to=navigate_to,
                    requires_followup=True,
                )

            # 7. Summarise response
            response_text = self._summarise_response(message, intent, entities, tool_result)

        # 8. Store conversation turn
        self._append_message(user_id, "user", message)
        self._append_message(user_id, "assistant", response_text)

        elapsed = int((datetime.utcnow() - start).total_seconds() * 1000)
        self._log_analytics(user_id, message, intent, confidence, entities, response_text, input_type, elapsed)

        return self._build_response(
            intent=intent,
            confidence=confidence,
            entities=entities,
            response_text=response_text,
            data=tool_data if intent != "general_chat" else {},
            navigate_to=navigate_to if intent != "general_chat" else None,
        )

    # ── Response builder ──────────────────────────────────────────────

    @staticmethod
    def _build_response(
        intent: str,
        confidence: float,
        entities: dict,
        response_text: str,
        data: dict | None = None,
        navigate_to: str | None = None,
        requires_followup: bool = False,
    ) -> dict:
        """Build the canonical Bhoomi AI response dict."""
        return {
            "intent": intent,
            "confidence": round(confidence, 3),
            "entities": entities,
            "response_text": response_text,
            "data": data or {},
            "navigate_to": navigate_to,
            "requires_followup": requires_followup,
        }
