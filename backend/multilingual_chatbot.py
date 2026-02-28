"""Backend-local multilingual chatbot implementation using Groq API.
Avoids recursive self-import issues under Python 3.13 when root project file name matches.
Provides the symbols expected by app_integrated: MultilingualAgriChatbot, create_chatbot_routes.
"""

from groq import Groq
from datetime import datetime
import re


class MultilingualAgriChatbot:
    def __init__(self, groq_api_key: str, model_name: str = 'llama-3.3-70b-versatile'):
        self.client = Groq(api_key=groq_api_key)
        self.model = model_name
        print(f"[Chatbot] Initialized Groq client with model: {model_name}")
        self.supported_languages = {
            'hi': 'Hindi', 'mr': 'Marathi', 'ta': 'Tamil', 'te': 'Telugu',
            'gu': 'Gujarati', 'bn': 'Bengali', 'en': 'English', 'kn': 'Kannada',
            'pa': 'Punjabi', 'or': 'Odia', 'ml': 'Malayalam'
        }
        self.agri_terms = {
            'en': {'crop': 'crop', 'fertilizer': 'fertilizer', 'irrigation': 'irrigation'},
            'hi': {'crop': 'फसल', 'fertilizer': 'उर्वरक', 'irrigation': 'सिंचाई'},
            'mr': {'crop': 'पीक', 'fertilizer': 'खत', 'irrigation': 'सिंचन'},
            'ta': {'crop': 'பயிர்', 'fertilizer': 'உர்வரம்', 'irrigation': 'நீர்ப்பாசனம்'},
            'te': {'crop': 'పంట', 'fertilizer': 'ఎరువు', 'irrigation': 'నీటిపారుదల'},
            'gu': {'crop': 'પાક', 'fertilizer': 'ખાતર', 'irrigation': 'સિંચાઈ'},
            'bn': {'crop': 'ফসল', 'fertilizer': 'সার', 'irrigation': 'সেচ'}
        }

    def detect_language(self, text: str) -> str:
        """Simple language detection based on character patterns"""
        try:
            # Devanagari scripts (Hindi, Marathi, etc.)
            if re.search(r'[\u0900-\u097F]', text):
                # More sophisticated detection could be added here
                return 'hi'  # Default to Hindi for Devanagari
            # Tamil script
            elif re.search(r'[\u0B80-\u0BFF]', text):
                return 'ta'
            # Telugu script
            elif re.search(r'[\u0C00-\u0C7F]', text):
                return 'te'
            # Gujarati script
            elif re.search(r'[\u0A80-\u0AFF]', text):
                return 'gu'
            # Bengali script
            elif re.search(r'[\u0980-\u09FF]', text):
                return 'bn'
            # Default to English if no regional script detected
            else:
                return 'en'
        except Exception:
            return 'en'


    def get_agricultural_context(self, query: str, user_lang='en'):
        lang_name = self.supported_languages.get(user_lang, 'English')
        
        if user_lang == 'en':
            context = """You are an expert agricultural advisor specializing in Indian farming practices. 
            Provide practical, sustainable advice for smallholder farmers. Focus on:
            - Crop-specific guidance for Indian conditions
            - Cost-effective solutions
            - Traditional and modern farming techniques
            - Disease and pest management
            - Optimal use of resources like water and fertilizers
            
            Keep responses concise and actionable."""
        else:
            context = f"""You are an expert agricultural advisor for Indian farmers. 
            Respond ONLY in {lang_name} language. Provide practical advice about:
            - Crop cultivation techniques
            - Fertilizer and pesticide usage
            - Irrigation methods
            - Disease prevention
            - Harvest timing
            
            Answer in {lang_name} script and language only."""
        
        return f"{context}\n\nQuery: {query}"

    def generate_response(self, user_query: str, user_lang='en'):
        try:
            prompt = self.get_agricultural_context(user_query, user_lang)
            
            # Use Groq API for fast inference
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
            
            answer = message.choices[0].message.content.strip()
            
            # Clean up repeated characters if any
            answer = re.sub(r'([\u0900-\u097F\w])\1{3,}', r'\1\1', answer)
            
            return {
                'response': answer,
                'detected_language': user_lang,
                'original_query': user_query,
                'timestamp': datetime.now().isoformat(),
                'language_name': self.supported_languages.get(user_lang, 'English')
            }
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"[Chatbot Error] Groq API error: {error_details}")
            error_msg = f"मुझे खेद है, तकनीकी समस्या है" if user_lang == 'hi' else "Sorry, there's a technical issue"
            return {
                'response': error_msg,
                'error': str(e),
                'detected_language': user_lang,
                'timestamp': datetime.now().isoformat()
            }

    def translate_text(self, text: str, target_lang: str = 'en', source_lang: str = 'auto') -> str:
        """Translate text between supported languages using Groq."""
        try:
            if source_lang == 'auto':
                source_lang = self.detect_language(text)
            target_name = self.supported_languages.get(target_lang, 'English')
            source_name = self.supported_languages.get(source_lang, 'auto-detected')

            if source_lang == target_lang:
                return text

            prompt = (
                f"Translate the following text from {source_name} to {target_name}. "
                f"Return ONLY the translated text, nothing else.\n\nText: {text}"
            )
            message = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1024,
            )
            return message.choices[0].message.content.strip()
        except Exception as e:
            print(f"[Chatbot] Translation error: {e}")
            return text  # Return original text on failure

    def get_crop_specific_advice(self, crop_name: str, query_type: str, user_lang='en'):
        lang_name = self.supported_languages.get(user_lang, 'English')

        base_queries = {
            'fertilizer': f"What fertilizer and nutrients should I use for {crop_name} crop? Include organic options.",
            'disease': f"What are common diseases and pests affecting {crop_name} crops? How to prevent and treat them?",
            'irrigation': f"What is the best irrigation schedule and water management for {crop_name}?",
            'harvest': f"When and how should I harvest {crop_name} for best quality and yield?",
            'general': f"Provide comprehensive growing guide for {crop_name} in Indian conditions"
        }
        
        query = base_queries.get(query_type, base_queries['general'])
        
        if user_lang != 'en':
            query += f" Please respond in {lang_name} language only."
            
        return self.generate_response(query, user_lang)

    def chat(self, user_message: str, user_id=None):
        """Generate a response for a user message (main chat interface)"""
        try:
            # Detect language from user message
            detected_lang = self.detect_language(user_message)
            
            # Generate response in the same language
            result = self.generate_response(user_message, detected_lang)
            
            return {
                'success': True,
                'response': result.get('response', 'Unable to generate response'),
                'timestamp': result.get('timestamp', datetime.now().isoformat())
            }
        except Exception as e:
            print(f"Error in chat: {e}")
            return {
                'success': False,
                'response': 'An error occurred while processing your message',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

    def get_crop_recommendations(self, crop_type: str, location=None, season=None, user_id=None):
        """Get recommendations for a specific crop"""
        try:
            query = f"Provide recommendations for growing {crop_type}"
            if location:
                query += f" in {location}"
            if season:
                query += f" during {season}"
            
            result = self.generate_response(query)
            return {
                'success': True,
                'recommendations': result.get('response', ''),
                'timestamp': result.get('timestamp', datetime.now().isoformat())
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

    def get_conversation_summary(self, user_id: str):
        """Placeholder for conversation summary"""
        return {
            'success': True,
            'summary': 'Conversation summary not yet implemented',
            'user_id': user_id
        }

    def clear_history(self, user_id: str):
        """Placeholder for clearing conversation history"""
        return {
            'success': True,
            'message': 'History cleared',
            'user_id': user_id
        }


def create_chatbot_routes(*_args, **_kwargs):  # stub to satisfy import
    return None


__all__ = ["MultilingualAgriChatbot", "create_chatbot_routes"]
