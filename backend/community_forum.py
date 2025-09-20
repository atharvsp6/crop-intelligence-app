from datetime import datetime, timedelta
from bson import ObjectId
from database import get_collection
import re

class CommunityForum:
    def __init__(self):
        self.supported_languages = {
            'en': 'English',
            'hi': 'Hindi',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German'
        }
        
        self.categories = [
            'cultivation',
            'pest_management',
            'irrigation',
            'fertilizers',
            'harvesting',
            'marketing',
            'weather',
            'general'
        ]
    
    def create_post(self, title, content, author, language='en', category='general'):
        """Create a new forum post"""
        try:
            if language not in self.supported_languages:
                return {'success': False, 'error': 'Unsupported language'}
            
            if category not in self.categories:
                return {'success': False, 'error': 'Invalid category'}
            
            post_data = {
                'title': title.strip(),
                'content': content.strip(),
                'author': author.strip(),
                'language': language,
                'category': category,
                'replies': [],
                'likes': 0,
                'views': 0,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'is_pinned': False,
                'is_locked': False,
                'tags': self._extract_tags(content)
            }
            
            collection = get_collection('forum_posts')
            result = collection.insert_one(post_data)
            
            if result.inserted_id:
                post_data['_id'] = str(result.inserted_id)
                return {
                    'success': True,
                    'post': post_data,
                    'message': 'Post created successfully'
                }
            else:
                return {'success': False, 'error': 'Failed to create post'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_posts(self, language=None, category=None, author=None, page=1, limit=10):
        """Get forum posts with filtering and pagination"""
        try:
            collection = get_collection('forum_posts')
            
            # Build query
            query = {}
            if language:
                query['language'] = language
            if category:
                query['category'] = category
            if author:
                query['author'] = {'$regex': author, '$options': 'i'}
            
            # Calculate skip value
            skip = (page - 1) * limit
            
            # Get posts with pagination
            posts_cursor = collection.find(query).sort('created_at', -1).skip(skip).limit(limit)
            posts = []
            
            for post in posts_cursor:
                post['_id'] = str(post['_id'])
                post['reply_count'] = len(post.get('replies', []))
                posts.append(post)
            
            # Get total count for pagination
            total_count = collection.count_documents(query)
            total_pages = (total_count + limit - 1) // limit
            
            return {
                'success': True,
                'posts': posts,
                'pagination': {
                    'current_page': page,
                    'total_pages': total_pages,
                    'total_count': total_count,
                    'has_next': page < total_pages,
                    'has_prev': page > 1
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_post(self, post_id):
        """Get a specific post by ID"""
        try:
            collection = get_collection('forum_posts')
            
            # Increment view count
            post = collection.find_one_and_update(
                {'_id': ObjectId(post_id)},
                {'$inc': {'views': 1}},
                return_document=True
            )
            
            if post:
                post['_id'] = str(post['_id'])
                post['reply_count'] = len(post.get('replies', []))
                return {
                    'success': True,
                    'post': post
                }
            else:
                return {'success': False, 'error': 'Post not found'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def add_reply(self, post_id, content, author, language='en'):
        """Add a reply to a post"""
        try:
            reply_data = {
                'content': content.strip(),
                'author': author.strip(),
                'language': language,
                'created_at': datetime.utcnow(),
                'likes': 0,
                'reply_id': str(ObjectId())
            }
            
            collection = get_collection('forum_posts')
            result = collection.update_one(
                {'_id': ObjectId(post_id)},
                {
                    '$push': {'replies': reply_data},
                    '$set': {'updated_at': datetime.utcnow()}
                }
            )
            
            if result.modified_count > 0:
                return {
                    'success': True,
                    'reply': reply_data,
                    'message': 'Reply added successfully'
                }
            else:
                return {'success': False, 'error': 'Failed to add reply or post not found'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def like_post(self, post_id, user):
        """Like a post"""
        try:
            collection = get_collection('forum_posts')
            result = collection.update_one(
                {'_id': ObjectId(post_id)},
                {'$inc': {'likes': 1}}
            )
            
            if result.modified_count > 0:
                # Also track who liked it (optional enhancement)
                return {
                    'success': True,
                    'message': 'Post liked successfully'
                }
            else:
                return {'success': False, 'error': 'Post not found'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def like_reply(self, post_id, reply_id):
        """Like a specific reply"""
        try:
            collection = get_collection('forum_posts')
            result = collection.update_one(
                {'_id': ObjectId(post_id), 'replies.reply_id': reply_id},
                {'$inc': {'replies.$.likes': 1}}
            )
            
            if result.modified_count > 0:
                return {
                    'success': True,
                    'message': 'Reply liked successfully'
                }
            else:
                return {'success': False, 'error': 'Reply not found'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def search_posts(self, query, language=None, category=None):
        """Search posts by content"""
        try:
            collection = get_collection('forum_posts')
            
            # Build search query
            search_query = {
                '$or': [
                    {'title': {'$regex': query, '$options': 'i'}},
                    {'content': {'$regex': query, '$options': 'i'}},
                    {'tags': {'$in': [query.lower()]}}
                ]
            }
            
            if language:
                search_query['language'] = language
            if category:
                search_query['category'] = category
            
            posts_cursor = collection.find(search_query).sort('created_at', -1).limit(20)
            posts = []
            
            for post in posts_cursor:
                post['_id'] = str(post['_id'])
                post['reply_count'] = len(post.get('replies', []))
                posts.append(post)
            
            return {
                'success': True,
                'posts': posts,
                'query': query,
                'total_found': len(posts)
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_trending_topics(self, language=None, days=7):
        """Get trending topics based on recent activity"""
        try:
            collection = get_collection('forum_posts')
            
            # Calculate date threshold
            date_threshold = datetime.utcnow() - timedelta(days=days)
            
            # Build aggregation pipeline
            pipeline = [
                {'$match': {'created_at': {'$gte': date_threshold}}},
                {'$group': {
                    '_id': '$category',
                    'post_count': {'$sum': 1},
                    'total_likes': {'$sum': '$likes'},
                    'total_views': {'$sum': '$views'},
                    'total_replies': {'$sum': {'$size': '$replies'}}
                }},
                {'$sort': {'total_views': -1, 'total_likes': -1}},
                {'$limit': 10}
            ]
            
            if language:
                pipeline[0]['$match']['language'] = language
            
            trending = list(collection.aggregate(pipeline))
            
            return {
                'success': True,
                'trending_topics': trending,
                'period_days': days
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_user_stats(self, username):
        """Get statistics for a specific user"""
        try:
            collection = get_collection('forum_posts')
            
            # Get user posts
            user_posts = list(collection.find({'author': username}))
            
            # Calculate stats
            total_posts = len(user_posts)
            total_likes = sum(post.get('likes', 0) for post in user_posts)
            total_replies_received = sum(len(post.get('replies', [])) for post in user_posts)
            
            # Calculate replies given by user
            all_posts = collection.find({'replies.author': username})
            total_replies_given = sum(
                1 for post in all_posts 
                for reply in post.get('replies', []) 
                if reply.get('author') == username
            )
            
            return {
                'success': True,
                'user_stats': {
                    'username': username,
                    'total_posts': total_posts,
                    'total_likes_received': total_likes,
                    'total_replies_received': total_replies_received,
                    'total_replies_given': total_replies_given,
                    'reputation_score': total_likes + (total_replies_given * 0.5)
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _extract_tags(self, content):
        """Extract relevant tags from content"""
        # Simple tag extraction based on common farming keywords
        farming_keywords = [
            'wheat', 'rice', 'corn', 'soybean', 'cotton', 'pesticide', 'fertilizer',
            'irrigation', 'harvest', 'planting', 'soil', 'weather', 'disease',
            'organic', 'seeds', 'crop rotation', 'yield'
        ]
        
        content_lower = content.lower()
        tags = []
        
        for keyword in farming_keywords:
            if keyword in content_lower:
                tags.append(keyword)
        
        return tags[:5]  # Limit to 5 tags

# Initialize forum instance
community_forum = CommunityForum()