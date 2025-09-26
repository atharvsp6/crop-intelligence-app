import requests
import os
from datetime import datetime, timedelta
from database import get_collection

class WeatherService:
    def __init__(self):
        self.api_key = os.environ.get('OPENWEATHER_API_KEY')
        self.base_url = "https://api.openweathermap.org/data/2.5"
        self.weather_collection = get_collection('weather_cache')
        self.cache_duration_hours = 1  # Cache weather data for 1 hour
    
    def get_coordinates_by_city(self, city_name):
        """Get latitude and longitude for a city"""
        try:
            if not self.api_key:
                return {'success': False, 'error': 'OpenWeather API key not configured'}
            
            geo_url = f"http://api.openweathermap.org/geo/1.0/direct"
            params = {
                'q': city_name,
                'limit': 1,
                'appid': self.api_key
            }
            
            response = requests.get(geo_url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data:
                    location = data[0]
                    return {
                        'success': True,
                        'coordinates': {
                            'lat': location['lat'],
                            'lon': location['lon'],
                            'name': location['name'],
                            'country': location['country']
                        }
                    }
                else:
                    return {'success': False, 'error': 'City not found'}
            else:
                return {'success': False, 'error': 'Failed to fetch coordinates'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_current_weather(self, lat, lon, location_name=None):
        """Get current weather data"""
        try:
            if not self.api_key:
                return self._fallback_weather_data(location_name)
            
            # Check cache first
            cache_key = f"current_{lat}_{lon}"
            cached_data = self._get_cached_weather(cache_key)
            if cached_data:
                return cached_data
            
            url = f"{self.base_url}/weather"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.api_key,
                'units': 'metric'
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                weather_data = {
                    'success': True,
                    'location': {
                        'name': location_name or data.get('name', 'Unknown'),
                        'country': data.get('sys', {}).get('country', ''),
                        'coordinates': {'lat': lat, 'lon': lon}
                    },
                    'current': {
                        'temperature': round(data['main']['temp'], 1),
                        'feels_like': round(data['main']['feels_like'], 1),
                        'humidity': data['main']['humidity'],
                        'pressure': data['main']['pressure'],
                        'description': data['weather'][0]['description'].title(),
                        'main': data['weather'][0]['main'],
                        'icon': data['weather'][0]['icon'],
                        'wind_speed': data.get('wind', {}).get('speed', 0),
                        'wind_direction': data.get('wind', {}).get('deg', 0),
                        'visibility': data.get('visibility', 0) / 1000,  # Convert to km
                        'uv_index': None  # Not available in current weather endpoint
                    },
                    'sun': {
                        'sunrise': datetime.fromtimestamp(data['sys']['sunrise']).strftime('%H:%M'),
                        'sunset': datetime.fromtimestamp(data['sys']['sunset']).strftime('%H:%M')
                    },
                    'timestamp': datetime.utcnow().isoformat()
                }
                
                # Add farming-specific advice
                weather_data['farming_advice'] = self._get_farming_advice(weather_data['current'])
                
                # Cache the data
                self._cache_weather_data(cache_key, weather_data)
                
                return weather_data
            else:
                return {'success': False, 'error': 'Failed to fetch weather data'}
                
        except Exception as e:
            return self._fallback_weather_data(location_name, str(e))
    
    def get_weather_forecast(self, lat, lon, location_name=None):
        """Get 5-day weather forecast"""
        try:
            if not self.api_key:
                return self._fallback_forecast_data(location_name)
            
            # Check cache first
            cache_key = f"forecast_{lat}_{lon}"
            cached_data = self._get_cached_weather(cache_key)
            if cached_data:
                return cached_data
            
            url = f"{self.base_url}/forecast"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.api_key,
                'units': 'metric'
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                forecast_data = {
                    'success': True,
                    'location': {
                        'name': location_name or data['city']['name'],
                        'country': data['city']['country'],
                        'coordinates': {'lat': lat, 'lon': lon}
                    },
                    'forecast': []
                }
                
                # Process forecast data (every 3 hours for 5 days)
                for item in data['list']:
                    forecast_item = {
                        'datetime': datetime.fromtimestamp(item['dt']).strftime('%Y-%m-%d %H:%M'),
                        'date': datetime.fromtimestamp(item['dt']).strftime('%Y-%m-%d'),
                        'time': datetime.fromtimestamp(item['dt']).strftime('%H:%M'),
                        'temperature': round(item['main']['temp'], 1),
                        'feels_like': round(item['main']['feels_like'], 1),
                        'humidity': item['main']['humidity'],
                        'description': item['weather'][0]['description'].title(),
                        'main': item['weather'][0]['main'],
                        'icon': item['weather'][0]['icon'],
                        'wind_speed': item.get('wind', {}).get('speed', 0),
                        'rain': item.get('rain', {}).get('3h', 0),
                        'probability_of_precipitation': item.get('pop', 0) * 100
                    }
                    forecast_data['forecast'].append(forecast_item)
                
                # Add daily summaries
                forecast_data['daily_summary'] = self._create_daily_summary(forecast_data['forecast'])
                
                # Cache the data
                self._cache_weather_data(cache_key, forecast_data)
                
                return forecast_data
            else:
                return {'success': False, 'error': 'Failed to fetch forecast data'}
                
        except Exception as e:
            return self._fallback_forecast_data(location_name, str(e))
    
    def get_agricultural_alerts(self, lat, lon):
        """Get weather alerts relevant to agriculture"""
        try:
            if not self.api_key:
                return {'success': True, 'alerts': []}
            
            url = f"{self.base_url}/onecall"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.api_key,
                'exclude': 'minutely,hourly',
                'units': 'metric'
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                alerts = []
                
                # Check for weather alerts from API
                if 'alerts' in data:
                    for alert in data['alerts']:
                        alerts.append({
                            'type': 'weather_alert',
                            'title': alert.get('event', 'Weather Alert'),
                            'description': alert.get('description', ''),
                            'start': datetime.fromtimestamp(alert['start']).isoformat(),
                            'end': datetime.fromtimestamp(alert['end']).isoformat(),
                            'severity': 'high'
                        })
                
                # Generate agriculture-specific alerts based on current conditions
                current_weather = data.get('current', {})
                agricultural_alerts = self._generate_agricultural_alerts(current_weather)
                alerts.extend(agricultural_alerts)
                
                return {'success': True, 'alerts': alerts}
            else:
                return {'success': True, 'alerts': []}
                
        except Exception as e:
            return {'success': True, 'alerts': []}
    
    def _get_farming_advice(self, weather_data):
        """Generate farming advice based on current weather"""
        advice = []
        
        temp = weather_data['temperature']
        humidity = weather_data['humidity']
        main_weather = weather_data['main'].lower()
        
        # Temperature-based advice
        if temp > 30:
            advice.append("High temperature: Increase irrigation frequency and provide shade for sensitive crops")
        elif temp < 10:
            advice.append("Low temperature: Protect crops from frost, consider row covers or greenhouse protection")
        
        # Humidity-based advice
        if humidity > 80:
            advice.append("High humidity: Watch for fungal diseases, ensure good air circulation")
        elif humidity < 40:
            advice.append("Low humidity: Monitor soil moisture levels more frequently")
        
        # Weather condition-based advice
        if 'rain' in main_weather:
            advice.append("Rainy conditions: Postpone spraying activities, ensure proper drainage")
        elif main_weather == 'clear':
            advice.append("Clear weather: Good conditions for field work and harvesting")
        elif 'cloud' in main_weather:
            advice.append("Cloudy conditions: Reduced evaporation, adjust irrigation schedule")
        
        return advice if advice else ["Current weather conditions are suitable for general farm activities"]
    
    def _generate_agricultural_alerts(self, weather_data):
        """Generate agriculture-specific alerts"""
        alerts = []
        
        temp = weather_data.get('temp', 0)
        humidity = weather_data.get('humidity', 0)
        wind_speed = weather_data.get('wind_speed', 0)
        
        # Frost warning
        if temp <= 2:
            alerts.append({
                'type': 'frost_warning',
                'title': 'Frost Warning',
                'description': 'Temperature near freezing. Protect sensitive crops and livestock.',
                'severity': 'high'
            })
        
        # Heat stress warning
        if temp >= 35:
            alerts.append({
                'type': 'heat_warning',
                'title': 'Heat Stress Warning',
                'description': 'Extremely high temperatures. Increase irrigation and provide shade.',
                'severity': 'medium'
            })
        
        # High wind warning
        if wind_speed > 10:  # m/s
            alerts.append({
                'type': 'wind_warning',
                'title': 'High Wind Alert',
                'description': 'Strong winds may damage crops. Secure loose materials.',
                'severity': 'medium'
            })
        
        # Disease risk
        if humidity > 85 and temp > 20:
            alerts.append({
                'type': 'disease_risk',
                'title': 'Disease Risk Alert',
                'description': 'High humidity and temperature create conditions favorable for plant diseases.',
                'severity': 'low'
            })
        
        return alerts
    
    def _create_daily_summary(self, forecast_list):
        """Create daily summary from hourly forecast"""
        daily_data = {}
        
        for item in forecast_list:
            date = item['date']
            if date not in daily_data:
                daily_data[date] = {
                    'date': date,
                    'temperatures': [],
                    'humidity': [],
                    'rain': 0,
                    'conditions': []
                }
            
            daily_data[date]['temperatures'].append(item['temperature'])
            daily_data[date]['humidity'].append(item['humidity'])
            daily_data[date]['rain'] += item['rain']
            daily_data[date]['conditions'].append(item['main'])
        
        # Process daily summaries
        daily_summary = []
        for date, data in daily_data.items():
            summary = {
                'date': date,
                'min_temp': round(min(data['temperatures']), 1),
                'max_temp': round(max(data['temperatures']), 1),
                'avg_humidity': round(sum(data['humidity']) / len(data['humidity']), 1),
                'total_rain': round(data['rain'], 1),
                'main_condition': max(set(data['conditions']), key=data['conditions'].count)
            }
            daily_summary.append(summary)
        
        return daily_summary
    
    def _get_cached_weather(self, cache_key):
        """Get cached weather data if still valid"""
        try:
            cached = self.weather_collection.find_one({'cache_key': cache_key})
            if cached:
                cache_time = cached['timestamp']
                if datetime.utcnow() - cache_time < timedelta(hours=self.cache_duration_hours):
                    data = cached['data']
                    data['cached'] = True
                    return data
            return None
        except:
            return None
    
    def _cache_weather_data(self, cache_key, data):
        """Cache weather data"""
        try:
            self.weather_collection.replace_one(
                {'cache_key': cache_key},
                {
                    'cache_key': cache_key,
                    'data': data,
                    'timestamp': datetime.utcnow()
                },
                upsert=True
            )
        except:
            pass  # Cache failure shouldn't break the functionality
    
    def _fallback_weather_data(self, location_name=None, error=None):
        """Fallback weather data when API is unavailable"""
        return {
            'success': True,
            'fallback': True,
            'location': {
                'name': location_name or 'Unknown Location',
                'country': '',
                'coordinates': {'lat': 0, 'lon': 0}
            },
            'current': {
                'temperature': 22.0,
                'feels_like': 24.0,
                'humidity': 65,
                'pressure': 1013,
                'description': 'Moderate Conditions',
                'main': 'Clear',
                'icon': '01d',
                'wind_speed': 2.5,
                'wind_direction': 180,
                'visibility': 10.0
            },
            'sun': {
                'sunrise': '06:30',
                'sunset': '18:45'
            },
            'farming_advice': [
                'Weather data temporarily unavailable',
                'Monitor local conditions and follow standard farming practices',
                'Check local weather services for updates'
            ],
            'timestamp': datetime.utcnow().isoformat(),
            'error_message': error if error else 'OpenWeather API key not configured'
        }
    
    def _fallback_forecast_data(self, location_name=None, error=None):
        """Fallback forecast data when API is unavailable"""
        return {
            'success': True,
            'fallback': True,
            'location': {
                'name': location_name or 'Unknown Location',
                'country': '',
                'coordinates': {'lat': 0, 'lon': 0}
            },
            'forecast': [],
            'daily_summary': [],
            'error_message': error if error else 'OpenWeather API key not configured'
        }

# Initialize weather service instance
weather_service = WeatherService()