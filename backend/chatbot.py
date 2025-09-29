import os
from datetime import datetime
from typing import Any, Dict, Optional

import google.generativeai as genai

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

    def _build_context_block(self, context: Optional[Dict[str, Any]]) -> str:
        if not context:
            return (
                "No crop prediction is available yet. Offer friendly, general guidance and encourage the farmer to run "
                "a crop yield prediction inside the Crop Intelligence app for personalised insights."
            )

        summary_lines = [str(line).strip() for line in context.get('summaryLines', []) if str(line).strip()]
        recommendation_highlights = [
            str(item).strip() for item in context.get('recommendationHighlights', []) if str(item).strip()
        ]

        summary_block = '\n'.join(summary_lines) if summary_lines else 'Farmer details are limited.'
        recommendations_block = (
            '\n'.join(f"{idx + 1}. {item}" for idx, item in enumerate(recommendation_highlights))
            if recommendation_highlights
            else 'No AI recommendations were generated yet. Suggest practical next steps based on common agronomy best practices.'
        )

        return f"Prediction snapshot:\n{summary_block}\n\nKey recommendations:\n{recommendations_block}"

    def chat(
        self,
        user_message: str,
        user_id: Optional[str] = None,
        *,
        context: Optional[Dict[str, Any]] = None,
        language_hint: Optional[str] = None,
        prediction_ready: bool = False,
    ) -> Dict[str, Any]:
        try:
            cleaned_message = (user_message or '').strip()
            if not cleaned_message:
                return {
                    'success': False,
                    'response': 'Please provide a question for the assistant to answer.',
                    'timestamp': datetime.utcnow().isoformat(),
                }

            session_id = f'session_{user_id or "anon"}_{datetime.now().strftime("%Y%m%d")}'

            if not self.model:
                return {
                    'success': False,
                    'response': 'The AI assistant is temporarily unavailable. Please try again in a few minutes.',
                    'timestamp': datetime.utcnow().isoformat(),
                }

            language_hint_text = (
                f'The on-screen recommendations were generated using the language code "{language_hint}". '
                'Prefer responding in that language using simple, farmer-friendly words.'
                if language_hint
                else ''
            )

            context_block = self._build_context_block(context)
            prediction_status = (
                'The prediction is already complete. Use its numbers when sharing advice.'
                if prediction_ready
                else 'A crop prediction has not been run yet. Share generally helpful advice and encourage running the prediction feature next.'
            )

            guidelines = (
                "Guidelines:\n"
                "- Always reference the farmer's prediction context when it exists.\n"
                "- Break the answer into short paragraphs with a friendly tone.\n"
                "- Highlight 2-4 specific next actions as bullet points using clear agricultural language.\n"
                "- If the farmer speaks in Hindi or another Indian language, reply in the same language using easy words.\n"
                "- Keep recommendations realistic for smallholder farmers and mention follow-up resources when helpful."
            )

            prompt = (
                "You are a patient agricultural advisor helping Indian smallholder farmers get more value from the Crop Intelligence app.\n"
                f"{language_hint_text}\n"
                f"{prediction_status}\n\n"
                f"Context about the farmer's latest crop prediction:\n{context_block}\n\n"
                "Farmer's question (respond in the same language as the farmer or Hindi if unclear):\n"
                f"\"\"\"{cleaned_message}\"\"\"\n\n"
                f"{guidelines}"
            )

            response = self.model.generate_content(
                contents=[
                    {
                        'role': 'user',
                        'parts': [
                            {
                                'text': prompt,
                            }
                        ],
                    }
                ]
            )

            ai_response = response.text if response and getattr(response, 'text', None) else None

            if not ai_response:
                ai_response = (
                    "I'm having trouble fetching a detailed answer right now. Please try again in a moment or rephrase your question."
                )

            # Optional: store chat session details for analytics / auditing
            if self.chat_sessions_collection is not None:
                try:
                    self.chat_sessions_collection.insert_one(
                        {
                            'session_id': session_id,
                            'user_id': user_id,
                            'timestamp': datetime.utcnow(),
                            'question': cleaned_message,
                            'answer': ai_response,
                            'context': context or {},
                            'language_hint': language_hint,
                            'prediction_ready': prediction_ready,
                        }
                    )
                except Exception:
                    # Avoid breaking the response pipeline if Mongo is unavailable
                    pass

            return {
                'success': True,
                'response': ai_response,
                'timestamp': datetime.utcnow().isoformat(),
            }

        except Exception as e:
            return {
                'success': False,
                'response': f'Error: {str(e)}',
                'timestamp': datetime.utcnow().isoformat(),
            }

crop_chatbot = CropChatbot()
