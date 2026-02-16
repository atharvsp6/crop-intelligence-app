from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError, ConfigurationError, OperationFailure
from urllib.parse import quote_plus
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Cached client / database so we only connect once
# ---------------------------------------------------------------------------
_cached_client = None
_cached_db = None
_db_available = None  # None = not yet checked, True/False after check


def _build_mongo_uri(target_db: str) -> str:
    """Build MongoDB URI from environment variables."""
    mongo_uri = os.environ.get('MONGO_URI')
    if not mongo_uri:
        user = os.environ.get('MONGO_USER')
        pwd = os.environ.get('MONGO_PASS')
        host = os.environ.get('MONGO_HOST', 'localhost')
        port = os.environ.get('MONGO_PORT', '27017')
        if user and pwd:
            mongo_uri = f"mongodb://{quote_plus(user)}:{quote_plus(pwd)}@{host}:{port}/{target_db}?authSource=admin"
        else:
            mongo_uri = f"mongodb://{host}:{port}/{target_db}"
    return mongo_uri


def _try_configure_dns():
    """Try to configure dnspython to use Google/Cloudflare DNS instead of
    the system default, which often fails for SRV records on home routers."""
    try:
        import dns.resolver
        resolver = dns.resolver.Resolver()
        # Prepend public DNS so SRV lookups for mongodb+srv work even when
        # the local router DNS can't resolve them.
        public_dns = ['8.8.8.8', '8.8.4.4', '1.1.1.1']
        resolver.nameservers = public_dns + [
            ns for ns in resolver.nameservers if ns not in public_dns
        ]
        dns.resolver.default_resolver = resolver
        logger.info("Configured dnspython to use Google/Cloudflare DNS")
    except Exception as e:
        logger.debug(f"Could not configure dnspython resolver: {e}")


# Run once at import time — lightweight, no network call
_try_configure_dns()


def get_database(db_name: str | None = None):
    """Return a MongoDB database handle (lazy, cached, fault-tolerant).

    Will NOT crash the application if MongoDB is unreachable.
    Returns None if the connection cannot be established.
    """
    global _cached_client, _cached_db, _db_available

    target_db = db_name or os.environ.get('MONGO_DB', 'crop_intelligence')

    # Return cache if we already have a good connection
    if _cached_db is not None and _db_available:
        return _cached_db

    mongo_uri = _build_mongo_uri(target_db)

    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=8000)
        client.admin.command('ping')
        _cached_client = client
        _cached_db = client[target_db]
        _db_available = True
        logger.info("✅ Connected to MongoDB successfully")
        return _cached_db
    except OperationFailure as e:
        _db_available = False
        logger.error("❌ MongoDB authentication failed: %s", e)
        logger.error("   Check username/password, IP whitelist, and database permissions.")
        return None
    except (ServerSelectionTimeoutError, ConfigurationError) as e:
        _db_available = False
        logger.error("❌ Cannot reach MongoDB cluster: %s", e)
        logger.error("   Possible causes: network/firewall, DNS for SRV, or cluster paused")
        return None
    except Exception as e:
        _db_available = False
        logger.error("❌ MongoDB connection error: %s", e)
        return None


def is_db_available() -> bool:
    """Check if the database is reachable (attempts connection if not yet checked)."""
    global _db_available
    if _db_available is None:
        get_database()
    return bool(_db_available)


def retry_connection():
    """Force a reconnection attempt (e.g. after network recovery)."""
    global _cached_client, _cached_db, _db_available
    _cached_client = None
    _cached_db = None
    _db_available = None
    return get_database()


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
    """Get a specific collection from the database.
    Returns None if DB is not available."""
    db = get_database()
    if db is None:
        logger.warning(f"Database unavailable — cannot access collection '{collection_name}'")
        return None
    return db[collection_name]