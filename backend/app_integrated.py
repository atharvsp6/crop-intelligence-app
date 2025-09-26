from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, create_access_token
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables FIRST
load_dotenv()

# Import our services (after loading env vars)
from database import get_collection
from auth import UserManager
from weather_service import WeatherService
from dashboard_service import DashboardService
from chatbot import crop_chatbot
from crop_predictor import crop_predictor
from disease_detector import disease_detector
from financial_analyzer import financial_analyzer
from market_data_service import market_data_service
from community_forum import community_forum

# Initialize Flask app
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-here')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

# Initialize extensions
cors = CORS(app, origins=["http://localhost:3000"])
jwt = JWTManager(app)

# Initialize services
user_manager = UserManager()
weather_service = WeatherService()
dashboard_service = DashboardService()

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
@jwt_required()
def get_dashboard_stats():
    try:
        user_id = get_jwt_identity()
        global_stats = request.args.get('global', 'false').lower() == 'true'
        
        if global_stats:
            stats = dashboard_service.get_dashboard_stats()
        else:
            stats = dashboard_service.get_dashboard_stats(user_id)
            
        return jsonify(stats)
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
        
        response = crop_chatbot.chat(data['message'], user_id)
        
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
# EXISTING ROUTES (UPDATED WITH AUTH)
# =============================================================================

@app.route('/api/predict-crop', methods=['POST'])
@jwt_required()
def predict_crop_yield():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['temperature', 'humidity', 'ph', 'rainfall']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Add default values for missing optional fields
        if 'crop_type' not in data:
            data['crop_type'] = 'wheat'  # default crop type
        if 'nitrogen' not in data:
            data['nitrogen'] = 50  # default nitrogen level
        if 'phosphorus' not in data:
            data['phosphorus'] = 50  # default phosphorus level
        if 'potassium' not in data:
            data['potassium'] = 50  # default potassium level
        
        prediction = crop_predictor.predict_yield(data)
        
        # Update user activity
        user_manager.update_user_activity(user_id, 'crop_prediction')
        
        return jsonify(prediction)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/detect-disease', methods=['POST'])
@jwt_required()
def detect_plant_disease():
    try:
        user_id = get_jwt_identity()
        
        if 'image' not in request.files:
            return jsonify({'error': 'Image file is required'}), 400
        
        image_file = request.files['image']
        crop_type = request.form.get('crop_type', 'unknown')
        
        # Read image data
        image_data = image_file.read()
        
        detection = disease_detector.predict_disease(image_data)
        
        # Update user activity
        user_manager.update_user_activity(user_id, 'disease_detection')
        
        return jsonify(detection)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/financial/roi', methods=['POST'])
@jwt_required()
def calculate_return_on_investment():
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
        
        trends = financial_analyzer.get_market_trends(crop_type=crop_type, days=days)
        
        # Update user activity
        user_manager.update_user_activity(user_id, 'financial_analysis')
        
        return jsonify(trends)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/financial/real-time-price', methods=['GET'])
@jwt_required()
def get_real_time_price():
    """Get real-time commodity price"""
    try:
        user_id = get_jwt_identity()
        commodity = request.args.get('commodity')
        region = request.args.get('region', 'IN')  # Default to Indian market
        
        if not commodity:
            return jsonify({'error': 'Commodity parameter is required'}), 400
        
        price_data = market_data_service.get_real_time_price(commodity, region)
        
        if price_data:
            # Update user activity
            user_manager.update_user_activity(user_id, 'market_data')
            return jsonify({'success': True, 'data': price_data})
        else:
            return jsonify({'error': 'Price data unavailable', 'success': False}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
        'message': 'AgroSmart API - Comprehensive Agricultural Intelligence Platform',
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
    
    # Run the app
    app.run(debug=True, host='0.0.0.0', port=5001)