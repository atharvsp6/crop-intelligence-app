from datetime import datetime, timedelta
import random
import numpy as np
from database import get_collection

class FinancialAnalyzer:
    def __init__(self):
        self.crop_prices = {
            'wheat': {'base_price': 25.50, 'volatility': 0.1},
            'rice': {'base_price': 32.00, 'volatility': 0.12},
            'corn': {'base_price': 28.75, 'volatility': 0.08},
            'soybean': {'base_price': 45.00, 'volatility': 0.15},
            'cotton': {'base_price': 52.00, 'volatility': 0.18}
        }
        
        self.cost_factors = {
            'wheat': {'seed': 800, 'fertilizer': 1200, 'labor': 2000, 'irrigation': 600, 'pesticides': 400},
            'rice': {'seed': 1000, 'fertilizer': 1500, 'labor': 2500, 'irrigation': 1200, 'pesticides': 600},
            'corn': {'seed': 900, 'fertilizer': 1300, 'labor': 2200, 'irrigation': 800, 'pesticides': 500},
            'soybean': {'seed': 1200, 'fertilizer': 1000, 'labor': 1800, 'irrigation': 700, 'pesticides': 400},
            'cotton': {'seed': 1500, 'fertilizer': 1800, 'labor': 3000, 'irrigation': 1500, 'pesticides': 800}
        }
    
    def calculate_roi(self, crop_type, area_acres, expected_yield_per_acre, additional_costs=None):
        """Calculate Return on Investment for crop cultivation"""
        try:
            if crop_type not in self.crop_prices:
                return {'success': False, 'error': f'Crop type {crop_type} not supported'}
            
            # Get current market price
            current_price = self._get_current_price(crop_type)
            
            # Calculate costs
            base_costs = self.cost_factors.get(crop_type, self.cost_factors['wheat'])
            total_cost_per_acre = sum(base_costs.values())
            
            if additional_costs:
                total_cost_per_acre += sum(additional_costs.values())
            
            total_investment = total_cost_per_acre * area_acres
            
            # Calculate revenue
            total_yield = expected_yield_per_acre * area_acres
            total_revenue = total_yield * current_price
            
            # Calculate ROI metrics
            net_profit = total_revenue - total_investment
            roi_percentage = (net_profit / total_investment) * 100 if total_investment > 0 else 0
            profit_per_acre = net_profit / area_acres if area_acres > 0 else 0
            
            # Break-even analysis
            breakeven_yield = total_investment / (current_price * area_acres) if area_acres > 0 and current_price > 0 else 0
            
            # Risk assessment
            risk_level = self._assess_risk(crop_type, roi_percentage)
            
            return {
                'success': True,
                'financial_metrics': {
                    'total_investment': round(total_investment, 2),
                    'total_revenue': round(total_revenue, 2),
                    'net_profit': round(net_profit, 2),
                    'roi_percentage': round(roi_percentage, 2),
                    'profit_per_acre': round(profit_per_acre, 2),
                    'breakeven_yield_per_acre': round(breakeven_yield, 2)
                },
                'cost_breakdown': {k: v * area_acres for k, v in base_costs.items()},
                'market_info': {
                    'current_price_per_kg': current_price,
                    'price_trend': self._get_price_trend(crop_type),
                    'market_volatility': self.crop_prices[crop_type]['volatility']
                },
                'risk_assessment': risk_level,
                'recommendations': self._get_financial_recommendations(roi_percentage, risk_level)
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_market_trends(self, crop_type=None, days=30):
        """Get market trends and price history"""
        try:
            if crop_type and crop_type not in self.crop_prices:
                return {'success': False, 'error': f'Crop type {crop_type} not supported'}
            
            crops = [crop_type] if crop_type else list(self.crop_prices.keys())
            trends_data = {}
            
            for crop in crops:
                price_history = self._generate_price_history(crop, days)
                trends_data[crop] = {
                    'price_history': price_history,
                    'current_price': price_history[-1]['price'],
                    'price_change_percentage': self._calculate_price_change(price_history),
                    'volatility': self.crop_prices[crop]['volatility'],
                    'support_level': min([p['price'] for p in price_history[-7:]]),
                    'resistance_level': max([p['price'] for p in price_history[-7:]]),
                    'trend_direction': self._analyze_trend(price_history)
                }
            
            return {
                'success': True,
                'market_trends': trends_data,
                'market_summary': self._generate_market_summary(trends_data)
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _get_current_price(self, crop_type):
        """Get current market price with some randomness"""
        base_price = self.crop_prices[crop_type]['base_price']
        volatility = self.crop_prices[crop_type]['volatility']
        variation = random.uniform(-volatility, volatility)
        return base_price * (1 + variation)
    
    def _get_price_trend(self, crop_type):
        """Determine price trend direction"""
        trends = ['up', 'down', 'stable']
        return random.choice(trends)
    
    def _generate_price_history(self, crop_type, days):
        """Generate historical price data"""
        base_price = self.crop_prices[crop_type]['base_price']
        volatility = self.crop_prices[crop_type]['volatility']
        price_history = []
        current_price = base_price
        
        for i in range(days):
            date = datetime.now() - timedelta(days=days-i-1)
            daily_change = random.uniform(-volatility/10, volatility/10)
            current_price *= (1 + daily_change)
            
            price_history.append({
                'date': date.strftime('%Y-%m-%d'),
                'price': round(current_price, 2)
            })
        
        return price_history
    
    def _calculate_price_change(self, price_history):
        """Calculate price change percentage over the period"""
        if len(price_history) < 2:
            return 0
        
        start_price = price_history[0]['price']
        end_price = price_history[-1]['price']
        return round(((end_price - start_price) / start_price) * 100, 2)
    
    def _analyze_trend(self, price_history):
        """Analyze price trend direction"""
        if len(price_history) < 7:
            return 'insufficient_data'
        
        recent_prices = [p['price'] for p in price_history[-7:]]
        older_prices = [p['price'] for p in price_history[-14:-7]]
        
        recent_avg = sum(recent_prices) / len(recent_prices)
        older_avg = sum(older_prices) / len(older_prices)
        
        if recent_avg > older_avg * 1.02:
            return 'bullish'
        elif recent_avg < older_avg * 0.98:
            return 'bearish'
        else:
            return 'sideways'
    
    def _assess_risk(self, crop_type, roi_percentage):
        """Assess investment risk level"""
        volatility = self.crop_prices[crop_type]['volatility']
        
        if roi_percentage > 20 and volatility < 0.1:
            return 'Low Risk, High Return'
        elif roi_percentage > 15:
            return 'Medium Risk, Good Return'
        elif roi_percentage > 5:
            return 'Medium Risk, Moderate Return'
        elif roi_percentage > 0:
            return 'High Risk, Low Return'
        else:
            return 'High Risk, Potential Loss'
    
    def _get_financial_recommendations(self, roi_percentage, risk_level):
        """Generate financial recommendations"""
        recommendations = []
        
        if roi_percentage > 15:
            recommendations.append("Excellent investment opportunity with strong returns expected")
            recommendations.append("Consider expanding cultivation area if resources allow")
        elif roi_percentage > 5:
            recommendations.append("Moderate returns expected, proceed with caution")
            recommendations.append("Monitor market prices closely before planting")
        else:
            recommendations.append("Consider alternative crops with better market prospects")
            recommendations.append("Review and optimize production costs")
        
        if 'High Risk' in risk_level:
            recommendations.append("Implement risk management strategies like crop insurance")
            recommendations.append("Consider diversifying with multiple crop types")
        
        return recommendations
    
    def _generate_market_summary(self, trends_data):
        """Generate overall market summary"""
        total_crops = len(trends_data)
        bullish_count = sum(1 for crop_data in trends_data.values() 
                           if crop_data['trend_direction'] == 'bullish')
        bearish_count = sum(1 for crop_data in trends_data.values() 
                           if crop_data['trend_direction'] == 'bearish')
        
        if bullish_count > total_crops * 0.6:
            market_sentiment = 'Bullish'
        elif bearish_count > total_crops * 0.6:
            market_sentiment = 'Bearish'
        else:
            market_sentiment = 'Mixed'
        
        avg_volatility = sum(crop_data['volatility'] for crop_data in trends_data.values()) / total_crops
        
        return {
            'market_sentiment': market_sentiment,
            'average_volatility': round(avg_volatility, 3),
            'bullish_crops': bullish_count,
            'bearish_crops': bearish_count,
            'stable_crops': total_crops - bullish_count - bearish_count
        }

# Initialize financial analyzer instance
financial_analyzer = FinancialAnalyzer()