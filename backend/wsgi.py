import os, sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Fallback: try both module styles
try:
    from app_integrated import app as application
except ImportError:
    from app import app as application  # legacy name fallback

# Optional: gunicorn will look for 'application'
