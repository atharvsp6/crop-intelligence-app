# app_integrated.py

from flask import Flask, request, jsonify
import sys, os
import json
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, create_access_token
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
try:
    import google.generativeai as genai
except Exception:  # pragma: no cover - optional dependency already in requirements
    genai = None

# Load environment variables FIRST
load_dotenv()

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

# Import our services (after loading env vars)
from database import get_collection
from auth import UserManager
from weather_service import WeatherService
from dashboard_service import DashboardService
from chatbot import crop_chatbot
from realtime_market_service import realtime_market_service
from websocket_market_service import websocket_market_service
multilingual_import_error = None
try:
    from multilingual_chatbot import MultilingualAgriChatbot, create_chatbot_routes as _create_ml_routes
except Exception as _ie:
    MultilingualAgriChatbot = None
    _create_ml_routes = None
    multilingual_import_error = str(_ie)
    print(f"[Multilingual Import] Failed to import multilingual_chatbot module: {_ie}")
from colab_style_predictor import colab_style_model
from disease_detector import disease_detector

# Initialize financial services and market data
try:
    from financial_analyzer import financial_analyzer
    from market_data_service import MarketDataService
    market_data_service = MarketDataService()
    FINANCIAL_SERVICES_AVAILABLE = True
    print("Financial and market data services enabled successfully")
except Exception as e:
    print(f"Financial services disabled: {e}")
    financial_analyzer = None
    market_data_service = None
    FINANCIAL_SERVICES_AVAILABLE = False
from community_forum import community_forum

# Initialize Flask app
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-here')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

# Determine allowed origins in a flexible way that supports multiple dev ports
default_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]
custom_origins = os.environ.get("ALLOWED_ORIGINS")
if custom_origins:
    allowed_origins = [origin.strip() for origin in custom_origins.split(",") if origin.strip()]
else:
    allowed_origins = default_origins

from flask_cors import CORS
# Allow both Vercel and localhost for dev, and apply to all /api/* routes
CORS(app, resources={r"/api/*": {"origins": [
    "https://crop-intelligence-app.vercel.app",
    "http://localhost:3000"
]}}, supports_credentials=True)
jwt = JWTManager(app)

# Initialize services
user_manager = UserManager()
weather_service = WeatherService()
dashboard_service = DashboardService()

# =============================================================================
# --- START: NEW CONFIGURATION ROUTE ---
# This new route will provide public API keys to the frontend.
# =============================================================================

