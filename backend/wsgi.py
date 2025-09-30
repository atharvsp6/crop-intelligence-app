import sys
import os

# Add your project directory to the sys.path
project_home = u'/home/yourusername/crop-intelligence-app/backend'
if project_home not in sys.path:
    sys.path = [project_home] + sys.path

# Import your Flask app
from app_integrated import app as application