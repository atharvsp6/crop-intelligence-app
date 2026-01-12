"""
Firebase Integration Layer
Async data access with caching support
"""
import json
from typing import Optional, Dict, Any, List
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, db
from cachetools import TTLCache
import asyncio
from functools import wraps

from app.core.config import get_settings
from app.core.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)

# Initialize cache
_cache = TTLCache(maxsize=settings.CACHE_MAX_SIZE, ttl=settings.CACHE_TTL_SECONDS)

# Firebase app instance
_firebase_app: Optional[firebase_admin.App] = None


def initialize_firebase() -> bool:
    """Initialize Firebase Admin SDK."""
    global _firebase_app
    
    if _firebase_app is not None:
        return True
    
    try:
        # Check for credentials
        if settings.FIREBASE_CREDENTIALS_PATH:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        elif settings.FIREBASE_CREDENTIALS_JSON:
            cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
            cred = credentials.Certificate(cred_dict)
        else:
            # Use default credentials (for local development with emulator)
            logger.warning("No Firebase credentials provided. Using mock mode.")
            return True  # Allow running without Firebase for development
        
        _firebase_app = firebase_admin.initialize_app(cred, {
            'databaseURL': settings.FIREBASE_DATABASE_URL
        })
        
        logger.info("Firebase initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")
        return False


def get_firebase_app() -> Optional[firebase_admin.App]:
    """Get Firebase app instance."""
    return _firebase_app


class FirebaseRepository:
    """
    Base repository for Firebase Realtime Database operations.
    Implements async wrappers and caching.
    """
    
    def __init__(self, collection: str):
        self.collection = collection
        self._ref = None
    
    @property
    def ref(self):
        """Get database reference."""
        if self._ref is None:
            if _firebase_app:
                self._ref = db.reference(self.collection)
            else:
                self._ref = None
        return self._ref
    
    def _cache_key(self, *args) -> str:
        """Generate cache key."""
        return f"{self.collection}:{':'.join(str(a) for a in args)}"
    
    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Get a single document by key."""
        cache_key = self._cache_key(key)
        
        # Check cache
        if cache_key in _cache:
            return _cache[cache_key]
        
        try:
            if self.ref is None:
                return self._mock_get(key)
            
            # Run sync Firebase operation in thread pool
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: self.ref.child(key).get()
            )
            
            if result:
                _cache[cache_key] = result
            
            return result
            
        except Exception as e:
            logger.error(f"Firebase get error: {e}")
            return None
    
    async def get_all(self) -> Optional[Dict[str, Any]]:
        """Get all documents in collection."""
        cache_key = self._cache_key("all")
        
        if cache_key in _cache:
            return _cache[cache_key]
        
        try:
            if self.ref is None:
                return self._mock_get_all()
            
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: self.ref.get()
            )
            
            if result:
                _cache[cache_key] = result
            
            return result or {}
            
        except Exception as e:
            logger.error(f"Firebase get_all error: {e}")
            return {}
    
    async def set(self, key: str, data: Dict[str, Any]) -> bool:
        """Set a document."""
        try:
            # Add metadata
            data["updated_at"] = datetime.utcnow().isoformat()
            
            if self.ref is None:
                return self._mock_set(key, data)
            
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: self.ref.child(key).set(data)
            )
            
            # Invalidate cache
            cache_key = self._cache_key(key)
            if cache_key in _cache:
                del _cache[cache_key]
            
            return True
            
        except Exception as e:
            logger.error(f"Firebase set error: {e}")
            return False
    
    async def update(self, key: str, data: Dict[str, Any]) -> bool:
        """Update a document."""
        try:
            data["updated_at"] = datetime.utcnow().isoformat()
            
            if self.ref is None:
                return self._mock_update(key, data)
            
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: self.ref.child(key).update(data)
            )
            
            # Invalidate cache
            cache_key = self._cache_key(key)
            if cache_key in _cache:
                del _cache[cache_key]
            
            return True
            
        except Exception as e:
            logger.error(f"Firebase update error: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete a document."""
        try:
            if self.ref is None:
                return self._mock_delete(key)
            
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: self.ref.child(key).delete()
            )
            
            # Invalidate cache
            cache_key = self._cache_key(key)
            if cache_key in _cache:
                del _cache[cache_key]
            
            return True
            
        except Exception as e:
            logger.error(f"Firebase delete error: {e}")
            return False
    
    async def query(
        self,
        order_by: Optional[str] = None,
        equal_to: Optional[Any] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Query documents with filters."""
        try:
            if self.ref is None:
                return self._mock_query()
            
            query_ref = self.ref
            
            if order_by:
                query_ref = query_ref.order_by_child(order_by)
            
            if equal_to is not None:
                query_ref = query_ref.equal_to(equal_to)
            
            if limit:
                query_ref = query_ref.limit_to_first(limit)
            
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: query_ref.get()
            )
            
            if result:
                return [{"id": k, **v} for k, v in result.items()]
            
            return []
            
        except Exception as e:
            logger.error(f"Firebase query error: {e}")
            return []
    
    async def push(self, data: Dict[str, Any]) -> Optional[str]:
        """Add a new document with auto-generated key."""
        try:
            data["created_at"] = datetime.utcnow().isoformat()
            data["updated_at"] = data["created_at"]
            
            if self.ref is None:
                return self._mock_push(data)
            
            loop = asyncio.get_event_loop()
            new_ref = await loop.run_in_executor(
                None,
                lambda: self.ref.push(data)
            )
            
            return new_ref.key
            
        except Exception as e:
            logger.error(f"Firebase push error: {e}")
            return None
    
    # Mock methods for development without Firebase
    _mock_data: Dict[str, Dict[str, Any]] = {}
    
    def _mock_get(self, key: str) -> Optional[Dict]:
        return self._mock_data.get(f"{self.collection}/{key}")
    
    def _mock_get_all(self) -> Dict:
        prefix = f"{self.collection}/"
        return {
            k.replace(prefix, ""): v 
            for k, v in self._mock_data.items() 
            if k.startswith(prefix)
        }
    
    def _mock_set(self, key: str, data: Dict) -> bool:
        self._mock_data[f"{self.collection}/{key}"] = data
        return True
    
    def _mock_update(self, key: str, data: Dict) -> bool:
        full_key = f"{self.collection}/{key}"
        if full_key in self._mock_data:
            self._mock_data[full_key].update(data)
        else:
            self._mock_data[full_key] = data
        return True
    
    def _mock_delete(self, key: str) -> bool:
        full_key = f"{self.collection}/{key}"
        if full_key in self._mock_data:
            del self._mock_data[full_key]
        return True
    
    def _mock_query(self) -> List[Dict]:
        return list(self._mock_data.values())
    
    def _mock_push(self, data: Dict) -> str:
        import uuid
        key = str(uuid.uuid4())[:8]
        self._mock_data[f"{self.collection}/{key}"] = data
        return key


def clear_cache():
    """Clear all cached data."""
    _cache.clear()
    logger.info("Cache cleared")
