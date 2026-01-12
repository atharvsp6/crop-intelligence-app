"""
Data repositories for different entities
"""
from typing import Optional, Dict, Any, List
from datetime import datetime

from app.db.firebase import FirebaseRepository
from app.core.logging import get_logger

logger = get_logger(__name__)


class UserRepository(FirebaseRepository):
    """Repository for user data."""
    
    def __init__(self):
        super().__init__("users")
    
    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email."""
        # Get all users and filter locally (works without index)
        # For production, add Firebase index for email field
        all_users = await self.get_all()
        if all_users:
            for user_id, user_data in all_users.items():
                if isinstance(user_data, dict) and user_data.get("email") == email:
                    user_data["id"] = user_id
                    return user_data
        return None
    
    async def create_user(
        self,
        email: str,
        hashed_password: str,
        name: str,
        role: str = "farmer",
        auth_provider: str = "email"
    ) -> Optional[str]:
        """Create a new user."""
        user_data = {
            "email": email,
            "hashed_password": hashed_password,
            "name": name,
            "role": role,
            "auth_provider": auth_provider,
            "is_active": True,
            "created_at": datetime.utcnow().isoformat()
        }
        return await self.push(user_data)
    
    async def update_last_login(self, user_id: str) -> bool:
        """Update user's last login timestamp."""
        return await self.update(user_id, {
            "last_login": datetime.utcnow().isoformat()
        })


class CropDataRepository(FirebaseRepository):
    """Repository for crop data and predictions."""
    
    def __init__(self):
        super().__init__("crop_data")
    
    async def save_prediction(
        self,
        user_id: str,
        crop: str,
        prediction_result: Dict[str, Any]
    ) -> Optional[str]:
        """Save a crop prediction."""
        data = {
            "user_id": user_id,
            "crop": crop,
            "prediction": prediction_result,
            "timestamp": datetime.utcnow().isoformat()
        }
        return await self.push(data)
    
    async def get_user_predictions(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get predictions for a user."""
        return await self.query(order_by="user_id", equal_to=user_id, limit=limit)


class DiseaseDetectionRepository(FirebaseRepository):
    """Repository for disease detection records."""
    
    def __init__(self):
        super().__init__("disease_detections")
    
    async def save_detection(
        self,
        user_id: str,
        image_url: Optional[str],
        detection_result: Dict[str, Any]
    ) -> Optional[str]:
        """Save a disease detection result."""
        data = {
            "user_id": user_id,
            "image_url": image_url,
            "result": detection_result,
            "timestamp": datetime.utcnow().isoformat()
        }
        return await self.push(data)
    
    async def get_user_detections(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get detections for a user."""
        return await self.query(order_by="user_id", equal_to=user_id, limit=limit)


class MarketDataRepository(FirebaseRepository):
    """Repository for market data cache."""
    
    def __init__(self):
        super().__init__("market_data")
    
    async def get_latest_prices(self, commodity: str) -> Optional[Dict[str, Any]]:
        """Get latest prices for a commodity."""
        return await self.get(commodity.lower())
    
    async def update_prices(
        self,
        commodity: str,
        prices: Dict[str, Any]
    ) -> bool:
        """Update commodity prices."""
        return await self.set(commodity.lower(), {
            "commodity": commodity,
            "prices": prices,
            "updated_at": datetime.utcnow().isoformat()
        })


class ForumRepository(FirebaseRepository):
    """Repository for community forum."""
    
    def __init__(self):
        super().__init__("forum")
    
    async def create_post(
        self,
        user_id: str,
        title: str,
        content: str,
        category: str
    ) -> Optional[str]:
        """Create a forum post."""
        data = {
            "user_id": user_id,
            "title": title,
            "content": content,
            "category": category,
            "likes": 0,
            "comments_count": 0,
            "created_at": datetime.utcnow().isoformat()
        }
        return await self.push(data)
    
    async def get_posts(
        self,
        category: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get forum posts."""
        if category:
            return await self.query(order_by="category", equal_to=category, limit=limit)
        return await self.query(limit=limit)
    
    async def add_comment(
        self,
        post_id: str,
        user_id: str,
        content: str
    ) -> bool:
        """Add a comment to a post."""
        comments_repo = FirebaseRepository(f"forum/{post_id}/comments")
        result = await comments_repo.push({
            "user_id": user_id,
            "content": content,
            "created_at": datetime.utcnow().isoformat()
        })
        
        if result:
            # Update comment count
            post = await self.get(post_id)
            if post:
                await self.update(post_id, {
                    "comments_count": post.get("comments_count", 0) + 1
                })
        
        return result is not None


# Repository instances
user_repository = UserRepository()
crop_data_repository = CropDataRepository()
disease_detection_repository = DiseaseDetectionRepository()
market_data_repository = MarketDataRepository()
forum_repository = ForumRepository()