@app.route('/api/config', methods=['GET'])
def get_public_config():
    """Provides public keys and configuration needed by the frontend."""
    try:
        return jsonify({
            'success': True,
            'mapboxToken': os.environ.get('MAPBOX_API_KEY')
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ping', methods=['GET', 'HEAD'])
def ping():
    """Health check endpoint for uptime monitoring (JSON)."""
    # For HEAD requests Flask will strip the body automatically and keep headers/status.
    return jsonify({'status': 'ok', 'timestamp': datetime.utcnow().isoformat()}), 200

@app.route('/healthz', methods=['GET', 'HEAD'])
def healthz():
    """Ultra-lightweight plain-text health check (suitable for UptimeRobot)."""
    return 'ok', 200, {"Content-Type": "text/plain; charset=utf-8"}

# =============================================================================
# --- END: NEW CONFIGURATION ROUTE ---
# =============================================================================


# =============================================================================
# MULTILINGUAL CHATBOT INTEGRATION (optional)
# =============================================================================
multilingual_chatbot = None
multilingual_chatbot_init_error = None
if MultilingualAgriChatbot:
    if GEMINI_API_KEY:
        try:
            # Allow override of model via env MULTILINGUAL_GEMINI_MODEL else fallback inside component
            override_model = os.environ.get('MULTILINGUAL_GEMINI_MODEL')
            multilingual_chatbot = MultilingualAgriChatbot(GEMINI_API_KEY)
            if override_model and hasattr(multilingual_chatbot, 'model'):
                try:
                    import google.generativeai as _genai
                    multilingual_chatbot.model = _genai.GenerativeModel(override_model)
                except Exception as _me:
                    multilingual_chatbot_init_error = f"Model override failed: {_me}"
                    print(multilingual_chatbot_init_error)
        except Exception as _e:
            multilingual_chatbot_init_error = str(_e)
            print(f"Failed to init MultilingualAgriChatbot: {_e}")


# =============================================================================
# GEMINI YIELD RECOMMENDATION SERVICE
# =============================================================================
YIELD_LANGUAGE_NAMES = {
    'en': 'English',
    'hi': 'Hindi',
    'bn': 'Bengali',
    'mr': 'Marathi',
    'ta': 'Tamil',
    'te': 'Telugu'
}

# Language instructions for Gemini AI model
YIELD_LANGUAGE_INSTRUCTIONS = {
    'en': 'English',
    'hi': 'Hindi (हिन्दी) - write everything in Devanagari script using Hindi vocabulary. Example: "फसल की उपज बढ़ाने के लिए..."',
    'bn': 'Bengali (বাংলা) - write everything in Bengali script using Bengali vocabulary. Example: "ফসলের ফলন বৃদ্ধির জন্য..."',
    'mr': 'Marathi (मराठी) - write everything in Devanagari script using Marathi vocabulary. Example: "पिकाचे उत्पादन वाढवण्यासाठी..."',
    'ta': 'Tamil (தமிழ்) - write everything in Tamil script using Tamil vocabulary. Example: "பயிர் உற்பத்தி அதிகரிக்க..."',
    'te': 'Telugu (తెలుగు) - write everything in Telugu script using Telugu vocabulary. Example: "పంట దిగుబడి పెరుగుటకు..."'
}

FALLBACK_NUTRIENT_TARGETS = {
    'nitrogen': 120,
    'phosphorus': 60,
    'potassium': 60,
}

def _safe_float(value, default: float | None = None) -> float | None:
    try:
        if value is None or value == '' or (isinstance(value, str) and value.strip() == ''):
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _coerce_gemini_response(raw_text: str, prediction: dict, original_payload: dict) -> tuple[dict, bool]:
    """Attempt to parse Gemini JSON; if it fails, reshape text while keeping Gemini origin."""
    if not raw_text or not raw_text.strip():
        raise ValueError('Empty Gemini response text.')

    try:
        parsed = _extract_json_from_text(raw_text)
        return parsed, False
    except Exception as parse_err:
        print(f"[AI Recommendations] JSON parse failed ({parse_err}); reshaping response text.")
        structured = _generate_rule_based_recommendations(prediction, original_payload)
        summary = raw_text.strip()
        structured['yield_assessment'] = summary[:420]
        structured.setdefault('notes', summary)
        return structured, True

def _generate_rule_based_recommendations(prediction: dict, original_payload: dict) -> dict:
    crop = (original_payload.get('crop_type')
            or original_payload.get('Crop')
            or 'your crop')
    crop_title = str(crop).title()
    predicted_yield = _safe_float(prediction.get('predicted_yield'), 0.0) or 0.0
    fertilizer = _safe_float(original_payload.get('fertilizer') or original_payload.get('Fertilizer'))
    pesticide = _safe_float(original_payload.get('pesticide') or original_payload.get('Pesticide'))
    area = _safe_float(original_payload.get('area') or original_payload.get('Area'))
    rainfall = _safe_float(original_payload.get('annual_rainfall') or original_payload.get('Annual_Rainfall'))
    nitrogen = _safe_float(original_payload.get('nitrogen') or original_payload.get('N_req_kg_per_ha'))
    phosphorus = _safe_float(original_payload.get('phosphorus') or original_payload.get('P_req_kg_per_ha'))
    potassium = _safe_float(original_payload.get('potassium') or original_payload.get('K_req_kg_per_ha'))
    temperature = _safe_float(original_payload.get('temperature') or original_payload.get('Temperature_C'))
    humidity = _safe_float(original_payload.get('humidity') or original_payload.get('Humidity_%'))
    ph = _safe_float(original_payload.get('ph') or original_payload.get('pH'))

    def _npk_gap(name: str, actual: float | None) -> str:
        target = FALLBACK_NUTRIENT_TARGETS[name]
        if actual is None:
            return f"monitor {name[0].upper()} supply"
        if actual < target * 0.85:
            return f"increase {name[0].upper()} inputs"
        if actual > target * 1.2:
            return f"trim {name[0].upper()} usage"
        return f"keep {name[0].upper()} steady"

    fertilizer_note = "balance NPK and organic matter" if fertilizer is None else (
        "split fertilizer into 2-3 doses" if fertilizer > 0 else "plan basal fertilization"
    )
    irrigation_hint = []
    if rainfall is not None:
        if rainfall < 800:
            irrigation_hint.append("schedule drip/soaker every 5-7 days")
        elif rainfall > 1300:
            irrigation_hint.append("drain excess water to avoid root stress")
    if humidity is not None and humidity > 80:
        irrigation_hint.append("monitor fungal pressure; prefer morning irrigation")
    if not irrigation_hint:
        irrigation_hint.append("align irrigation with crop growth stages")

    planting_hint = []
    if temperature is not None:
        if temperature < 20:
            planting_hint.append("warm the seed bed or delay sowing")
        elif temperature > 34:
            planting_hint.append("use heat-tolerant variety and mulching")
    planting_hint.append("maintain recommended row spacing and weed early")

    improvement_hint = []
    if predicted_yield:
        improvement_hint.append(f"boost yield ~10% by optimising NPK and irrigation")
    if pesticide is not None and pesticide > 0:
        improvement_hint.append("rotate pest control modes; scout weekly")
    improvement_hint.append("invest in soil testing and organic amendments")

    cost_benefit_hint = {
        "roi_estimate": "target 1.4x ROI by improving input efficiency",
        "payback_period": "expect payoff within 1 season if inputs optimised",
        "risk_factors": "watch rainfall swings, pest outbreaks, fertiliser prices"
    }

    return {
        "yield_assessment": f"{crop_title} yield around {predicted_yield:.1f} t/ha; focus on balanced inputs and timely field care.",
        "fertilizer_recommendations": {
            "optimal_npk": f"{_npk_gap('nitrogen', nitrogen)}; { _npk_gap('phosphorus', phosphorus)}; { _npk_gap('potassium', potassium)}",
            "application_schedule": fertilizer_note,
            "organic_options": "blend FYM/compost with micronutrient-rich biofertilisers",
            "micronutrients": "apply Zn & B foliar spray at tillering/flowering"
        },
        "irrigation_recommendations": {
            "frequency": irrigation_hint[0],
            "critical_stages": "prioritise flowering & grain filling moisture",
            "methods": "prefer drip or furrow to save water",
            "water_management": "mulch surface to reduce evaporation and conserve moisture"
        },
        "planting_recommendations": {
            "optimal_dates": "match sowing with regional seasonal onset",
            "variety_selection": "pick locally recommended, disease-tolerant cultivars",
            "spacing": "keep rows uniform; thin to avoid competition",
            "soil_prep": "deep plough; incorporate organic matter and level beds"
        },
        "improvement_potential": {
            "expected_increase": improvement_hint[0] if improvement_hint else "optimise inputs for modest gains",
            "timeline": "start with current season interventions",
            "priority_actions": "soil test, split fertiliser doses, tighten irrigation schedule",
            "investment_needed": "budget for micronutrients, mulching, soil health inputs"
        },
        "cost_benefit": cost_benefit_hint
    }

yield_recommendation_model = None
yield_recommendation_error = None

if GEMINI_API_KEY and genai:
    try:
        # Allow dedicated override to keep chatbot model independent if desired
        recommendation_model_name = (
            os.environ.get('YIELD_GEMINI_MODEL')
            or os.environ.get('MULTILINGUAL_GEMINI_MODEL')
            or 'gemini-2.0-flash-exp'
        )
        genai.configure(api_key=GEMINI_API_KEY)
        yield_recommendation_model = genai.GenerativeModel(recommendation_model_name)
    except Exception as _rec_err:
        yield_recommendation_error = f"Failed to initialize Gemini recommendation model: {_rec_err}"
        print(yield_recommendation_error)
elif not GEMINI_API_KEY:
    yield_recommendation_error = 'GEMINI_API_KEY missing for yield recommendations.'
elif not genai:
    yield_recommendation_error = 'google-generativeai library not available.'


# =============================================================================
# GEMINI YIELD VALIDATION SERVICE
# =============================================================================
def get_gemini_yield_prediction(crop_data: dict) -> dict:
    """
    Get yield prediction from Gemini AI for cross-validation
    """
    if not yield_recommendation_model:
        return None
    
    try:
        # Extract relevant data
        crop = crop_data.get('Crop', 'unknown')
        state = crop_data.get('State Name', 'India')
        season = crop_data.get('Season', 'kharif')
        area = crop_data.get('Area', 1.0)
        rainfall = crop_data.get('Annual_Rainfall', 800)
        fertilizer = crop_data.get('Fertilizer', 50)
        pesticide = crop_data.get('Pesticide', 10)
        temperature = crop_data.get('Temperature_C', 25)
        humidity = crop_data.get('Humidity_%', 65)
        ph = crop_data.get('pH', 6.5)
        
        # Create a detailed prompt for yield prediction
        prompt = f"""
You are an expert agricultural scientist specializing in crop yield prediction for Indian agriculture.

Based on the following crop and environmental data, predict the total yield in metric tons:

Crop Information:
- Crop: {crop}
- State: {state}
- Season: {season}
- Area: {area} hectares

Environmental Conditions:
- Annual Rainfall: {rainfall} mm
- Average Temperature: {temperature}°C
- Humidity: {humidity}%
- Soil pH: {ph}

Agricultural Inputs:
- Fertilizer: {fertilizer} kg/hectare
- Pesticide: {pesticide} kg/hectare

Instructions:
1. Consider the specific crop's typical yield for the given state and season
2. Factor in environmental conditions (rainfall, temperature, humidity, pH)
3. Account for fertilizer and pesticide usage effects
4. Provide ONLY a numerical yield prediction in metric tons
5. Be realistic based on Indian agricultural standards

Response format: Just return the number (e.g., "3.45")
"""

        response = yield_recommendation_model.generate_content(prompt)
        
        if response and response.text:
            # Extract numerical value from response
            yield_text = response.text.strip()
            # Remove any non-numeric characters except decimal point
            import re
            yield_match = re.search(r'(\d+(?:\.\d+)?)', yield_text)
            
            if yield_match:
                gemini_yield = float(yield_match.group(1))
                return {
                    'success': True,
                    'predicted_yield': gemini_yield,
                    'method': 'gemini_ai',
                    'raw_response': yield_text
                }
        
        return None
        
    except Exception as e:
        # Log error but don't expose to frontend
        print(f"[Gemini Validation] Error: {e}")
        return None


# =============================================================================
# AUTHENTICATION ROUTES
# =============================================================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Register user
        result = user_manager.register_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            full_name=data.get('full_name', ''),
            location=data.get('location', ''),
            farm_size=data.get('farm_size', ''),
            primary_crops=data.get('primary_crops', [])
        )
        
        if result['success']:
            # Create access token
            access_token = create_access_token(identity=str(result['user_id']))
            
            return jsonify({
                'success': True,
                'message': 'Registration successful',
                'token': access_token,
                'user': result['user']
            }), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        # Authenticate user
        result = user_manager.login_user(data['email'], data['password'])
        
        if result['success']:
            # Create access token
            access_token = create_access_token(identity=str(result['user']['id']))
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'token': access_token,
                'user': result['user']
            }), 200
        else:
            return jsonify(result), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/verify', methods=['GET'])
