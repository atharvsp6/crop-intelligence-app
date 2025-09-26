from datetime import datetime, timedelta
import random
import numpy as np
from database import get_collection
from market_data_service import market_data_service
import logging

class FinancialAnalyzer:
    def __init__(self):
        # Initialize logger
        self.logger = logging.getLogger(__name__)
        
        # Fallback prices in case all APIs fail (realistic 2024 prices per kg)
        self.fallback_prices = {
            # Indian market prices in INR per kg
            'IN': {
                'wheat': 22.50,   # ₹22.50/kg (realistic Indian wheat price)
                'rice': 28.00,    # ₹28.00/kg (realistic Indian rice price)  
                'corn': 19.50,    # ₹19.50/kg (realistic Indian maize price)
                'soybean': 42.00, # ₹42.00/kg (realistic Indian soybean price)
                'cotton': 65.00,  # ₹65.00/kg (realistic Indian cotton price)
                'turmeric': 85.00, # ₹85.00/kg
                'mustard': 51.00,  # ₹51.00/kg
                'cardamom': 1250.00, # ₹1250.00/kg
                'coriander': 72.00   # ₹72.00/kg
            },
            # US market prices in USD per kg
            'US': {
                'wheat': 0.52,   # $0.52/kg
                'rice': 0.78,    # $0.78/kg
                'corn': 0.42,    # $0.42/kg
                'soybean': 0.89, # $0.89/kg
                'cotton': 1.85   # $1.85/kg
            }
        }
        
        # Expected yields per acre (realistic USDA averages)
        self.typical_yields = {
            'wheat': 47.5,    # bushels/acre = ~2880 lbs/acre = ~1307 kg/acre
            'rice': 7400,     # lbs/acre = ~3357 kg/acre
            'corn': 172,      # bushels/acre = ~9632 lbs/acre = ~4370 kg/acre
            'soybean': 51.2,  # bushels/acre = ~3072 lbs/acre = ~1393 kg/acre
            'cotton': 836     # lbs/acre = ~379 kg/acre
        }
    
    def calculate_roi(self, crop_type, area_acres, expected_yield_per_acre, additional_costs=None, region='IN'):
        """Calculate Return on Investment using real market data (defaults to Indian market)"""
        try:
            # Get real-time market price (defaults to Indian markets)
            price_data = market_data_service.get_real_time_price(crop_type, region)
            
            if price_data:
                current_price = price_data['price']
                currency = price_data.get('currency', 'INR' if region == 'IN' else 'USD')
                self.logger.info(f"Using real-time price for {crop_type}: {current_price} {currency} from {price_data['source']}")
            else:
                # Fallback to realistic prices
                regional_fallbacks = self.fallback_prices.get(region, self.fallback_prices['IN'])
                current_price = regional_fallbacks.get(crop_type, 22.50)  # Default to wheat price
                currency = 'INR' if region == 'IN' else 'USD'
                self.logger.warning(f"Using fallback price for {crop_type}: {current_price} {currency}")
            
            # Get real production costs
            cost_data = market_data_service.get_production_costs(crop_type, region, area_acres)
            
            if cost_data and cost_data['success']:
                total_cost_per_acre = cost_data['total_cost_per_acre']
                cost_breakdown = cost_data['costs_per_acre']
                cost_currency = 'INR' if region == 'IN' else 'USD'
                self.logger.info(f"Using real cost data for {crop_type}: {total_cost_per_acre} {cost_currency}/acre")
            else:
                # Fallback to estimated costs
                total_cost_per_acre = self._get_fallback_costs(crop_type, region)
                cost_breakdown = self._get_fallback_cost_breakdown(crop_type, region)
                cost_currency = 'INR' if region == 'IN' else 'USD'
                self.logger.warning(f"Using fallback costs for {crop_type}: {total_cost_per_acre} {cost_currency}/acre")
            
            # Add any additional costs
            if additional_costs:
                additional_per_acre = sum(additional_costs.values()) / area_acres if area_acres > 0 else 0
                total_cost_per_acre += additional_per_acre
                cost_breakdown.update(additional_costs)
            
            total_investment = total_cost_per_acre * area_acres
            
            # Calculate revenue
            total_yield_kg = expected_yield_per_acre * area_acres
            total_revenue = total_yield_kg * current_price
            
            # Calculate ROI metrics
            net_profit = total_revenue - total_investment
            roi_percentage = (net_profit / total_investment) * 100 if total_investment > 0 else 0
            profit_per_acre = net_profit / area_acres if area_acres > 0 else 0
            
            # Break-even analysis
            breakeven_yield = total_investment / (current_price * area_acres) if area_acres > 0 and current_price > 0 else 0
            
            # Risk assessment based on real market volatility
            risk_level = self._assess_risk(crop_type, roi_percentage, price_data)
            
            return {
                'success': True,
                'financial_metrics': {
                    'total_investment': round(total_investment, 2),
                    'total_revenue': round(total_revenue, 2),
                    'net_profit': round(net_profit, 2),
                    'roi_percentage': round(roi_percentage, 2),
                    'profit_per_acre': round(profit_per_acre, 2),
                    'breakeven_yield_per_acre': round(breakeven_yield, 2),
                    'cost_per_kg_produced': round(total_investment / total_yield_kg, 4) if total_yield_kg > 0 else 0
                },
                'cost_breakdown': {k: round(v * area_acres, 2) for k, v in cost_breakdown.items()},
                'market_info': {
                    'current_price_per_kg': round(current_price, 4),
                    'currency': currency,
                    'price_source': price_data['source'] if price_data else 'fallback',
                    'price_change_24h': round(price_data.get('change', 0), 4) if price_data else 0,
                    'price_change_percent': round(price_data.get('change_percent', 0), 2) if price_data else 0,
                    'last_updated': price_data.get('timestamp') if price_data else datetime.utcnow().isoformat(),
                    'market': price_data.get('market', f'{region} Market') if price_data else f'{region} Market',
                    'exchange': price_data.get('exchange', 'Estimated') if price_data else 'Estimated'
                },
                'risk_assessment': risk_level,
                'recommendations': self._get_financial_recommendations(roi_percentage, risk_level, crop_type)
            }
            
        except Exception as e:
            self.logger.error(f"Error calculating ROI: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_market_trends(self, crop_type=None, days=30):
        """Get real market trends and price history"""
        try:
            crops = [crop_type] if crop_type else ['wheat', 'corn', 'rice', 'soybean', 'cotton']
            trends_data = {}
            
            for crop in crops:
                # Get real-time price
                current_price_data = market_data_service.get_real_time_price(crop)
                
                # Get historical data
                historical_data = market_data_service.get_historical_prices(crop, days)
                
                if current_price_data and historical_data:
                    current_price = current_price_data['price']
                    price_history = historical_data
                    
                    trends_data[crop] = {
                        'price_history': price_history,
                        'current_price': round(current_price, 4),
                        'price_change_24h': round(current_price_data.get('change', 0), 4),
                        'price_change_percentage': round(current_price_data.get('change_percent', 0), 2),
                        'data_source': current_price_data['source'],
                        'volatility': self._calculate_volatility(price_history),
                        'support_level': round(min([p['price'] for p in price_history[-7:]]), 4),
                        'resistance_level': round(max([p['price'] for p in price_history[-7:]]), 4),
                        'trend_direction': self._analyze_trend(price_history),
                        'ma_7_day': self._calculate_moving_average(price_history, 7),
                        'ma_30_day': self._calculate_moving_average(price_history, 30) if len(price_history) >= 30 else None,
                        'last_updated': current_price_data.get('timestamp', datetime.utcnow().isoformat())
                    }
                else:
                    # Fallback data
                    self.logger.warning(f"Using fallback data for {crop} market trends")
                    fallback_price = self.fallback_prices.get(crop, 0.5)
                    trends_data[crop] = {
                        'current_price': fallback_price,
                        'data_source': 'fallback',
                        'trend_direction': 'stable',
                        'last_updated': datetime.utcnow().isoformat(),
                        'note': 'Real-time data unavailable, using fallback prices'
                    }
            
            return {
                'success': True,
                'market_trends': trends_data,
                'market_summary': self._generate_market_summary(trends_data),
                'data_freshness': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error getting market trends: {e}")
            return {'success': False, 'error': str(e)}
    
    def _get_fallback_costs(self, crop_type, region='IN'):
        """Fallback production costs based on regional agricultural data"""
        if region == 'IN':
            # Indian costs per acre in INR
            costs = {
                'wheat': 62500,   # ₹/acre
                'rice': 78000,    # ₹/acre
                'corn': 58000,    # ₹/acre
                'soybean': 52000, # ₹/acre
                'cotton': 105000, # ₹/acre
                'turmeric': 126000, # ₹/acre
                'mustard': 42000,   # ₹/acre
            }
        else:
            # US costs per acre in USD (original data)
            costs = {
                'wheat': 497.8,   # $/acre
                'rice': 929.1,    # $/acre
                'corn': 762.4,    # $/acre
                'soybean': 521.1, # $/acre
                'cotton': 1047.7  # $/acre
            }
        return costs.get(crop_type, costs.get('wheat', 500))
    
    def _get_fallback_cost_breakdown(self, crop_type, region='IN'):
        """Fallback cost breakdown per acre"""
        if region == 'IN':
            # Indian cost breakdown in INR per acre
            breakdown = {
                'wheat': {
                    'seed': 3800, 'fertilizer': 8500, 'chemicals': 2800, 
                    'fuel': 4200, 'repairs': 2100, 'labor': 12000,
                    'land_rent': 15000, 'insurance': 800, 'interest': 2500,
                    'irrigation': 3500
                },
                'rice': {
                    'seed': 4200, 'fertilizer': 12000, 'chemicals': 4500,
                    'fuel': 5500, 'repairs': 3200, 'labor': 18000,
                    'land_rent': 18000, 'insurance': 1200, 'interest': 3800,
                    'irrigation': 8000
                },
                'corn': {
                    'seed': 3500, 'fertilizer': 9500, 'chemicals': 3200,
                    'fuel': 4000, 'repairs': 2800, 'labor': 14000,
                    'land_rent': 16000, 'insurance': 900, 'interest': 3000,
                    'irrigation': 4500
                },
                'soybean': {
                    'seed': 4800, 'fertilizer': 6500, 'chemicals': 4200,
                    'fuel': 3800, 'repairs': 2500, 'labor': 11000,
                    'land_rent': 14000, 'insurance': 1000, 'interest': 2800,
                    'irrigation': 3000
                },
                'cotton': {
                    'seed': 6500, 'fertilizer': 15000, 'chemicals': 12000,
                    'fuel': 6000, 'repairs': 4200, 'labor': 25000,
                    'land_rent': 20000, 'insurance': 2000, 'interest': 4500,
                    'irrigation': 10000
                },
                'turmeric': {
                    'seed': 8000, 'fertilizer': 18000, 'chemicals': 8500,
                    'fuel': 5000, 'repairs': 3500, 'labor': 35000,
                    'land_rent': 25000, 'insurance': 1500, 'interest': 5000,
                    'irrigation': 12000
                },
                'mustard': {
                    'seed': 2800, 'fertilizer': 7500, 'chemicals': 2500,
                    'fuel': 3500, 'repairs': 2000, 'labor': 9000,
                    'land_rent': 12000, 'insurance': 700, 'interest': 2200,
                    'irrigation': 2500
                }
            }
        else:
            # US cost breakdown in USD per acre (original data)
            breakdown = {
                'wheat': {
                    'seed': 45.2, 'fertilizer': 89.5, 'chemicals': 38.7, 
                    'fuel': 42.3, 'repairs': 28.9, 'labor': 78.4,
                    'land_rent': 125.6, 'insurance': 15.8, 'interest': 33.4
                },
                'rice': {
                    'seed': 92.4, 'fertilizer': 178.6, 'chemicals': 89.3,
                    'fuel': 78.5, 'repairs': 65.2, 'labor': 145.7,
                    'land_rent': 198.4, 'insurance': 28.9, 'interest': 52.3
                },
                'corn': {
                    'seed': 118.7, 'fertilizer': 156.3, 'chemicals': 54.2,
                    'fuel': 55.8, 'repairs': 42.1, 'labor': 89.5,
                    'land_rent': 178.9, 'insurance': 21.4, 'interest': 45.7
                },
                'soybean': {
                    'seed': 87.3, 'fertilizer': 23.8, 'chemicals': 67.9,
                    'fuel': 38.2, 'repairs': 35.7, 'labor': 65.4,
                    'land_rent': 145.3, 'insurance': 18.6, 'interest': 38.9
                },
                'cotton': {
                    'seed': 156.8, 'fertilizer': 134.7, 'chemicals': 178.9,
                    'fuel': 89.4, 'repairs': 78.6, 'labor': 198.5,
                    'land_rent': 165.7, 'insurance': 45.8, 'interest': 67.9
                }
            }
        return breakdown.get(crop_type, breakdown.get('wheat', {}))
    
    def _calculate_volatility(self, price_history):
        """Calculate price volatility from historical data"""
        if len(price_history) < 2:
            return 0
        
        prices = [p['price'] for p in price_history]
        returns = [(prices[i] - prices[i-1]) / prices[i-1] for i in range(1, len(prices))]
        return round(np.std(returns) * np.sqrt(252), 4)  # Annualized volatility
    
    def _calculate_moving_average(self, price_history, window):
        """Calculate moving average"""
        if len(price_history) < window:
            return None
        
        recent_prices = [p['price'] for p in price_history[-window:]]
        return round(sum(recent_prices) / len(recent_prices), 4)
    
    def _analyze_trend(self, price_history):
        """Analyze price trend direction using real data"""
        if len(price_history) < 5:
            return 'insufficient_data'
        
        recent_prices = [p['price'] for p in price_history[-5:]]
        
        # Simple trend analysis
        if recent_prices[-1] > recent_prices[0] * 1.02:  # 2% threshold
            return 'upward'
        elif recent_prices[-1] < recent_prices[0] * 0.98:
            return 'downward'
        else:
            return 'stable'
    
    def _assess_risk(self, crop_type, roi_percentage, price_data=None):
        """Assess investment risk based on real market data"""
        risk_factors = {
            'roi_risk': 'low' if roi_percentage > 20 else 'medium' if roi_percentage > 10 else 'high',
            'market_risk': 'low'  # Default
        }
        
        # Add market volatility risk if available
        if price_data:
            change_percent = abs(price_data.get('change_percent', 0))
            if change_percent > 5:
                risk_factors['market_risk'] = 'high'
            elif change_percent > 2:
                risk_factors['market_risk'] = 'medium'
        
        # Determine overall risk
        if risk_factors['roi_risk'] == 'high' or risk_factors['market_risk'] == 'high':
            overall_risk = 'high'
        elif risk_factors['roi_risk'] == 'medium' or risk_factors['market_risk'] == 'medium':
            overall_risk = 'medium'
        else:
            overall_risk = 'low'
        
        return {
            'overall_risk': overall_risk,
            'risk_factors': risk_factors,
            'recommendation': self._get_risk_recommendation(overall_risk)
        }
    
    def _get_risk_recommendation(self, risk_level):
        """Get risk-based recommendations"""
        recommendations = {
            'low': 'Favorable conditions for investment. Consider expanding cultivation area.',
            'medium': 'Moderate risk. Consider hedging strategies or smaller initial investment.',
            'high': 'High risk detected. Consider waiting for better market conditions or diversifying crops.'
        }
        return recommendations.get(risk_level, 'Unable to assess risk')
    
    def _get_financial_recommendations(self, roi_percentage, risk_assessment, crop_type):
        """Generate financial recommendations based on real data"""
        recommendations = []
        
        if roi_percentage > 25:
            recommendations.append("Excellent ROI potential. Consider maximizing cultivation area.")
        elif roi_percentage > 15:
            recommendations.append("Good ROI expected. Proceed with planned investment.")
        elif roi_percentage > 5:
            recommendations.append("Moderate returns expected. Consider cost optimization strategies.")
        else:
            recommendations.append("Low returns projected. Review market conditions before investing.")
        
        # Risk-based recommendations
        if risk_assessment['overall_risk'] == 'high':
            recommendations.append("High market volatility detected. Consider diversification or smaller scale.")
        
        # Crop-specific recommendations
        if crop_type in ['cotton', 'rice']:
            recommendations.append(f"{crop_type.title()} requires higher capital investment but offers premium pricing.")
        
        return recommendations
    
    def _generate_market_summary(self, trends_data):
        """Generate market summary from real data"""
        if not trends_data:
            return "Market data unavailable"
        
        total_crops = len(trends_data)
        upward_trends = sum(1 for data in trends_data.values() 
                          if data.get('trend_direction') == 'upward')
        
        if upward_trends > total_crops * 0.6:
            market_sentiment = "bullish"
        elif upward_trends < total_crops * 0.3:
            market_sentiment = "bearish"
        else:
            market_sentiment = "mixed"
        
        # Find best and worst performers
        price_changes = {crop: data.get('price_change_percentage', 0) 
                        for crop, data in trends_data.items()}
        
        best_performer = max(price_changes.keys(), key=lambda k: price_changes[k]) if price_changes else None
        worst_performer = min(price_changes.keys(), key=lambda k: price_changes[k]) if price_changes else None
        
        return {
            'market_sentiment': market_sentiment,
            'total_commodities_tracked': total_crops,
            'upward_trending': upward_trends,
            'best_performer': best_performer,
            'worst_performer': worst_performer,
            'summary': f"Market shows {market_sentiment} sentiment with {upward_trends}/{total_crops} commodities trending upward."
        }


# Initialize financial analyzer
financial_analyzer = FinancialAnalyzer()