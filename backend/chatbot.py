from groq import Groq
import os
from datetime import datetime
from database import get_collection

class CropChatbot:
    def __init__(self):
        self.api_key = os.environ.get('GROQ_API_KEY')
        self.model = os.environ.get('GROQ_CHATBOT_MODEL', 'llama-3.3-70b-versatile')
        self.chat_sessions_collection = get_collection('chat_sessions')
        self.client = None
        
        if self.api_key:
            try:
                self.client = Groq(api_key=self.api_key)
                print(f'[Chatbot] Groq AI initialized successfully with {self.model}')
            except Exception as e:
                print(f'[Chatbot] Error initializing Groq AI: {e}')
                self.client = None
        else:
            print('[Chatbot] Warning: GROQ_API_KEY not found')

    def chat(self, user_message, user_id=None):
        try:
            session_id = f'session_{user_id or "anon"}_{datetime.now().strftime("%Y%m%d")}'
            
            if self.client:
                prompt = f'You are an agricultural AI assistant specializing in Indian farming. Provide specific, practical farming advice for: {user_message}'
                message = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=0.7,
                    max_tokens=1024,
                )
                ai_response = message.choices[0].message.content.strip()
            else:
                ai_response = 'AI system unavailable. Please try again later.'
            
            return {
                'success': True,
                'response': ai_response,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f'[Chatbot] Error in chat: {e}')
            return {
                'success': False,
                'response': f'Sorry, there was an error processing your message',
                'timestamp': datetime.utcnow().isoformat()
            }
# Fallback chatbot instance (primarily used in app.py, app_integrated.py now uses multilingual_chatbot)