@jwt_required()
def verify_token():
    try:
        user_id = get_jwt_identity()
        result = user_manager.get_user_profile(user_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'user': result['user']
            }), 200
        else:
            return jsonify({'success': False, 'message': 'User not found'}), 404
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        result = user_manager.get_user_profile(user_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        result = user_manager.update_user_profile(user_id, data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =============================================================================
# DASHBOARD ROUTES
# =============================================================================

@app.route('/api/dashboard/stats', methods=['GET'])
@jwt_required(optional=True)
def get_dashboard_stats():
    try:
        user_id = get_jwt_identity()
        from enhanced_dashboard_service import dashboard_service as enhanced_service
        stats = enhanced_service.get_real_time_stats(user_id)
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/yield-trends', methods=['GET'])
@jwt_required(optional=True)
def get_yield_trends():
    try:
        user_id = get_jwt_identity()
        from enhanced_dashboard_service import dashboard_service as enhanced_service
        trends = enhanced_service.get_yield_trends(user_id)
        return jsonify(trends)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/soil-health', methods=['GET'])
@jwt_required(optional=True)
def get_soil_health():
    try:
        user_id = get_jwt_identity()
        from enhanced_dashboard_service import dashboard_service as enhanced_service
        signals = enhanced_service.get_soil_health_signals(user_id)
        return jsonify(signals)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/crops', methods=['GET'])
def get_crop_statistics():
    try:
        stats = dashboard_service.get_crop_statistics()
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/forum', methods=['GET'])
def get_forum_statistics():
    try:
        stats = dashboard_service.get_forum_statistics()
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/activity', methods=['GET'])
@jwt_required()
def get_recent_activity():
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 10, type=int)
        
        activity = dashboard_service.get_recent_activity(user_id, limit)
        return jsonify(activity)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =============================================================================
# WEATHER ROUTES
# =============================================================================

@app.route('/api/weather/current', methods=['GET'])
def get_current_weather():
    try:
        latitude = request.args.get('lat', type=float)
        longitude = request.args.get('lon', type=float)
        city = request.args.get('city')
        
        if not city and (not latitude or not longitude):
            return jsonify({'error': 'Either city name or coordinates (lat, lon) required'}), 400
        
        if city:
            # Get coordinates for city first, then get weather
            coords_result = weather_service.get_coordinates_by_city(city)
            if coords_result['success']:
                coords = coords_result['coordinates']
                weather = weather_service.get_current_weather(coords['lat'], coords['lon'], coords['name'])
            else:
                return jsonify(coords_result), 400
        else:
            weather = weather_service.get_current_weather(latitude, longitude)
            
        return jsonify(weather)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/weather/forecast', methods=['GET'])
def get_weather_forecast():
    try:
        latitude = request.args.get('lat', type=float)
        longitude = request.args.get('lon', type=float)
        city = request.args.get('city')
        days = request.args.get('days', 5, type=int)
        
        if not city and (not latitude or not longitude):
            return jsonify({'error': 'Either city name or coordinates (lat, lon) required'}), 400
        
        if city:
            # Get coordinates for city first, then get forecast
            coords_result = weather_service.get_coordinates_by_city(city)
            if coords_result['success']:
                coords = coords_result['coordinates']
                forecast = weather_service.get_weather_forecast(coords['lat'], coords['lon'], coords['name'])
            else:
                return jsonify(coords_result), 400
        else:
            forecast = weather_service.get_weather_forecast(latitude, longitude)
            
        return jsonify(forecast)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/weather/alerts', methods=['GET'])
def get_weather_alerts():
    try:
        latitude = request.args.get('lat', type=float)
        longitude = request.args.get('lon', type=float)
        city = request.args.get('city')
        
        if not city and (not latitude or not longitude):
            return jsonify({'error': 'Either city name or coordinates (lat, lon) required'}), 400
        
        if city:
            # Get coordinates for city first, then get alerts
            coords_result = weather_service.get_coordinates_by_city(city)
            if coords_result['success']:
                coords = coords_result['coordinates']
                alerts = weather_service.get_agricultural_alerts(coords['lat'], coords['lon'])
            else:
                return jsonify(coords_result), 400
        else:
            alerts = weather_service.get_agricultural_alerts(latitude, longitude)
            
        return jsonify(alerts)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =============================================================================
# CHATBOT ROUTES
# =============================================================================

@app.route('/api/chatbot/chat', methods=['POST'])
@jwt_required()
def chat_with_bot():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('message'):
            return jsonify({'error': 'Message is required'}), 400

        raw_context = data.get('context') if isinstance(data.get('context'), dict) else None
        if raw_context:
            summary_lines = raw_context.get('summaryLines') or []
            recommendation_highlights = raw_context.get('recommendationHighlights') or []
            context_payload = {
                'summaryLines': [str(line) for line in summary_lines if str(line).strip()],
                'recommendationHighlights': [
                    str(item) for item in recommendation_highlights if str(item).strip()
                ],
            }
        else:
            context_payload = None

        response = crop_chatbot.chat(
            data['message'],
            user_id,
            context=context_payload,
            language_hint=data.get('languageHint'),
            prediction_ready=bool(data.get('predictionReady')),
        )
        
        # Update user activity
        user_manager.update_user_activity(user_id, 'chatbot_interaction')
        
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chatbot/recommendations', methods=['POST'])
@jwt_required()
def get_crop_recommendations():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        crop_type = data.get('crop_type')
        if not crop_type:
            return jsonify({'error': 'crop_type is required'}), 400
        
        response = crop_chatbot.get_crop_recommendations(
            crop_type=crop_type,
            location=data.get('location'),
            season=data.get('season'),
            user_id=user_id
        )
        
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chatbot/conversation-summary', methods=['GET'])
@jwt_required()
def get_conversation_summary():
    try:
        user_id = get_jwt_identity()
        response = crop_chatbot.get_conversation_summary(user_id)
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chatbot/clear-history', methods=['POST'])
@jwt_required()
def clear_conversation_history():
    try:
        user_id = get_jwt_identity()
        response = crop_chatbot.clear_history(user_id)
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =============================================================================
# MULTILINGUAL CHATBOT ROUTES (prefixed with /api/mchatbot to avoid conflicts)
# =============================================================================
if multilingual_chatbot and _create_ml_routes:
    # Manually define to control auth & integration instead of using helper
    @app.route('/api/mchatbot', methods=['POST','OPTIONS'])
    def mchatbot_general():
        try:
            if request.method == 'OPTIONS':
                return ('',204)
            data = request.get_json() or {}
            query = data.get('query','')
            user_lang = data.get('language','en')
            if not query:
                return jsonify({'error':'Query is required'}), 400
            # Language auto-detect if user sets auto
            if user_lang == 'auto':
                user_lang = multilingual_chatbot.detect_language(query)
            resp = multilingual_chatbot.generate_response(query, user_lang)
            return jsonify({'success': True, **resp})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/mchatbot/crop-advice', methods=['POST','OPTIONS'])
    def mchatbot_crop_advice():
        try:
            if request.method == 'OPTIONS':
                return ('',204)
            data = request.get_json() or {}
            crop_name = data.get('crop','')
            qtype = data.get('type','general')
            user_lang = data.get('language','en')
            if not crop_name:
                return jsonify({'error':'Crop name is required'}), 400
            resp = multilingual_chatbot.get_crop_specific_advice(crop_name, qtype, user_lang)
            return jsonify({'success': True, **resp})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/mchatbot/languages', methods=['GET','OPTIONS'])
    def mchatbot_languages():
        try:
            if request.method == 'OPTIONS':
                return ('',204)
            return jsonify({'supported_languages': multilingual_chatbot.supported_languages, 'agricultural_terms': multilingual_chatbot.agri_terms})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/mchatbot/translate', methods=['POST','OPTIONS'])
    def mchatbot_translate():
        try:
            if request.method == 'OPTIONS':
                return ('',204)
            data = request.get_json() or {}
            text = data.get('text','')
            target_lang = data.get('target_language','en')
            source_lang = data.get('source_language','auto')
            if not text:
                return jsonify({'error':'Text is required'}), 400
            translated = multilingual_chatbot.translate_text(text, target_lang, source_lang)
            detected = multilingual_chatbot.detect_language(text) if source_lang == 'auto' else source_lang
            return jsonify({'original_text': text, 'translated_text': translated, 'source_language': detected, 'target_language': target_lang})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/mchatbot/integrated-advice', methods=['POST','OPTIONS'])
    def mchatbot_integrated_advice():
        try:
            if request.method == 'OPTIONS':
                return ('',204)
            data = request.get_json() or {}
            crop = data.get('crop') or data.get('crop_type','')
            state = data.get('state','')
            user_lang = data.get('language','en')
            # Provide basic yield prediction if extended fields present
            prediction = None
            try:
                if crop and state and 'annual_rainfall' in data:
                    # Minimal mapping to predictor schema
                    pred_payload = {
                        'crop_type': crop,
                        'season': data.get('season','Kharif'),
                        'state': state,
                        'area': float(data.get('area', 1000)),
                        'annual_rainfall': float(data.get('annual_rainfall', 800)),
                        'fertilizer_input': float(data.get('fertilizer_input', 50000)),
                        'pesticide_input': float(data.get('pesticide_input', 1000))
                    }
                    prediction = colab_style_model.predict(_map_frontend_to_colab(pred_payload))
            except Exception as _pe:
                prediction = {'success': False, 'error': f'Prediction error: {_pe}'}
            advice_query = f"I am growing {crop} in {state}. Provide practical advice to improve yield." if crop else data.get('query','Agricultural advice please')
            advice_lang = user_lang if user_lang != 'auto' else multilingual_chatbot.detect_language(advice_query)
            advice = multilingual_chatbot.generate_response(advice_query, advice_lang)
            return jsonify({'success': True, 'advice': advice, 'prediction': prediction, 'language': advice_lang})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
else:
    @app.route('/api/mchatbot', methods=['POST','OPTIONS'])
    def mchatbot_disabled():
        if request.method == 'OPTIONS':
            return ('',204)
        return jsonify({'success': False, 'error': 'Multilingual chatbot disabled (missing GEMINI_API_KEY or dependency).', 'init_error': multilingual_chatbot_init_error}), 503

# Unified status route (available regardless of initialization success)
@app.route('/api/mchatbot/status', methods=['GET'])
def mchatbot_status():
    return jsonify({
        'initialized': bool(multilingual_chatbot),
        'init_error': multilingual_chatbot_init_error,
        'import_error': multilingual_import_error,
        'requires_env': 'GEMINI_API_KEY',
        'override_model_env': 'MULTILINGUAL_GEMINI_MODEL',
        'model_override_used': os.environ.get('MULTILINGUAL_GEMINI_MODEL') is not None,
        'model_name': getattr(getattr(multilingual_chatbot, 'model', None), 'model_name', None)
    })

# Removed earlier duplicate model-info endpoint (consolidated later)

@app.route('/api/predict-yield/explain', methods=['POST'])
def explain_yield_prediction():
    """Return SHAP explanation for a prediction - DISABLED.

    This feature is currently disabled as the new crop predictor doesn't include SHAP.
    """
    return jsonify({'success': False, 'error': 'SHAP explanation not available in current model'}), 400
    # try:
    #     data = request.get_json() or {}
    #     if not data.get('crop_type'):
    #         data['crop_type'] = 'wheat'
    #     return jsonify(result), (200 if result.get('success') else 400)
    # except Exception as e:
    #     return jsonify({'success': False, 'error': str(e)}), 500

# =============================================================================
# EXISTING ROUTES (UPDATED WITH AUTH)
# =============================================================================

@app.route('/api/predict-crop', methods=['POST'])
def predict_crop_yield():
    """Predict crop yield using Colab-style model (accepts frontend keys)."""
    data = request.get_json() or {}
    payload = _map_frontend_to_colab(data)
    result = colab_style_model.predict(payload)

    language = _normalize_language_code(data.get('language'))
    merged_payload = {**payload, **data}

    if result.get('success'):
        fallback_recommendations = None
        if yield_recommendation_model:
            try:
                recommendations, raw_text, source_tag = _generate_yield_recommendations(result, merged_payload, language)
                result['ai_recommendations'] = recommendations
                result['ai_recommendations_language'] = language
                result['ai_recommendations_source'] = source_tag
                result['ai_recommendations_raw'] = raw_text
            except Exception as rec_err:
                result['ai_recommendations_error'] = str(rec_err)
                result['ai_recommendations_language'] = language
                print(f"[AI Recommendations] Gemini generation failed, using fallback: {rec_err}")
                try:
                    fallback_recommendations = _generate_rule_based_recommendations(result, merged_payload)
                except Exception as fallback_err:
                    print(f"[AI Recommendations] Fallback generation error: {fallback_err}")
        else:
            if yield_recommendation_error:
                result['ai_recommendations_error'] = yield_recommendation_error
            try:
                fallback_recommendations = _generate_rule_based_recommendations(result, merged_payload)
            except Exception as fallback_err:
                print(f"[AI Recommendations] Fallback generation error: {fallback_err}")

        if not result.get('ai_recommendations') and fallback_recommendations:
            result['ai_recommendations'] = fallback_recommendations
            result['ai_recommendations_language'] = 'en'
            result['ai_recommendations_source'] = 'rule_based'
    else:
        result['ai_recommendations_error'] = result.get('error') or 'Prediction failed; recommendations skipped.'

    result['selected_language'] = language
    return jsonify(result)

# Backward compatibility alias and public endpoint
@app.route('/api/predict-yield', methods=['POST','OPTIONS'])
def predict_crop_yield_public():
    if request.method == 'OPTIONS':
        return ('',204)
    data = request.get_json() or {}
    payload = _map_frontend_to_colab(data)
    
    # Get ML model prediction
    ml_result = colab_style_model.predict(payload)
    
    # Get Gemini prediction for validation
    gemini_result = get_gemini_yield_prediction(payload)
    
    # Validation logic: compare predictions and decide which to use
    final_result = ml_result.copy()  # Start with ML result
    
    if ml_result.get('success') and gemini_result and gemini_result.get('success'):
        ml_yield = ml_result.get('predicted_yield', 0)
        gemini_yield = gemini_result.get('predicted_yield', 0)
        
        # Calculate percentage difference
        if ml_yield > 0:
            percentage_diff = abs(ml_yield - gemini_yield) / ml_yield * 100
            
            # Log for debugging (backend only)
            print(f"[Prediction Validation] ML: {ml_yield}, Gemini: {gemini_yield}, Diff: {percentage_diff:.1f}%")
            
            # If difference is significant (>25%), use Gemini's prediction
            if percentage_diff > 25:
                print(f"[Prediction Validation] Large difference detected, using Gemini prediction")
                final_result['predicted_yield'] = gemini_yield
                final_result['prediction_source'] = 'gemini_ai'
                final_result['validation_applied'] = True
                final_result['original_ml_prediction'] = ml_yield
                final_result['confidence'] = 'gemini_validated'
            else:
                print(f"[Prediction Validation] Predictions aligned, using ML prediction")
                final_result['prediction_source'] = 'machine_learning'
                final_result['validation_applied'] = True
                final_result['gemini_confirmation'] = gemini_yield
        else:
            # If ML prediction is invalid, use Gemini
            print(f"[Prediction Validation] ML prediction invalid, using Gemini")
            final_result['predicted_yield'] = gemini_yield
            final_result['prediction_source'] = 'gemini_ai'
            final_result['validation_applied'] = True
            
    elif not ml_result.get('success') and gemini_result and gemini_result.get('success'):
        # If ML failed but Gemini succeeded, use Gemini
        print(f"[Prediction Validation] ML failed, using Gemini as primary")
        final_result = gemini_result.copy()
        final_result['prediction_source'] = 'gemini_ai'
        final_result['fallback_reason'] = 'ml_model_failed'
        
    elif ml_result.get('success'):
        # ML succeeded, Gemini failed/unavailable
        final_result['prediction_source'] = 'machine_learning'
        final_result['validation_applied'] = False
        if ml_result.get('method') == 'statistical_fallback':
            print(f"[Prediction Validation] Using statistical fallback")
        
    # Use the final result for language processing
    result = final_result

    language = _normalize_language_code(data.get('language') or request.args.get('language'))
    print(f"[Predict Endpoint] Raw language from request: {data.get('language')}")
    print(f"[Predict Endpoint] Normalized language: {language}")
    merged_payload = {**payload, **data}

    fallback_recommendations = None

    if result.get('success'):
        if yield_recommendation_model:
            try:
                recommendations, _, source_tag = _generate_yield_recommendations(result, merged_payload, language)
                result['ai_recommendations'] = recommendations
                result['ai_recommendations_language'] = language
                result['ai_recommendations_source'] = source_tag
            except Exception as rec_err:
                result['ai_recommendations_error'] = str(rec_err)
                result['ai_recommendations_language'] = language
                print(f"[AI Recommendations] Gemini generation failed, using fallback: {rec_err}")
                try:
                    fallback_recommendations = _generate_rule_based_recommendations(result, merged_payload)
                except Exception as fallback_err:
                    print(f"[AI Recommendations] Fallback generation error: {fallback_err}")
        elif yield_recommendation_error:
            result['ai_recommendations_error'] = yield_recommendation_error
            result['ai_recommendations_language'] = language
    else:
        result['ai_recommendations_error'] = result.get('error') or 'Prediction failed; recommendations skipped.'

    result['selected_language'] = language
    print(f"[Prediction Response] Final prediction_source: {result.get('prediction_source')}")
    print(f"[Prediction Response] Final predicted_yield: {result.get('predicted_yield')}")
    return jsonify(result)

# Training endpoint for the new model
@app.route('/api/train-model', methods=['POST'])
def train_colab_model():
    cap_param = (request.args.get('cap_target','').lower())
    if cap_param in ('false','0','no'):
        colab_style_model.CAP_TARGET = False
    elif cap_param in ('true','1','yes'):
        colab_style_model.CAP_TARGET = True
    ok = colab_style_model.train()
    meta = colab_style_model.get_meta()
    return jsonify({'success': ok, 'meta': meta, 'cap_target': colab_style_model.CAP_TARGET})

# Public deployment setup endpoint (no auth required for initial setup)
@app.route('/api/setup-model', methods=['GET', 'POST'])
def setup_deployment_model():
    """Public endpoint to initialize model for first deployment"""
    try:
        if colab_style_model.is_trained:
            return jsonify({
                'success': True,
                'message': 'Model already trained and ready',
                'status': 'ready',
                'meta': colab_style_model.get_meta()
            })
        
        print("[Setup] Training model for deployment...")
        ok = colab_style_model.train()
        
        if ok:
            return jsonify({
                'success': True,
                'message': 'Model trained successfully for deployment',
                'status': 'trained',
                'meta': colab_style_model.get_meta()
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Model training failed - using statistical fallback',
                'status': 'fallback_mode'
            })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Setup failed - using statistical fallback',
            'status': 'fallback_mode'
        }), 500

