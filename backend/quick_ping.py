"""Quick MongoDB connectivity probe.

Run: python quick_ping.py
Relies on environment variables (e.g., MONGO_URI) loaded via .env if app_integrated has been run once, or you can `pip install python-dotenv` and uncomment the load.
"""

from pprint import pprint

try:
    # If needed, uncomment:
    # from dotenv import load_dotenv; load_dotenv()
    from database import get_database
except Exception as import_err:
    print("Import failure before DB attempt:", import_err)
    raise

def main():
    try:
        db = get_database()
        cols = db.list_collection_names()
        print("✅ Mongo ping OK")
        print(f"Collections ({min(len(cols), 15)} shown):", cols[:15])
    except Exception as e:
        print("❌ Connectivity or auth failed:")
        print(repr(e))

if __name__ == "__main__":
    main()
