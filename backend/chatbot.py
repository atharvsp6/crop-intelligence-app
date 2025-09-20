import google.generativeai as genai
import os
from datetime import datetime
import json

class CropChatbot:
    def __init__(self):
        self.api_key = os.environ.get('GEMINI_API_KEY')
        self.model = None
        self.conversation_history = []
        self.max_history = 10
        
        # Initialize Gemini if API key is available
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-pro')
            except Exception as e:
                print(f"Error initializing Gemini AI: {e}")
                self.model = None
        
        # System prompt for agriculture-focused responses
        self.system_prompt = """You are an AI agricultural assistant specializing in crop intelligence and farming advice. 
        You help farmers with:
        - Crop yield optimization
        - Disease identification and treatment
        - Soil management and fertilization
        - Irrigation and water management
        - Market trends and pricing
        - Seasonal planting advice
        - Pest management
        - Weather-related farming decisions
        - Sustainable and organic farming practices

        Provide practical, actionable advice. Always consider:
        - Local climate conditions when possible
        - Sustainable farming practices
        - Cost-effective solutions
        - Safety precautions for chemical use
        - Environmental impact

        Keep responses concise but comprehensive. If you don't have specific information, 
        suggest consulting local agricultural extension services."""
    
    def chat(self, user_message, context=None):
        """Process user message and return AI response"""
        try:
            if not self.model:
                return self._fallback_response(user_message)
            
            # Build conversation context
            full_prompt = self._build_prompt(user_message, context)
            
            # Generate response
            response = self.model.generate_content(full_prompt)
            
            if response.text:
                # Store in conversation history
                self._update_history(user_message, response.text)
                
                return {
                    'success': True,
                    'response': response.text,
                    'timestamp': datetime.utcnow().isoformat(),
                    'context_used': context is not None
                }
            else:
                return {
                    'success': False,
                    'error': 'No response generated',
                    'fallback_response': self._get_fallback_advice(user_message)
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'fallback_response': self._get_fallback_advice(user_message)
            }
    
    def get_crop_recommendations(self, crop_type, location=None, season=None):
        """Get specific crop recommendations"""
        try:
            prompt = f"""Provide detailed recommendations for growing {crop_type}"""
            
            if location:
                prompt += f" in {location}"
            if season:
                prompt += f" during {season} season"
            
            prompt += """. Include:
            1. Optimal planting conditions
            2. Soil requirements
            3. Irrigation schedule
            4. Fertilization program
            5. Common pests and diseases to watch for
            6. Harvesting timeline
            7. Expected yield estimates"""
            
            return self.chat(prompt, context={'type': 'crop_recommendation', 'crop': crop_type})
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def analyze_crop_problem(self, problem_description, crop_type=None, symptoms=None):
        """Analyze specific crop problems"""
        try:
            prompt = f"I'm having this problem with my crops: {problem_description}"
            
            if crop_type:
                prompt += f" The crop is {crop_type}."
            if symptoms:
                prompt += f" The symptoms I'm observing are: {symptoms}."
            
            prompt += """ Please help me identify the possible causes and suggest solutions. 
            Include immediate actions and long-term prevention strategies."""
            
            context = {
                'type': 'problem_analysis',
                'crop': crop_type,
                'symptoms': symptoms
            }
            
            return self.chat(prompt, context)
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_weather_advice(self, weather_conditions, crops=None):
        """Get advice based on weather conditions"""
        try:
            prompt = f"Given these weather conditions: {weather_conditions}, "
            
            if crops:
                if isinstance(crops, list):
                    crop_list = ', '.join(crops)
                else:
                    crop_list = crops
                prompt += f"what should I do to protect my {crop_list} crops? "
            else:
                prompt += "what general farming activities should I focus on? "
            
            prompt += "Provide specific actionable advice for the next few days and weeks."
            
            context = {
                'type': 'weather_advice',
                'weather': weather_conditions,
                'crops': crops
            }
            
            return self.chat(prompt, context)
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_market_advice(self, crop_type, current_prices=None, market_trends=None):
        """Get market and pricing advice"""
        try:
            prompt = f"I need advice about selling {crop_type}. "
            
            if current_prices:
                prompt += f"Current market price is {current_prices}. "
            if market_trends:
                prompt += f"Market trends show: {market_trends}. "
            
            prompt += """Should I sell now or wait? What factors should I consider? 
            Also suggest strategies to get better prices for my produce."""
            
            context = {
                'type': 'market_advice',
                'crop': crop_type,
                'prices': current_prices,
                'trends': market_trends
            }
            
            return self.chat(prompt, context)
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _build_prompt(self, user_message, context=None):
        """Build comprehensive prompt with system instructions and context"""
        prompt_parts = [self.system_prompt]
        
        # Add conversation history
        if self.conversation_history:
            prompt_parts.append("\nRecent conversation:")
            for entry in self.conversation_history[-3:]:  # Last 3 exchanges
                prompt_parts.append(f"User: {entry['user']}")
                prompt_parts.append(f"Assistant: {entry['assistant']}")
        
        # Add context if provided
        if context:
            prompt_parts.append(f"\nContext: {json.dumps(context)}")
        
        # Add current user message
        prompt_parts.append(f"\nUser: {user_message}")
        prompt_parts.append("\nAssistant:")
        
        return "\n".join(prompt_parts)
    
    def _update_history(self, user_message, ai_response):
        """Update conversation history"""
        self.conversation_history.append({
            'user': user_message,
            'assistant': ai_response,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # Keep only recent history
        if len(self.conversation_history) > self.max_history:
            self.conversation_history = self.conversation_history[-self.max_history:]
    
    def _fallback_response(self, user_message):
        """Provide fallback response when Gemini AI is not available"""
        return {
            'success': False,
            'error': 'AI service not available',
            'fallback_response': self._get_fallback_advice(user_message)
        }
    
    def _get_fallback_advice(self, user_message):
        """Generate basic fallback advice based on keywords"""
        message_lower = user_message.lower()
        
        # Keyword-based responses
        if any(word in message_lower for word in ['disease', 'pest', 'bug', 'insect']):
            return """For pest and disease management:
            1. Identify the specific pest or disease first
            2. Use integrated pest management (IPM) approaches
            3. Consider biological controls before chemicals
            4. Ensure proper crop rotation
            5. Maintain field hygiene
            6. Consult local agricultural extension services for specific treatment recommendations"""
        
        elif any(word in message_lower for word in ['fertilizer', 'nutrition', 'soil']):
            return """For soil and nutrition management:
            1. Test your soil pH and nutrient levels
            2. Use organic matter like compost when possible
            3. Follow recommended NPK ratios for your crop
            4. Consider micronutrient deficiencies
            5. Practice crop rotation to maintain soil health
            6. Avoid over-fertilization which can harm plants and environment"""
        
        elif any(word in message_lower for word in ['water', 'irrigation', 'drought']):
            return """For water and irrigation management:
            1. Monitor soil moisture levels regularly
            2. Water deeply but less frequently
            3. Use mulching to conserve moisture
            4. Consider drip irrigation for efficiency
            5. Adjust watering based on weather and crop growth stage
            6. Collect and use rainwater when possible"""
        
        elif any(word in message_lower for word in ['price', 'market', 'sell']):
            return """For marketing and pricing:
            1. Monitor local and regional market prices
            2. Consider value-added processing
            3. Explore direct marketing opportunities
            4. Time your sales based on seasonal demand
            5. Diversify your buyer base
            6. Consider forward contracts for price stability"""
        
        else:
            return """I'd be happy to help with your farming question! For the best advice, please:
            1. Be specific about your crop and location
            2. Describe your current situation in detail
            3. Mention what you've already tried
            4. Contact your local agricultural extension office for personalized guidance
            5. Consider joining local farmer groups for community support"""
    
    def clear_history(self):
        """Clear conversation history"""
        self.conversation_history = []
        return {'success': True, 'message': 'Conversation history cleared'}
    
    def get_conversation_summary(self):
        """Get summary of current conversation"""
        return {
            'success': True,
            'conversation_length': len(self.conversation_history),
            'last_interaction': self.conversation_history[-1]['timestamp'] if self.conversation_history else None,
            'topics_discussed': self._extract_topics_from_history()
        }
    
    def _extract_topics_from_history(self):
        """Extract main topics from conversation history"""
        topics = set()
        keywords_to_topics = {
            'disease': 'Plant Health',
            'pest': 'Pest Management',
            'fertilizer': 'Nutrition',
            'water': 'Irrigation',
            'price': 'Marketing',
            'soil': 'Soil Management',
            'weather': 'Weather Planning'
        }
        
        for entry in self.conversation_history:
            user_message = entry['user'].lower()
            for keyword, topic in keywords_to_topics.items():
                if keyword in user_message:
                    topics.add(topic)
        
        return list(topics)

# Initialize chatbot instance
crop_chatbot = CropChatbot()