# -----------------------------------------------------------------------------
# Colab-style model endpoints (exact pipeline mirror) - prefixed to avoid clash
# -----------------------------------------------------------------------------
# Keep backward compatibility raw endpoints if someone wants to send notebook-native keys
@app.route('/api/colab/predict', methods=['POST'])
def colab_predict_raw():
    data = request.get_json() or {}
    return jsonify(colab_style_model.predict(data))

@app.route('/api/colab/train', methods=['POST'])
def colab_train_raw():
    ok = colab_style_model.train()
    return jsonify({'success': ok})

@app.route('/api/model-info/yield', methods=['GET'])
def model_info_yield():
    return jsonify({'success': True, 'meta': colab_style_model.get_meta()})

@app.route('/api/model-info/yield/debug-aligned', methods=['POST'])
def model_info_yield_aligned():
    data = request.get_json() or {}
    if 'Crop' not in data and 'crop_type' in data:
        data = _map_frontend_to_colab(data)
    return jsonify(colab_style_model.debug_aligned_features(data))


def _normalize_language_code(code: str | None) -> str:
    if not code:
        return 'en'
    normalized = code.split('-')[0].lower()
    return normalized if normalized in YIELD_LANGUAGE_NAMES else 'en'


def _current_conditions_from_payload(payload: dict) -> dict:
    def _first(*keys):
        for key in keys:
            if key in payload and payload[key] not in (None, ''):
                return payload[key]
        return None

    return {
        'area': _first('area', 'Area'),
        'rainfall': _first('annual_rainfall', 'Annual_Rainfall', 'rainfall', 'Rainfall_mm'),
        'fertilizer': _first('fertilizer', 'Fertilizer'),
        'pesticide': _first('pesticide', 'Pesticide'),
        'season': _first('season', 'Season'),
        'state': _first('state', 'State Name'),
        'nitrogen': _first('nitrogen', 'N_req_kg_per_ha'),
        'phosphorus': _first('phosphorus', 'P_req_kg_per_ha'),
        'potassium': _first('potassium', 'K_req_kg_per_ha')
    }


