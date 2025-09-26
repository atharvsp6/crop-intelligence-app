from datetime import datetime, timedelta
import bcrypt
import jwt
import os
from bson import ObjectId
from database import get_collection

class UserManager:
    def __init__(self):
        self.users_collection = get_collection('users')
        self.sessions_collection = get_collection('user_sessions')
        self.jwt_secret = os.environ.get('JWT_SECRET_KEY', 'fallback_secret_key_change_in_production')
        self.jwt_expiry_hours = int(os.environ.get('JWT_EXPIRY_HOURS', 24))
    
    def hash_password(self, password):
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt)
    
    def verify_password(self, password, hashed):
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed)
    
    def generate_jwt_token(self, user_id):
        """Generate JWT token for user"""
        payload = {
            'user_id': str(user_id),
            'exp': datetime.utcnow() + timedelta(hours=self.jwt_expiry_hours),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, self.jwt_secret, algorithm='HS256')
    
    def verify_jwt_token(self, token):
        """Verify JWT token and return user_id"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=['HS256'])
            return payload['user_id']
        except jwt.ExpiredSignatureError:
            return {'error': 'Token expired'}
        except jwt.InvalidTokenError:
            return {'error': 'Invalid token'}
    
    def register_user(self, username, email, password, full_name='', location=None, farm_size='', primary_crops=None):
        """Register a new user"""
        try:
            if primary_crops is None:
                primary_crops = []
                
            # Check if user already exists
            existing_user = self.users_collection.find_one({'email': email.lower()})
            if existing_user:
                return {'success': False, 'error': 'User already exists with this email'}
            
            # Check if username already exists
            existing_username = self.users_collection.find_one({'username': username.lower()})
            if existing_username:
                return {'success': False, 'error': 'Username already taken'}
            
            # Validate input
            if len(password) < 6:
                return {'success': False, 'error': 'Password must be at least 6 characters long'}
            
            if not email or '@' not in email:
                return {'success': False, 'error': 'Valid email address required'}
                
            if not username or len(username) < 3:
                return {'success': False, 'error': 'Username must be at least 3 characters long'}
            
            # Create user document
            user_data = {
                'username': username.lower().strip(),
                'email': email.lower().strip(),
                'password_hash': self.hash_password(password),
                'full_name': full_name.strip(),
                'location': location.strip() if location else None,
                'farm_size': farm_size,
                'primary_crops': primary_crops,
                'created_at': datetime.utcnow(),
                'last_login': None,
                'is_active': True,
                'profile': {
                    'farm_size_acres': farm_size,
                    'primary_crops': primary_crops,
                    'experience_years': None,
                    'farming_type': None  # organic, conventional, mixed
                },
                'stats': {
                    'predictions_made': 0,
                    'forum_posts': 0,
                    'chat_conversations': 0,
                    'diseases_detected': 0
                }
            }
            
            result = self.users_collection.insert_one(user_data)
            
            return {
                'success': True,
                'user_id': result.inserted_id,
                'user': {
                    'id': str(result.inserted_id),
                    'username': username.lower(),
                    'email': email.lower(),
                    'full_name': full_name,
                    'location': location
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def login_user(self, email, password):
        """Authenticate user login"""
        try:
            # Find user
            user = self.users_collection.find_one({'email': email.lower()})
            if not user:
                return {'success': False, 'error': 'Invalid email or password'}
            
            if not user.get('is_active', True):
                return {'success': False, 'error': 'Account is disabled'}
            
            # Verify password
            if not self.verify_password(password, user['password_hash']):
                return {'success': False, 'error': 'Invalid email or password'}
            
            # Update last login
            self.users_collection.update_one(
                {'_id': user['_id']},
                {'$set': {'last_login': datetime.utcnow()}}
            )
            
            # Generate JWT token
            token = self.generate_jwt_token(user['_id'])
            
            return {
                'success': True,
                'user': {
                    'id': str(user['_id']),
                    'username': user.get('username', ''),
                    'email': user['email'],
                    'full_name': user.get('full_name', ''),
                    'location': user.get('location'),
                    'profile': user.get('profile', {}),
                    'stats': user.get('stats', {})
                },
                'token': token
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_user_by_id(self, user_id):
        """Get user by ID"""
        try:
            user = self.users_collection.find_one({'_id': ObjectId(user_id)})
            if not user:
                return {'success': False, 'error': 'User not found'}
            
            return {
                'success': True,
                'user': {
                    'id': str(user['_id']),
                    'email': user['email'],
                    'first_name': user['first_name'],
                    'last_name': user['last_name'],
                    'location': user.get('location'),
                    'profile': user.get('profile', {}),
                    'stats': user.get('stats', {}),
                    'created_at': user['created_at'].isoformat(),
                    'last_login': user['last_login'].isoformat() if user.get('last_login') else None
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def update_user_profile(self, user_id, profile_data):
        """Update user profile information"""
        try:
            allowed_fields = [
                'first_name', 'last_name', 'location', 'farm_size_acres',
                'primary_crops', 'experience_years', 'farming_type'
            ]
            
            update_data = {}
            profile_updates = {}
            
            for field, value in profile_data.items():
                if field in ['first_name', 'last_name', 'location']:
                    update_data[field] = value.strip() if isinstance(value, str) else value
                elif field in ['farm_size_acres', 'experience_years', 'farming_type', 'primary_crops']:
                    profile_updates[f'profile.{field}'] = value
            
            if profile_updates:
                update_data.update(profile_updates)
            
            update_data['updated_at'] = datetime.utcnow()
            
            result = self.users_collection.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': update_data}
            )
            
            if result.modified_count > 0:
                return {'success': True, 'message': 'Profile updated successfully'}
            else:
                return {'success': False, 'error': 'No changes made'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def increment_user_stat(self, user_id, stat_name):
        """Increment user statistics"""
        try:
            valid_stats = ['predictions_made', 'forum_posts', 'chat_conversations', 'diseases_detected']
            if stat_name not in valid_stats:
                return {'success': False, 'error': 'Invalid stat name'}
            
            self.users_collection.update_one(
                {'_id': ObjectId(user_id)},
                {'$inc': {f'stats.{stat_name}': 1}}
            )
            
            return {'success': True}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_all_users_stats(self):
        """Get aggregated statistics for all users (for dashboard)"""
        try:
            pipeline = [
                {
                    '$group': {
                        '_id': None,
                        'total_users': {'$sum': 1},
                        'total_predictions': {'$sum': '$stats.predictions_made'},
                        'total_forum_posts': {'$sum': '$stats.forum_posts'},
                        'total_chat_conversations': {'$sum': '$stats.chat_conversations'},
                        'total_diseases_detected': {'$sum': '$stats.diseases_detected'},
                        'active_users_30_days': {
                            '$sum': {
                                '$cond': [
                                    {
                                        '$gte': [
                                            '$last_login',
                                            datetime.utcnow() - timedelta(days=30)
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ]
            
            result = list(self.users_collection.aggregate(pipeline))
            
            if result:
                stats = result[0]
                stats.pop('_id', None)
                return {'success': True, 'stats': stats}
            else:
                return {
                    'success': True,
                    'stats': {
                        'total_users': 0,
                        'total_predictions': 0,
                        'total_forum_posts': 0,
                        'total_chat_conversations': 0,
                        'total_diseases_detected': 0,
                        'active_users_30_days': 0
                    }
                }
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_user_profile(self, user_id):
        """Get user profile information"""
        try:
            from bson import ObjectId
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            user = self.users_collection.find_one({'_id': user_id})
            if not user:
                return {'success': False, 'error': 'User not found'}
            
            # Return user info without sensitive data
            user_info = {
                'id': str(user['_id']),
                'username': user.get('username', ''),
                'email': user['email'],
                'full_name': user.get('full_name', ''),
                'location': user.get('location', ''),
                'farm_size': user.get('farm_size', ''),
                'primary_crops': user.get('primary_crops', []),
                'created_at': user.get('created_at'),
                'last_login': user.get('last_login'),
                'profile': user.get('profile', {}),
                'stats': user.get('stats', {})
            }
            
            return {'success': True, 'user': user_info}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def update_user_activity(self, user_id, activity_type):
        """Update user activity statistics"""
        try:
            from bson import ObjectId
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            # Map activity types to stat fields
            activity_mapping = {
                'chatbot_interaction': 'chat_conversations',
                'crop_prediction': 'predictions_made',
                'disease_detection': 'diseases_detected',
                'financial_analysis': 'predictions_made',  # Using predictions_made for financial analysis
                'forum_post': 'forum_posts'
            }
            
            stat_field = activity_mapping.get(activity_type, 'chat_conversations')
            
            # Update the user's stats
            self.users_collection.update_one(
                {'_id': user_id},
                {
                    '$inc': {f'stats.{stat_field}': 1},
                    '$set': {'last_activity': datetime.utcnow()}
                }
            )
            
            return {'success': True}
        except Exception as e:
            print(f"Error updating user activity: {e}")
            return {'success': False, 'error': str(e)}

# Initialize user manager instance
user_manager = UserManager()