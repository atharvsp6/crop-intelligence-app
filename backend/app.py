from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from datetime import datetime
from dotenv import load_dotenv

# Import modules
from database import init_database
from crop_predictor import crop_predictor
from disease_detector import disease_detector
from financial_analyzer import financial_analyzer
from community_forum import community_forum
from chatbot import crop_chatbot

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize database on startup
try:
    init_database()
    print("Database initialized successfully!")
except Exception as e:
    print(f"Database initialization error: {e}")

@app.route('/')
def home():
    return jsonify({
        "message": "Crop Intelligence API is running!",
        "version": "1.0.0",
        "features": [
            "Crop Yield Prediction",
            "Disease Detection", 
            "Financial Analysis",
            "Community Forum",
            "AI Chatbot"
        ]
    })

# Crop Yield Prediction Endpoints
@app.route('/api/predict-yield', methods=['POST'])
def predict_yield():
    try:
        data = request.get_json()
        
        required_fields = ['crop_type', 'temperature', 'humidity', 'ph', 'rainfall', 'nitrogen', 'phosphorus', 'potassium']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing field: {field}'}), 400
        
        result = crop_predictor.predict_yield(data)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/train-yield-model', methods=['POST'])
def train_yield_model():
    try:
        result = crop_predictor.train_model()
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Disease Detection Endpoints
@app.route('/api/detect-disease', methods=['POST'])
def detect_disease():
    try:
        data = request.get_json()
        
        if 'image' not in data:
            return jsonify({'success': False, 'error': 'Missing image data'}), 400
        
        result = disease_detector.predict_disease(data['image'])
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Financial Analysis Endpoints
@app.route('/api/calculate-roi', methods=['POST'])
def calculate_roi():
    try:
        data = request.get_json()
        
        required_fields = ['crop_type', 'area_acres', 'expected_yield_per_acre']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing field: {field}'}), 400
        
        result = financial_analyzer.calculate_roi(
            data['crop_type'],
            data['area_acres'],
            data['expected_yield_per_acre'],
            data.get('additional_costs')
        )
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/market-trends', methods=['GET'])
def get_market_trends():
    try:
        crop_type = request.args.get('crop_type')
        days = int(request.args.get('days', 30))
        
        result = financial_analyzer.get_market_trends(crop_type, days)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Community Forum Endpoints
@app.route('/api/forum/posts', methods=['GET'])
def get_forum_posts():
    try:
        language = request.args.get('language')
        category = request.args.get('category')
        author = request.args.get('author')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        result = community_forum.get_posts(language, category, author, page, limit)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/forum/posts', methods=['POST'])
def create_forum_post():
    try:
        data = request.get_json()
        
        required_fields = ['title', 'content', 'author']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing field: {field}'}), 400
        
        result = community_forum.create_post(
            data['title'],
            data['content'],
            data['author'],
            data.get('language', 'en'),
            data.get('category', 'general')
        )
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/forum/posts/<post_id>', methods=['GET'])
def get_forum_post(post_id):
    try:
        result = community_forum.get_post(post_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/forum/posts/<post_id>/replies', methods=['POST'])
def add_reply(post_id):
    try:
        data = request.get_json()
        
        required_fields = ['content', 'author']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing field: {field}'}), 400
        
        result = community_forum.add_reply(
            post_id,
            data['content'],
            data['author'],
            data.get('language', 'en')
        )
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/forum/posts/<post_id>/like', methods=['POST'])
def like_post(post_id):
    try:
        data = request.get_json()
        user = data.get('user', 'anonymous')
        
        result = community_forum.like_post(post_id, user)
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/forum/search', methods=['GET'])
def search_forum():
    try:
        query = request.args.get('q')
        if not query:
            return jsonify({'success': False, 'error': 'Missing search query'}), 400
        
        language = request.args.get('language')
        category = request.args.get('category')
        
        result = community_forum.search_posts(query, language, category)
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/forum/trending', methods=['GET'])
def get_trending_topics():
    try:
        language = request.args.get('language')
        days = int(request.args.get('days', 7))
        
        result = community_forum.get_trending_topics(language, days)
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Chatbot Endpoints
@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        
        if 'message' not in data:
            return jsonify({'success': False, 'error': 'Missing message'}), 400
        
        result = crop_chatbot.chat(data['message'], data.get('context'))
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/chat/crop-recommendations', methods=['POST'])
def get_crop_recommendations():
    try:
        data = request.get_json()
        
        if 'crop_type' not in data:
            return jsonify({'success': False, 'error': 'Missing crop_type'}), 400
        
        result = crop_chatbot.get_crop_recommendations(
            data['crop_type'],
            data.get('location'),
            data.get('season')
        )
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/chat/analyze-problem', methods=['POST'])
def analyze_crop_problem():
    try:
        data = request.get_json()
        
        if 'problem_description' not in data:
            return jsonify({'success': False, 'error': 'Missing problem_description'}), 400
        
        result = crop_chatbot.analyze_crop_problem(
            data['problem_description'],
            data.get('crop_type'),
            data.get('symptoms')
        )
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/chat/weather-advice', methods=['POST'])
def get_weather_advice():
    try:
        data = request.get_json()
        
        if 'weather_conditions' not in data:
            return jsonify({'success': False, 'error': 'Missing weather_conditions'}), 400
        
        result = crop_chatbot.get_weather_advice(
            data['weather_conditions'],
            data.get('crops')
        )
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/chat/clear', methods=['POST'])
def clear_chat_history():
    try:
        result = crop_chatbot.clear_history()
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Utility Endpoints
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': str(datetime.utcnow()),
        'services': {
            'database': 'connected',
            'crop_predictor': 'ready',
            'disease_detector': 'ready',
            'financial_analyzer': 'ready',
            'community_forum': 'ready',
            'chatbot': 'ready' if crop_chatbot.model else 'limited'
        }
    })

@app.route('/api/supported-crops', methods=['GET'])
def get_supported_crops():
    return jsonify({
        'success': True,
        'crops': ['wheat', 'rice', 'corn', 'soybean', 'cotton'],
        'languages': ['en', 'hi', 'es', 'fr', 'de'],
        'categories': ['cultivation', 'pest_management', 'irrigation', 'fertilizers', 'harvesting', 'marketing', 'weather', 'general']
    })

if __name__ == '__main__':
    app.run(debug=True, port=os.environ.get('PORT', 5000))