def _conditions_text(conditions: dict) -> str:
    def _format_value(value, suffix=''):
        if value in (None, ''):
            return 'Not specified'
        try:
            numeric = float(value)
            if suffix:
                return f"{numeric:.2f} {suffix}"
            return f"{numeric:.2f}"
        except (ValueError, TypeError):
            return str(value)

    return "\n".join([
        f"- Area: {_format_value(conditions.get('area'), 'hectares')}",
        f"- Annual Rainfall: {_format_value(conditions.get('rainfall'), 'mm')}",
        f"- Fertilizer: {_format_value(conditions.get('fertilizer'), 'kg/hectare')}",
        f"- Pesticide: {_format_value(conditions.get('pesticide'), 'kg/hectare')}",
        f"- Season: {_format_value(conditions.get('season'))}",
        f"- State: {_format_value(conditions.get('state'))}"
    ])


def _extract_json_from_text(text: str) -> dict:
    if not text:
        raise ValueError('Empty response from Gemini.')
    start = text.find('{')
    end = text.rfind('}')
    if start == -1 or end == -1 or end <= start:
        raise ValueError('No JSON object found in Gemini response.')
    snippet = text[start:end+1]
    return json.loads(snippet)


def _generate_yield_recommendations(prediction: dict, original_payload: dict, language_code: str) -> tuple[dict, str, str]:
    if not yield_recommendation_model:
        raise RuntimeError(yield_recommendation_error or 'Gemini recommendation model unavailable.')

    language_code = _normalize_language_code(language_code)
    language_name = YIELD_LANGUAGE_NAMES.get(language_code, 'English')
    language_instruction = YIELD_LANGUAGE_INSTRUCTIONS.get(language_code, 'English')
    
    # Debug logging to track language selection
    print(f"[AI Recommendations] Input language_code: {language_code}")
    print(f"[AI Recommendations] Language name: {language_name}")
    print(f"[AI Recommendations] Language instruction: {language_instruction}")

    crop = original_payload.get('crop_type') or original_payload.get('Crop') or 'Crop'
    predicted_yield = prediction.get('predicted_yield') or 0.0
    yield_category = prediction.get('yield_category_label') or prediction.get('yield_category') or 'Average'
    target_mean = prediction.get('target_mean') or predicted_yield
    confidence_dict = prediction.get('confidence_interval') or {}
    confidence_lower = confidence_dict.get('lower', max(0.0, predicted_yield * 0.9))
    confidence_upper = confidence_dict.get('upper', predicted_yield * 1.1)

    conditions = _current_conditions_from_payload(original_payload)
    conditions_text = _conditions_text(conditions)

    prompt = f"""
You are an expert agricultural scientist specializing in crop yield optimization. Analyze the following crop prediction and provide specific, actionable recommendations.

STYLE & LENGTH REQUIREMENTS:
- Output MUST be valid JSON only (no markdown) using the provided schema and English keys.
- All value text MUST be written in {language_instruction}.
- Keep each field concise: MAX 180 characters per field value (split ideas across keys rather than long sentences).
- Prefer short bullet-style phrases separated by semicolons; avoid long paragraphs.
- No introductory or closing sentences outside the JSON.
- If data is insufficient, respond with a short actionable placeholder in the specified language.

CROP ANALYSIS INPUT:
- Crop: {crop}
- Predicted Yield: {predicted_yield:.2f} tons/hectare
- Yield Category: {yield_category} (compared to average {target_mean:.2f})
- Confidence Range: {confidence_lower:.2f} - {confidence_upper:.2f} tons/hectare

CURRENT CONDITIONS:
{conditions_text}

Please provide comprehensive recommendations in the following priority areas:

1. FERTILIZER MANAGEMENT (Primary Focus):
- Optimal NPK ratios for {crop}
- Application timing and split doses
- Organic vs chemical fertilizer recommendations
- Micronutrient requirements
- Cost-effective fertilizer schedule

2. IRRIGATION PRACTICES (Secondary Focus):
- Optimal irrigation frequency and amount
- Critical growth stages requiring water
- Water-efficient irrigation methods
- Moisture management strategies
- Drought mitigation techniques

3. PLANTING PRACTICES (Tertiary Focus):
- Best planting dates for the stated season
- Optimal seed variety recommendations
- Plant spacing and density
- Soil preparation techniques
- Crop rotation suggestions

4. YIELD IMPROVEMENT POTENTIAL:
- Expected yield increase with optimizations
- Timeline for implementing changes
- Priority actions for immediate impact
- Long-term sustainability practices

Also provide a cost-benefit summary, including ROI estimate, payback period, and potential risks. Keep estimates very short.

Format your response strictly as JSON with these exact keys:
{{
    "yield_assessment": "...",
    "fertilizer_recommendations": {{
        "optimal_npk": "...",
        "application_schedule": "...",
        "organic_options": "...",
        "micronutrients": "..."
    }},
    "irrigation_recommendations": {{
        "frequency": "...",
        "critical_stages": "...",
        "methods": "...",
        "water_management": "..."
    }},
    "planting_recommendations": {{
        "optimal_dates": "...",
        "variety_selection": "...",
        "spacing": "...",
        "soil_prep": "..."
    }},
    "improvement_potential": {{
        "expected_increase": "...",
        "timeline": "...",
        "priority_actions": "...",
        "investment_needed": "..."
    }},
    "cost_benefit": {{
        "roi_estimate": "...",
        "payback_period": "...",
        "risk_factors": "..."
    }}
}}

Return ONLY valid JSON with no extra text. Ensure every value is in the specified language: {language_instruction}. Avoid exceeding length guidance.
"""

    response = yield_recommendation_model.generate_content(
        prompt,
        generation_config={"response_mime_type": "application/json"}
    )

    raw_text = ''
    if hasattr(response, 'text') and response.text:
        raw_text = response.text.strip()
    elif getattr(response, 'candidates', None):
        # Some SDK versions expose text via candidates/parts objects
        parts: list[str] = []
        for candidate in response.candidates:
            content = getattr(candidate, 'content', None)
            if content and getattr(content, 'parts', None):
                for part in content.parts:
                    content_text = getattr(part, 'text', None)
                    if content_text:
                        parts.append(content_text)
        raw_text = '\n'.join(parts).strip()

    parsed, fallback_used = _coerce_gemini_response(raw_text, prediction, original_payload)
    source_tag = 'gemini_fallback' if fallback_used else 'gemini'
    return parsed, raw_text, source_tag
