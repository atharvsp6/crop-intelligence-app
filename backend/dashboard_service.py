from datetime import datetime, timedelta
from bson import ObjectId
from database import get_collection
import pymongo

class DashboardService:
    def __init__(self):
        self.users_collection = get_collection('users')
        self.predictions_collection = get_collection('crop_predictions')
        self.diseases_collection = get_collection('disease_detections')
        self.forum_posts_collection = get_collection('forum_posts')
        self.chat_sessions_collection = get_collection('chat_sessions')
        self.weather_collection = get_collection('weather_cache')
    
    def get_dashboard_stats(self, user_id=None):
        """Get comprehensive dashboard statistics"""
        try:
            if user_id:
                return self._get_user_specific_stats(user_id)
            else:
                return self._get_global_stats()
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _get_global_stats(self):
        """Get global platform statistics"""
        try:
            stats = {}
            
            # Total users
            total_users = self.users_collection.count_documents({})
            
            # Active users (logged in within last 30 days)
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            active_users = self.users_collection.count_documents({
                'last_login': {'$gte': thirty_days_ago}
            })
            
            # Total predictions made
            total_predictions = self.predictions_collection.count_documents({})
            
            # Predictions this month
            start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            predictions_this_month = self.predictions_collection.count_documents({
                'created_at': {'$gte': start_of_month}
            })
            
            # Total diseases detected
            total_diseases = self.diseases_collection.count_documents({
                'result.prediction.is_healthy': False
            })
            
            # Diseases detected this month
            diseases_this_month = self.diseases_collection.count_documents({
                'created_at': {'$gte': start_of_month},
                'result.prediction.is_healthy': False
            })
            
            # Total forum posts
            total_forum_posts = self.forum_posts_collection.count_documents({})
            
            # Forum posts this month
            forum_posts_this_month = self.forum_posts_collection.count_documents({
                'created_at': {'$gte': start_of_month}
            })
            
            # Total chat conversations
            total_chats = self.chat_sessions_collection.count_documents({})
            
            # Chat conversations this month
            chats_this_month = self.chat_sessions_collection.count_documents({
                'created_at': {'$gte': start_of_month}
            })
            
            # Calculate growth percentages
            last_month_start = start_of_month - timedelta(days=30)
            
            predictions_last_month = self.predictions_collection.count_documents({
                'created_at': {'$gte': last_month_start, '$lt': start_of_month}
            })
            
            diseases_last_month = self.diseases_collection.count_documents({
                'created_at': {'$gte': last_month_start, '$lt': start_of_month},
                'result.prediction.is_healthy': False
            })
            
            forum_posts_last_month = self.forum_posts_collection.count_documents({
                'created_at': {'$gte': last_month_start, '$lt': start_of_month}
            })
            
            chats_last_month = self.chat_sessions_collection.count_documents({
                'created_at': {'$gte': last_month_start, '$lt': start_of_month}
            })
            
            return {
                'success': True,
                'stats': {
                    'total_users': total_users,
                    'active_users': active_users,
                    'predictions': {
                        'total': total_predictions,
                        'this_month': predictions_this_month,
                        'last_month': predictions_last_month,
                        'growth_percentage': self._calculate_growth_percentage(predictions_this_month, predictions_last_month)
                    },
                    'diseases': {
                        'total': total_diseases,
                        'this_month': diseases_this_month,
                        'last_month': diseases_last_month,
                        'growth_percentage': self._calculate_growth_percentage(diseases_this_month, diseases_last_month)
                    },
                    'forum_posts': {
                        'total': total_forum_posts,
                        'this_month': forum_posts_this_month,
                        'last_month': forum_posts_last_month,
                        'growth_percentage': self._calculate_growth_percentage(forum_posts_this_month, forum_posts_last_month)
                    },
                    'chat_conversations': {
                        'total': total_chats,
                        'this_month': chats_this_month,
                        'last_month': chats_last_month,
                        'growth_percentage': self._calculate_growth_percentage(chats_this_month, chats_last_month)
                    }
                },
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'fallback_stats': self._get_fallback_stats()
            }
    
    def _get_user_specific_stats(self, user_id):
        """Get statistics specific to a user"""
        try:
            user_object_id = ObjectId(user_id)
            
            # User's predictions
            user_predictions = self.predictions_collection.count_documents({
                'user_id': user_object_id
            })
            
            # User's disease detections
            user_diseases = self.diseases_collection.count_documents({
                'user_id': user_object_id
            })
            
            # User's forum posts
            user_forum_posts = self.forum_posts_collection.count_documents({
                'author_id': user_object_id
            })
            
            # User's chat sessions
            user_chats = self.chat_sessions_collection.count_documents({
                'user_id': user_object_id
            })
            
            # Recent activity (last 7 days)
            seven_days_ago = datetime.utcnow() - timedelta(days=7)
            
            recent_predictions = self.predictions_collection.count_documents({
                'user_id': user_object_id,
                'created_at': {'$gte': seven_days_ago}
            })
            
            recent_diseases = self.diseases_collection.count_documents({
                'user_id': user_object_id,
                'created_at': {'$gte': seven_days_ago}
            })
            
            recent_forum_posts = self.forum_posts_collection.count_documents({
                'author_id': user_object_id,
                'created_at': {'$gte': seven_days_ago}
            })
            
            recent_chats = self.chat_sessions_collection.count_documents({
                'user_id': user_object_id,
                'created_at': {'$gte': seven_days_ago}
            })
            
            return {
                'success': True,
                'user_stats': {
                    'predictions': {
                        'total': user_predictions,
                        'recent': recent_predictions
                    },
                    'diseases': {
                        'total': user_diseases,
                        'recent': recent_diseases
                    },
                    'forum_posts': {
                        'total': user_forum_posts,
                        'recent': recent_forum_posts
                    },
                    'chat_conversations': {
                        'total': user_chats,
                        'recent': recent_chats
                    }
                },
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_crop_statistics(self):
        """Get crop-related statistics"""
        try:
            # Most predicted crops
            crop_predictions = list(self.predictions_collection.aggregate([
                {
                    '$group': {
                        '_id': '$input_data.crop_type',
                        'count': {'$sum': 1},
                        'avg_yield': {'$avg': '$result.predicted_yield'}
                    }
                },
                {'$sort': {'count': -1}},
                {'$limit': 10}
            ]))
            
            # Most detected diseases
            disease_stats = list(self.diseases_collection.aggregate([
                {
                    '$match': {'result.prediction.is_healthy': False}
                },
                {
                    '$group': {
                        '_id': '$result.prediction.condition',
                        'count': {'$sum': 1},
                        'avg_confidence': {'$avg': '$result.prediction.confidence'}
                    }
                },
                {'$sort': {'count': -1}},
                {'$limit': 10}
            ]))
            
            return {
                'success': True,
                'crop_stats': {
                    'most_predicted_crops': crop_predictions,
                    'most_detected_diseases': disease_stats
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_forum_statistics(self):
        """Get forum activity statistics"""
        try:
            # Most active categories
            category_stats = list(self.forum_posts_collection.aggregate([
                {
                    '$group': {
                        '_id': '$category',
                        'post_count': {'$sum': 1},
                        'total_replies': {'$sum': {'$size': '$replies'}},
                        'total_likes': {'$sum': '$likes'}
                    }
                },
                {'$sort': {'post_count': -1}}
            ]))
            
            # Most active languages
            language_stats = list(self.forum_posts_collection.aggregate([
                {
                    '$group': {
                        '_id': '$language',
                        'post_count': {'$sum': 1}
                    }
                },
                {'$sort': {'post_count': -1}}
            ]))
            
            # Recent activity trends (last 30 days)
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            daily_posts = list(self.forum_posts_collection.aggregate([
                {
                    '$match': {'created_at': {'$gte': thirty_days_ago}}
                },
                {
                    '$group': {
                        '_id': {
                            'year': {'$year': '$created_at'},
                            'month': {'$month': '$created_at'},
                            'day': {'$dayOfMonth': '$created_at'}
                        },
                        'count': {'$sum': 1}
                    }
                },
                {'$sort': {'_id': 1}}
            ]))
            
            return {
                'success': True,
                'forum_stats': {
                    'category_breakdown': category_stats,
                    'language_breakdown': language_stats,
                    'daily_activity': daily_posts
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_recent_activity(self, limit=20):
        """Get recent platform activity"""
        try:
            activities = []
            
            # Recent predictions
            recent_predictions = list(self.predictions_collection.find(
                {},
                {'created_at': 1, 'input_data.crop_type': 1, 'user_id': 1}
            ).sort('created_at', -1).limit(limit // 4))
            
            for pred in recent_predictions:
                activities.append({
                    'type': 'prediction',
                    'message': f'Crop yield prediction for {pred.get("input_data", {}).get("crop_type", "unknown crop")}',
                    'timestamp': pred['created_at'].isoformat(),
                    'user_id': str(pred.get('user_id', ''))
                })
            
            # Recent disease detections
            recent_diseases = list(self.diseases_collection.find(
                {},
                {'created_at': 1, 'result.prediction': 1, 'user_id': 1}
            ).sort('created_at', -1).limit(limit // 4))
            
            for disease in recent_diseases:
                condition = disease.get('result', {}).get('prediction', {}).get('condition', 'unknown')
                activities.append({
                    'type': 'disease_detection',
                    'message': f'Disease detection: {condition}',
                    'timestamp': disease['created_at'].isoformat(),
                    'user_id': str(disease.get('user_id', ''))
                })
            
            # Recent forum posts
            recent_posts = list(self.forum_posts_collection.find(
                {},
                {'created_at': 1, 'title': 1, 'author': 1}
            ).sort('created_at', -1).limit(limit // 4))
            
            for post in recent_posts:
                activities.append({
                    'type': 'forum_post',
                    'message': f'New forum post: {post.get("title", "Untitled")[:50]}...',
                    'timestamp': post['created_at'].isoformat(),
                    'author': post.get('author', 'Anonymous')
                })
            
            # Recent chat sessions
            recent_chats = list(self.chat_sessions_collection.find(
                {},
                {'created_at': 1, 'user_id': 1}
            ).sort('created_at', -1).limit(limit // 4))
            
            for chat in recent_chats:
                activities.append({
                    'type': 'chat_session',
                    'message': 'AI chatbot conversation started',
                    'timestamp': chat['created_at'].isoformat(),
                    'user_id': str(chat.get('user_id', ''))
                })
            
            # Sort all activities by timestamp
            activities.sort(key=lambda x: x['timestamp'], reverse=True)
            
            return {
                'success': True,
                'recent_activity': activities[:limit]
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _calculate_growth_percentage(self, current, previous):
        """Calculate growth percentage between two periods"""
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100, 1)
    
    def _get_fallback_stats(self):
        """Fallback statistics when database is unavailable"""
        return {
            'total_users': 0,
            'active_users': 0,
            'predictions': {
                'total': 0,
                'this_month': 0,
                'last_month': 0,
                'growth_percentage': 0
            },
            'diseases': {
                'total': 0,
                'this_month': 0,
                'last_month': 0,
                'growth_percentage': 0
            },
            'forum_posts': {
                'total': 0,
                'this_month': 0,
                'last_month': 0,
                'growth_percentage': 0
            },
            'chat_conversations': {
                'total': 0,
                'this_month': 0,
                'last_month': 0,
                'growth_percentage': 0
            }
        }

# Initialize dashboard service instance
dashboard_service = DashboardService()