"""Backend-local multilingual chatbot implementation.
Avoids recursive self-import issues under Python 3.13 when root project file name matches.
Provides the symbols expected by app_integrated: MultilingualAgriChatbot, create_chatbot_routes.
"""

import google.generativeai as genai
from googletrans import Translator
from datetime import datetime


class MultilingualAgriChatbot:
    def __init__(self, gemini_api_key: str):
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        self.translator = Translator()
        self.supported_languages = {
            'hi': 'Hindi', 'mr': 'Marathi', 'ta': 'Tamil', 'te': 'Telugu',
            'gu': 'Gujarati', 'bn': 'Bengali', 'en': 'English'
        }
        self.agri_terms = {'en': {'crop': 'crop', 'fertilizer': 'fertilizer'}}

    def detect_language(self, text: str) -> str:
        try:
            d = self.translator.detect(text)
            lang = getattr(d, 'lang', 'en')
            return lang if lang in self.supported_languages else 'en'
        except Exception:
            return 'en'

    def translate_text(self, text: str, target_lang='en', source_lang='auto'):
        try:
            if source_lang == target_lang:
                return text
            return self.translator.translate(text, dest=target_lang, src=source_lang).text
        except Exception:
            return text

    def get_agricultural_context(self, query: str, user_lang='en'):
        return (
            f"You are an expert agricultural advisor for Indian farmers. Respond in {user_lang}.\n"
            f"Query: {query}\n"
            "Provide practical, sustainable, smallholder-friendly advice."
        )

    def generate_response(self, user_query: str, user_lang='en'):
        try:
            prompt = self.get_agricultural_context(user_query, user_lang)
            if user_lang != 'en':
                prompt += f"\nRespond only in {user_lang} without repeating characters."
            resp = self.model.generate_content(prompt)
            ans = resp.text
            import re as _re
            ans = _re.sub(r'([\u0900-\u097F\w])\1{2,}', r'\1\1', ans)
            # If still English but user wanted other lang, attempt translation
            if user_lang != 'en' and _re.search(r'[A-Za-z]', ans) and not _re.search(r'[\u0900-\u097F]', ans):
                try:
                    ans = self.translate_text(ans, user_lang, 'en')
                    ans = _re.sub(r'([\u0900-\u097F\w])\1{2,}', r'\1\1', ans)
                except Exception:
                    pass
            return {'response': ans.strip(), 'detected_language': user_lang, 'original_query': user_query, 'timestamp': datetime.now().isoformat()}
        except Exception as e:
            return {'response': 'Service error', 'error': str(e), 'detected_language': user_lang, 'timestamp': datetime.now().isoformat()}

    def get_crop_specific_advice(self, crop_name: str, query_type: str, user_lang='en'):
        base = {
            'fertilizer': f"What fertilizer should I use for {crop_name}?",
            'disease': f"Common diseases for {crop_name} and prevention?",
            'irrigation': f"Irrigation schedule guidance for {crop_name}.",
            'harvest': f"Harvest timing and method for {crop_name}."
        }
        query = base.get(query_type, f"General guidance for growing {crop_name} in India")
        return self.generate_response(query, user_lang)


def create_chatbot_routes(*_args, **_kwargs):  # stub to satisfy import
    return None


__all__ = ["MultilingualAgriChatbot", "create_chatbot_routes"]