def _map_frontend_to_colab(d: dict) -> dict:
    mapping = {
        'crop_type': 'Crop',
        'state': 'State Name',
        'season': 'Season',
        'year': 'Year',
        'area': 'Area',
        'annual_rainfall': 'Annual_Rainfall',
        'fertilizer': 'Fertilizer',
        'pesticide': 'Pesticide',
        'temperature': 'Temperature_C',
        'humidity': 'Humidity_%',
        'ph': 'pH',
        'rainfall': 'Rainfall_mm',
        'nitrogen': 'N_req_kg_per_ha',
        'phosphorus': 'P_req_kg_per_ha',
        'potassium': 'K_req_kg_per_ha',
        'wind_speed': 'Wind_Speed_m_s',
        'solar_radiation': 'Solar_Radiation_MJ_m2_day'
    }
    out = {}
    for fk, bk in mapping.items():
        if fk in d:
            out[bk] = d[fk]
    # Provide defaults mirroring earlier behavior if fields are missing
    defaults = {
        'Crop': 'rice',
        'State Name': 'andhra pradesh',
        'Season': 'kharif',
        'Year': 2024,
        'Area': 1000.0,
        'Annual_Rainfall': 1200.0,
        'Fertilizer': 5000000.0,
        'Pesticide': 10000.0,
        'Temperature_C': 25.0,
        'Humidity_%': 70.0,
        'pH': 6.5,
        'Rainfall_mm': 1000.0,
        'N_req_kg_per_ha': 80.0,
        'P_req_kg_per_ha': 40.0,
        'K_req_kg_per_ha': 60.0,
        'Wind_Speed_m_s': 3.0,
        'Solar_Radiation_MJ_m2_day': 18.0
    }
    for k,v in defaults.items():
        out.setdefault(k,v)
    return out

