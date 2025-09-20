from pymongo import MongoClient
import os
from datetime import datetime

def get_database():
    """Get MongoDB database connection"""
    mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
    client = MongoClient(mongo_uri)
    return client['crop_intelligence']

def init_database():
    """Initialize database with sample data"""
    db = get_database()
    
    # Initialize crop yield data collection
    if 'crop_yield_data' not in db.list_collection_names():
        crop_data = [
            {
                'crop_type': 'wheat',
                'temperature': 25.5,
                'humidity': 65.0,
                'ph': 6.8,
                'rainfall': 890.0,
                'nitrogen': 85.0,
                'phosphorus': 45.0,
                'potassium': 60.0,
                'yield': 4200.0,
                'created_at': datetime.utcnow()
            },
            {
                'crop_type': 'rice',
                'temperature': 28.0,
                'humidity': 80.0,
                'ph': 6.2,
                'rainfall': 1200.0,
                'nitrogen': 90.0,
                'phosphorus': 50.0,
                'potassium': 70.0,
                'yield': 3800.0,
                'created_at': datetime.utcnow()
            },
            {
                'crop_type': 'corn',
                'temperature': 26.5,
                'humidity': 70.0,
                'ph': 6.5,
                'rainfall': 950.0,
                'nitrogen': 95.0,
                'phosphorus': 55.0,
                'potassium': 65.0,
                'yield': 5200.0,
                'created_at': datetime.utcnow()
            }
        ]
        db.crop_yield_data.insert_many(crop_data)
    
    # Initialize market prices collection
    if 'market_prices' not in db.list_collection_names():
        market_data = [
            {
                'crop_type': 'wheat',
                'price_per_kg': 25.50,
                'market_location': 'Delhi',
                'date': datetime.utcnow(),
                'trend': 'up'
            },
            {
                'crop_type': 'rice',
                'price_per_kg': 32.00,
                'market_location': 'Mumbai',
                'date': datetime.utcnow(),
                'trend': 'stable'
            },
            {
                'crop_type': 'corn',
                'price_per_kg': 28.75,
                'market_location': 'Bangalore',
                'date': datetime.utcnow(),
                'trend': 'down'
            }
        ]
        db.market_prices.insert_many(market_data)
    
    # Initialize forum posts collection
    if 'forum_posts' not in db.list_collection_names():
        forum_posts = [
            {
                'title': 'Best practices for wheat cultivation',
                'content': 'What are the optimal conditions for wheat farming?',
                'author': 'farmer_john',
                'language': 'en',
                'category': 'cultivation',
                'replies': [],
                'created_at': datetime.utcnow(),
                'likes': 5
            },
            {
                'title': 'धान की खेती के लिए सुझाव',
                'content': 'धान की बेहतर पैदावार के लिए क्या करना चाहिए?',
                'author': 'किसान_राम',
                'language': 'hi',
                'category': 'cultivation',
                'replies': [],
                'created_at': datetime.utcnow(),
                'likes': 3
            }
        ]
        db.forum_posts.insert_many(forum_posts)

def get_collection(collection_name):
    """Get a specific collection from the database"""
    db = get_database()
    return db[collection_name]