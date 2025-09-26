import google.generativeai as genai
import os
from datetime import datetime
from database import get_collection

class CropChatbot:
    def __init__(self):
        self.api_key = os.environ.get('GEMINI_API_KEY')
        self.model = None
        self.chat_sessions_collection = get_collection('chat_sessions')
        
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                # Try the current model name first
                try:
                    self.model = genai.GenerativeModel('gemini-2.5-flash')
                    print('Gemini AI initialized successfully with gemini-2.5-flash')
                except:
                    # Fallback to other possible model names
                    try:
                        self.model = genai.GenerativeModel('gemini-1.5-pro')
                        print('Gemini AI initialized successfully with gemini-2.5-flash')
                    except:
                        try:
                            self.model = genai.GenerativeModel('models/gemini-1.5-flash')
                            print('Gemini AI initialized successfully with models/gemini-1.5-flash')
                        except:
                            print('Unable to find available Gemini model')
                            self.model = None
            except Exception as e:
                print(f'Error initializing Gemini AI: {e}')
                self.model = None
        else:
            print('Warning: GEMINI_API_KEY not found')
            self.model = None

    def chat(self, user_message, user_id=None):
        try:
            session_id = f'session_{user_id or "anon"}_{datetime.now().strftime("%Y%m%d")}'
            
            if self.model:
                prompt = f'You are an agricultural AI assistant. Provide specific farming advice for: {user_message}'
                response = self.model.generate_content(prompt)
                ai_response = response.text if response and response.text else 'No response generated'
            else:
                ai_response = 'AI system unavailable. Please try again later.'
            
            return {
                'success': True,
                'response': ai_response,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'response': f'Error: {str(e)}',
                'timestamp': datetime.utcnow().isoformat()
            }

crop_chatbot = CropChatbot()