# =============================================================================
# MODEL INFO ENDPOINTS
# =============================================================================
# (legacy stray block removed during integration cleanup)

@app.route('/api/detect-disease', methods=['POST'])
@jwt_required()
def detect_plant_disease():
    """Disease detection endpoint - Enhanced AI model for plant disease classification."""
    try:
        user_id = get_jwt_identity()
        image_data = None
        
        if 'image' in request.files:
            image_data = request.files['image'].read()
        else:
            data = request.get_json(silent=True) or {}
            image_data = data.get('image')
        
        if not image_data:
            return jsonify({'error': 'Image is required (file upload or base64 in JSON).'}), 400
        
        detection = disease_detector.predict_disease(image_data)
        if detection.get('success'):
            user_manager.update_user_activity(user_id, 'disease_detection')
        
        status_code = 200 if detection.get('success') else 400
        return jsonify(detection), status_code
    except Exception as e:
        return jsonify({'error': f'Disease detection failed: {str(e)}'}), 500

@app.route('/api/financial/roi', methods=['POST'])
@jwt_required()
def calculate_return_on_investment():
    if not FINANCIAL_SERVICES_AVAILABLE:
        return jsonify({'error': 'Financial services temporarily disabled'}), 503
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ['crop_type', 'area_acres', 'expected_yield_per_acre']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields: crop_type, area_acres, expected_yield_per_acre'}), 400
        
        # Default to Indian market for regional calculations
        region = data.get('region', 'IN')
        
        roi = financial_analyzer.calculate_roi(
            crop_type=data['crop_type'],
            area_acres=data['area_acres'],
            expected_yield_per_acre=data['expected_yield_per_acre'],
            additional_costs=data.get('additional_costs'),
            region=region
        )
        
        # Update user activity
        user_manager.update_user_activity(user_id, 'financial_analysis')
        
        return jsonify(roi)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/financial/market-trends', methods=['GET'])
@jwt_required()
def get_market_trends():
    try:
        user_id = get_jwt_identity()
        crop_type = request.args.get('crop_type')
        days = request.args.get('days', 30, type=int)
        
        # Use the new real-time market service instead of financial analyzer
        trends = realtime_market_service.get_market_trends(commodity=crop_type, days=days)
        
        # Update user activity
        user_manager.update_user_activity(user_id, 'financial_analysis')
        
        return jsonify(trends)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/financial/real-time-price', methods=['GET'])
