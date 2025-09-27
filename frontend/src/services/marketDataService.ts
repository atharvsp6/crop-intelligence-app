import axios from 'axios';
import { API_BASE } from '../config';

interface PriceData {
  commodity: string;
  price: number;
  currency: string;
  change: number;
  change_percent: number;
  last_updated: string;
  direction?: 'up' | 'down';
  volume?: string;
}

interface Commodity {
  id: string;
  name: string;
  category: string;
  unit: string;
}

interface HistoricalPricePoint {
  date: string;
  price: number;
  volume?: number;
}

class MarketDataService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  async getRealTimePrice(commodity: string, region: string = 'IN'): Promise<any> {
    try {
      const response = await axios.get(
        `${API_BASE}/api/financial/real-time-price`,
        {
          params: { commodity, region },
          ...this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching real-time price:', error);
      throw error;
    }
  }

  async getPriceComparison(commodities?: string[], region: string = 'IN'): Promise<{ success: boolean; data: PriceData[] }> {
    try {
      const params: any = { region };
      if (commodities && commodities.length > 0) {
        params.commodities = commodities;
      }
      
      const response = await axios.get(
        `${API_BASE}/api/market/price-comparison`,
        {
          params,
          ...this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching price comparison:', error);
      throw error;
    }
  }

  async getTrendingCommodities(region: string = 'IN'): Promise<{ success: boolean; trending: PriceData[] }> {
    try {
      const response = await axios.get(
        `${API_BASE}/api/market/trending`,
        {
          params: { region },
          ...this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching trending commodities:', error);
      throw error;
    }
  }

  async getSupportedCommodities(): Promise<{ success: boolean; commodities: Commodity[] }> {
    try {
      const response = await axios.get(
        `${API_BASE}/api/market/commodities`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching supported commodities:', error);
      throw error;
    }
  }

  async getHistoricalPrices(commodity: string, days: number = 30): Promise<{ success: boolean; data: HistoricalPricePoint[] }> {
    try {
      const response = await axios.get(
        `${API_BASE}/api/financial/historical-prices`,
        {
          params: { commodity, days },
          ...this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching historical prices:', error);
      throw error;
    }
  }

  async getProductionCosts(cropType: string, region: string = 'IN', areaAcres: number = 1): Promise<any> {
    try {
      const response = await axios.get(
        `${API_BASE}/api/financial/production-costs`,
        {
          params: { crop_type: cropType, region, area_acres: areaAcres },
          ...this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching production costs:', error);
      throw error;
    }
  }

  // Utility methods for formatting
  formatCurrency(value: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  formatPercentage(value: number): string {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }

  // Mock data for development/testing
  getMockPriceData(): PriceData[] {
    return [
      {
        commodity: 'wheat',
        price: 22.50,
        currency: 'INR',
        change: 0.75,
        change_percent: 3.45,
        last_updated: new Date().toISOString(),
        direction: 'up'
      },
      {
        commodity: 'rice',
        price: 28.00,
        currency: 'INR',
        change: -1.20,
        change_percent: -4.11,
        last_updated: new Date().toISOString(),
        direction: 'down'
      },
      {
        commodity: 'soybean',
        price: 42.00,
        currency: 'INR',
        change: 2.10,
        change_percent: 5.26,
        last_updated: new Date().toISOString(),
        direction: 'up'
      },
      {
        commodity: 'cotton',
        price: 65.00,
        currency: 'INR',
        change: -0.50,
        change_percent: -0.76,
        last_updated: new Date().toISOString(),
        direction: 'down'
      }
    ];
  }

  getMockCommodities(): Commodity[] {
    return [
      { id: 'wheat', name: 'Wheat', category: 'Grain', unit: 'kg' },
      { id: 'rice', name: 'Rice', category: 'Grain', unit: 'kg' },
      { id: 'corn', name: 'Corn/Maize', category: 'Grain', unit: 'kg' },
      { id: 'soybean', name: 'Soybean', category: 'Oilseed', unit: 'kg' },
      { id: 'cotton', name: 'Cotton', category: 'Fiber', unit: 'kg' },
      { id: 'turmeric', name: 'Turmeric', category: 'Spice', unit: 'kg' },
      { id: 'mustard', name: 'Mustard Seed', category: 'Oilseed', unit: 'kg' },
      { id: 'cardamom', name: 'Cardamom', category: 'Spice', unit: 'kg' },
      { id: 'coriander', name: 'Coriander', category: 'Spice', unit: 'kg' },
      { id: 'onion', name: 'Onion', category: 'Vegetable', unit: 'kg' },
      { id: 'tomato', name: 'Tomato', category: 'Vegetable', unit: 'kg' },
      { id: 'potato', name: 'Potato', category: 'Vegetable', unit: 'kg' },
    ];
  }
}

export default new MarketDataService();
export type { PriceData, Commodity, HistoricalPricePoint };