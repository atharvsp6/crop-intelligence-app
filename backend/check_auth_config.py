#!/usr/bin/env python3
"""
Authentication System Configuration Checker
Verifies that the authentication system is properly configured.
"""

import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def check_configuration():
    """Check if all required configuration is present."""
    print("=" * 60)
    print("Authentication System Configuration Checker")
    print("=" * 60)
    print()
    
    # Check imports
    print("1. Checking imports...")
    try:
        from auth import UserManager
        from database import get_collection
        from flask_jwt_extended import JWTManager
        print("   ✓ All required modules can be imported")
    except ImportError as e:
        print(f"   ✗ Import error: {e}")
        return False
    
    # Check environment variables
    print("\n2. Checking environment variables...")
    required_vars = {
        'JWT_SECRET_KEY': 'JWT signing secret',
        'MONGO_URI': 'MongoDB connection string',
    }
    
    optional_vars = {
        'FRONTEND_URL': 'Primary frontend URL',
        'ALLOWED_ORIGINS': 'Additional allowed CORS origins',
        'REACT_APP_GOOGLE_CLIENT_ID': 'Google OAuth Client ID',
    }
    
    all_good = True
    for var, desc in required_vars.items():
        value = os.environ.get(var)
        if value and value not in ['your-secret-key-here', 'your-jwt-secret-key-here']:
            print(f"   ✓ {var} is set ({desc})")
        else:
            print(f"   ✗ {var} is not set or using default ({desc})")
            all_good = False
    
    print("\n   Optional variables:")
    for var, desc in optional_vars.items():
        value = os.environ.get(var)
        if value:
            print(f"   ✓ {var} is set ({desc})")
        else:
            print(f"   ℹ {var} is not set ({desc})")
    
    # Check CORS configuration
    print("\n3. Checking CORS configuration...")
    try:
        # Load app to check CORS
        from app_integrated import app, _is_allowed_origin, allowed_origin_set
        
        print(f"   ✓ App loaded successfully")
        print(f"   ✓ Configured allowed origins: {len(allowed_origin_set)}")
        
        # Test some common origins
        test_origins = [
            'http://localhost:3000',
            'https://test.vercel.app',
            'https://test.azurewebsites.net',
            'https://test.onrender.com',
        ]
        
        print("\n   Testing auto-allowed origins:")
        for origin in test_origins:
            if _is_allowed_origin(origin):
                print(f"   ✓ {origin} - ALLOWED")
            else:
                print(f"   ✗ {origin} - BLOCKED")
        
    except Exception as e:
        print(f"   ✗ Error loading app: {e}")
        all_good = False
    
    # Check UserManager functionality
    print("\n4. Checking UserManager...")
    try:
        user_manager = UserManager()
        
        # Check JWT generation
        from bson import ObjectId
        test_id = ObjectId()
        token = user_manager.generate_jwt_token(test_id)
        
        if token:
            print(f"   ✓ JWT token generation works")
            
            # Verify token
            result = user_manager.verify_jwt_token(token)
            if str(result) == str(test_id):
                print(f"   ✓ JWT token verification works")
            else:
                print(f"   ✗ JWT token verification failed: {result}")
                all_good = False
        else:
            print(f"   ✗ JWT token generation failed")
            all_good = False
            
    except Exception as e:
        print(f"   ✗ Error testing UserManager: {e}")
        all_good = False
    
    # Summary
    print("\n" + "=" * 60)
    if all_good:
        print("✓ All critical checks passed!")
        print("\nNext steps:")
        print("1. Set up MongoDB (MONGO_URI)")
        print("2. Configure frontend URL (FRONTEND_URL)")
        print("3. Optional: Set up Google OAuth (REACT_APP_GOOGLE_CLIENT_ID)")
        print("4. Start the backend: gunicorn app:app")
    else:
        print("✗ Some checks failed. Please review the errors above.")
        print("\nTo fix:")
        print("1. Copy backend/.env.example to backend/.env")
        print("2. Fill in required values (especially JWT_SECRET_KEY and MONGO_URI)")
        print("3. Run this script again")
    print("=" * 60)
    
    return all_good

if __name__ == '__main__':
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    success = check_configuration()
    sys.exit(0 if success else 1)