@jwt_required()
def get_real_time_price():
    """Get real-time commodity price using new real-time service"""
    try:
        user_id = get_jwt_identity()
        commodity = request.args.get('commodity')
        region = request.args.get('region', 'IN')  # Default to Indian market for Mandi API priority
        
        if not commodity:
            return jsonify({'error': 'Commodity parameter is required'}), 400
        
        # Use the new real-time market service
        price_data = realtime_market_service.get_real_time_price_multi_source(commodity, region)
        
        if price_data:
            # Update user activity
            user_manager.update_user_activity(user_id, 'market_data')
            return jsonify({'success': True, 'data': price_data})
        else:
            return jsonify({'error': 'Price data unavailable', 'success': False}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/market/commodities', methods=['GET'])
@jwt_required()
def get_supported_commodities():
    """Get list of supported commodities for market data"""
    try:
        commodities = [
            {'id': 'wheat', 'name': 'Wheat', 'category': 'Grain', 'unit': 'kg'},
            {'id': 'rice', 'name': 'Rice', 'category': 'Grain', 'unit': 'kg'},
            {'id': 'corn', 'name': 'Corn/Maize', 'category': 'Grain', 'unit': 'kg'},
            {'id': 'soybean', 'name': 'Soybean', 'category': 'Oilseed', 'unit': 'kg'},
            {'id': 'cotton', 'name': 'Cotton', 'category': 'Fiber', 'unit': 'kg'},
            {'id': 'turmeric', 'name': 'Turmeric', 'category': 'Spice', 'unit': 'kg'},
            {'id': 'mustard', 'name': 'Mustard Seed', 'category': 'Oilseed', 'unit': 'kg'},
            {'id': 'cardamom', 'name': 'Cardamom', 'category': 'Spice', 'unit': 'kg'},
            {'id': 'coriander', 'name': 'Coriander', 'category': 'Spice', 'unit': 'kg'},
            {'id': 'onion', 'name': 'Onion', 'category': 'Vegetable', 'unit': 'kg'},
            {'id': 'tomato', 'name': 'Tomato', 'category': 'Vegetable', 'unit': 'kg'},
            {'id': 'potato', 'name': 'Potato', 'category': 'Vegetable', 'unit': 'kg'},
        ]
        return jsonify({'success': True, 'commodities': commodities})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/market/price-comparison', methods=['GET'])
@jwt_required()
def get_price_comparison():
    """Compare prices across different commodities using real-time service"""
    try:
        user_id = get_jwt_identity()
        commodities = request.args.getlist('commodities')
        region = request.args.get('region', 'US')
        
        if not commodities:
            # Default commodities for comparison
            commodities = ['wheat', 'rice', 'corn', 'soybean']
        
        comparison_data = []
        for commodity in commodities:
            price_data = realtime_market_service.get_real_time_price_multi_source(commodity, region)
            if price_data:
                comparison_data.append({
                    'commodity': commodity,
                    'price': price_data.get('price', 0),
                    'currency': price_data.get('currency', 'USD'),
                    'change': price_data.get('change', 0),
                    'change_percent': price_data.get('change_percent', 0),
                    'last_updated': price_data.get('last_updated', ''),
                    'data_source': price_data.get('data_source') or price_data.get('source', 'unknown'),
                    'from_cache': price_data.get('from_cache', False),
                    'data_freshness': price_data.get('data_freshness', 'unknown')
                })
        
        # Update user activity
        user_manager.update_user_activity(user_id, 'market_data')
        
        return jsonify({'success': True, 'data': comparison_data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/market/trending', methods=['GET'])
@jwt_required()
def get_trending_commodities():
    """Get trending commodities with high price volatility using real-time service"""
    try:
        user_id = get_jwt_identity()
        region = request.args.get('region', 'US')
        
        # Key commodities to check for trending
        key_commodities = ['wheat', 'rice', 'soybean', 'cotton', 'corn', 'sugar']
        trending_data = []
        
        for commodity in key_commodities:
            price_data = realtime_market_service.get_real_time_price_multi_source(commodity, region)
            if price_data:
                change_percent = abs(price_data.get('change_percent', 0))
                if change_percent > 0.5:  # Show commodities with >0.5% change
                    trending_data.append({
                        'commodity': commodity,
                        'price': price_data.get('price', 0),
                        'currency': price_data.get('currency', 'USD'),
                        'change': price_data.get('change', 0),
                        'change_percent': price_data.get('change_percent', 0),
                        'direction': 'up' if price_data.get('change', 0) > 0 else 'down',
                        'last_updated': price_data.get('last_updated', ''),
                        'data_source': price_data.get('data_source') or price_data.get('source', 'unknown'),
                        'from_cache': price_data.get('from_cache', False),
                        'data_freshness': price_data.get('data_freshness', 'unknown')
                    })
        
        # Sort by absolute change percentage (most volatile first)
        trending_data.sort(key=lambda x: abs(x['change_percent']), reverse=True)
        
        # Update user activity
        user_manager.update_user_activity(user_id, 'market_data')
        return jsonify({'success': True, 'trending': trending_data[:10]})  # Top 10
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/market/mandi-data', methods=['GET'])
@jwt_required()
def get_mandi_market_data():
    """Return detailed mandi price records from the Indian government API."""
    try:
        if not market_data_service:
            return jsonify({
                'success': False,
                'error': 'Market data service unavailable'
            }), 503

        user_id = get_jwt_identity()
        commodity = request.args.get('commodity')
        state = request.args.get('state')
        district = request.args.get('district')
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)

        response = market_data_service.get_mandi_data(
            commodity=commodity,
            state=state,
            district=district,
            limit=limit,
            offset=offset
        )

        # Track usage regardless of fallback so we know farmers checked mandi prices
        user_manager.update_user_activity(user_id, 'market_data')

        status_code = 200 if response.get('success', True) or response.get('fallback') else 502
        return jsonify(response), status_code

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/financial/production-costs', methods=['GET'])
@jwt_required()
def get_production_costs():
    """Get real production costs for a crop"""
    try:
        user_id = get_jwt_identity()
        crop_type = request.args.get('crop_type')
        region = request.args.get('region', 'IN')  # Default to Indian market
        area_acres = request.args.get('area_acres', 1, type=float)
        
        if not crop_type:
            return jsonify({'error': 'crop_type parameter is required'}), 400
        
        cost_data = market_data_service.get_production_costs(crop_type, region, area_acres)
        
        if cost_data:
            # Update user activity
            user_manager.update_user_activity(user_id, 'cost_analysis')
            return jsonify(cost_data)
        else:
            return jsonify({'error': 'Cost data unavailable', 'success': False}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/financial/historical-prices', methods=['GET'])
@jwt_required()
def get_historical_prices():
    """Get historical price data for a commodity"""
    try:
        user_id = get_jwt_identity()
        commodity = request.args.get('commodity')
        days = request.args.get('days', 30, type=int)
        
        if not commodity:
            return jsonify({'error': 'commodity parameter is required'}), 400
        
        historical_data = market_data_service.get_historical_prices(commodity, days)
        
        if historical_data:
            # Update user activity
            user_manager.update_user_activity(user_id, 'market_analysis')
            return jsonify({'success': True, 'data': historical_data})
        else:
            return jsonify({'error': 'Historical data unavailable', 'success': False}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =============================================================================
# COMMUNITY FORUM ROUTES
# =============================================================================

@app.route('/api/forum/posts', methods=['GET'])
def get_forum_posts():
    try:
        category = request.args.get('category')
        language = request.args.get('language')
        limit = request.args.get('limit', 20, type=int)
        page = request.args.get('page', 1, type=int)
        
        posts = community_forum.get_posts(language=language, category=category, limit=limit, page=page)
        return jsonify(posts)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/forum/posts', methods=['POST'])
@jwt_required()
def create_forum_post():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ['title', 'content', 'category']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Get user info
        user_info = user_manager.get_user_profile(user_id)
        if not user_info.get('success'):
            return jsonify({'error': 'User not found'}), 404
        
        author_name = user_info['user'].get('username', 'Anonymous')
        
        post = community_forum.create_post(
            title=data['title'],
            content=data['content'],
            author=author_name,
            language=data.get('language', 'en'),
            category=data['category']
        )
        
        # Update user activity
        user_manager.update_user_activity(user_id, 'forum_post')
        
        return jsonify(post), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/forum/posts/<post_id>', methods=['GET'])
def get_forum_post(post_id):
    try:
        post = community_forum.get_post(post_id)
        return jsonify(post)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/forum/posts/<post_id>/replies', methods=['POST'])
@jwt_required()
def add_forum_reply(post_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('content'):
            return jsonify({'error': 'Content is required'}), 400
        
        # Get user info
        user_info = user_manager.get_user_profile(user_id)
        if not user_info.get('success'):
            return jsonify({'error': 'User not found'}), 404
        
        author_name = user_info['user'].get('username', 'Anonymous')
        
        reply = community_forum.add_reply(
            post_id=post_id,
            content=data['content'],
            author=author_name,
            language=data.get('language', 'en')
        )
        
        return jsonify(reply), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/forum/search', methods=['GET'])
def search_forum_posts():
    try:
        query = request.args.get('q')
        if not query:
            return jsonify({'error': 'Query parameter is required'}), 400
        
        language = request.args.get('language')
        category = request.args.get('category')
        
        results = community_forum.search_posts(query=query, language=language, category=category)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'database': 'connected',
            'auth': 'active',
            'weather': 'active',
            'chatbot': 'active' if crop_chatbot.model else 'fallback_mode'
        }
    })

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': 'YieldWise API - Comprehensive Agricultural Intelligence Platform',
        'version': '2.0.0',
        'features': [
            'User Authentication & Profiles',
            'Real-time Weather Data',
            'AI-Powered Chatbot with Context',
            'Crop Yield Prediction',
            'Disease Detection',
            'Financial Analysis',
            'Community Forum',
            'Dashboard Analytics'
        ],
        'endpoints': {
            'auth': '/api/auth/*',
            'dashboard': '/api/dashboard/*',
            'weather': '/api/weather/*',
            'chatbot': '/api/chatbot/*',
            'prediction': '/api/predict-crop',
            'disease': '/api/detect-disease',
            'financial': '/api/financial/*',
            'forum': '/api/forum/*'
        }
    })

# =============================================================================
# ERROR HANDLERS
# =============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': 'Authorization token required'}), 401

# =============================================================================
# MAIN
# =============================================================================

if __name__ == '__main__':
    # Create environment file if it doesn't exist
    if not os.path.exists('.env'):
        print("Warning: .env file not found. Please create one with the required environment variables.")
        print("Check .env.example for the required variables.")

    # Start WebSocket server for real-time market updates (runs in background thread)
    try:
        websocket_host = os.environ.get('WEBSOCKET_HOST', '0.0.0.0').strip() or '0.0.0.0'
        websocket_port = int(os.environ.get('WEBSOCKET_PORT', '8765'))
        websocket_market_service.start_websocket_server(host=websocket_host, port=websocket_port)
        print(f"[WebSocket] Real-time market server running on ws://{websocket_host}:{websocket_port}")
    except Exception as ws_err:
        print(f"[WebSocket] ⚠️ Failed to start market data WebSocket server: {ws_err}")

    # Auto-train model if missing (for deployment)
    try:
        if not colab_style_model.is_trained and not colab_style_model._loaded:
            print("[Deployment] Model not found. Auto-training model for first deployment...")
            training_success = colab_style_model.train()
            if training_success:
                print("[Deployment] ✅ Model trained successfully!")
            else:
                print("[Deployment] ❌ Model training failed - using statistical fallback")
        else:
            print("[Deployment] ✅ Model already loaded and ready")
    except Exception as e:
        print(f"[Deployment] ⚠️ Model auto-training error: {e} - using fallback prediction methods")

    # Run the app (disable reloader to avoid WinError 10038)
    app.run(debug=True, host='0.0.0.0', port=5001, use_reloader=False)