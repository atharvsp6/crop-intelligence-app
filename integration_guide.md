
# Integration Guide for Multilingual Agricultural Chatbot

## 1. Install Required Packages

Add to your requirements.txt:
```
googletrans==4.0.0rc1
langdetect==1.0.9
SpeechRecognition==3.10.0
pydub==0.25.1
pyttsx3==2.90
gTTS==2.3.2
```

## 2. Environment Variables

Add to your .env file:
```
# Your existing Gemini API key
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Google Cloud Translation API
GOOGLE_TRANSLATE_API_KEY=your_google_translate_key_here

# Language configuration
SUPPORTED_LANGUAGES=en,hi,mr,ta,te,gu,bn
DEFAULT_LANGUAGE=en
```

## 3. Database Setup

Add these tables to your existing database:
```sql
-- User language preferences
CREATE TABLE IF NOT EXISTS user_language_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(50),
    preferred_language VARCHAR(5) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat history
CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(50),
    query_text TEXT,
    response_text TEXT,
    language VARCHAR(5),
    query_type VARCHAR(50),
    confidence_score FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 4. Integration with Existing Flask App

Add these imports to your app.py:
```python
from multilingual_chatbot import MultilingualAgriChatbot, create_chatbot_routes
```

Add this function to integrate the chatbot:
```python
def integrate_multilingual_chatbot(app):
    gemini_key = os.getenv('GEMINI_API_KEY')

    if not gemini_key:
        print("Warning: GEMINI_API_KEY not found. Chatbot features disabled.")
        return

    try:
        chatbot = MultilingualAgriChatbot(gemini_key)
        create_chatbot_routes(app, chatbot)

        @app.route('/api/integrated_advice', methods=['POST'])
        def integrated_agricultural_advice():
            data = request.get_json()

            # Your existing yield prediction logic here
            crop = data.get('crop', '')
            state = data.get('state', '')
            user_lang = data.get('language', 'en')

            advice_query = f"I am growing {crop} in {state}. What advice can you give for better yield?"
            chatbot_response = chatbot.generate_response(advice_query, user_lang)

            return jsonify({
                'yield_prediction': 'Your existing prediction result',
                'ai_advice': chatbot_response,
                'language': user_lang
            })

        print("Multilingual chatbot integrated successfully!")

    except Exception as e:
        print(f"Error integrating chatbot: {e}")

# Call this function after creating your Flask app
integrate_multilingual_chatbot(app)
```

## 5. Frontend Integration

Add the MultilingualChatbot component to your React app:
```tsx
import MultilingualChatbot from './components/MultilingualChatbot';

// In your main component
function App() {
  return (
    <div className="App">
      {/* Your existing components */}
      <MultilingualChatbot />
    </div>
  );
}
```

## 6. API Endpoints Added

- POST /api/chatbot - General agricultural queries
- POST /api/chatbot/crop-advice - Specific crop advice
- GET /api/chatbot/languages - Supported languages
- POST /api/chatbot/translate - Text translation
- POST /api/integrated_advice - Combined yield prediction and advice
- POST /api/voice_query - Voice input handling

## 7. Features Included

✅ 6 Indian regional languages support
✅ Real-time translation
✅ Voice input/output capabilities
✅ Agricultural terminology dictionary
✅ Crop-specific advice
✅ Integration with existing yield prediction
✅ Chat history storage
✅ Language preference management
