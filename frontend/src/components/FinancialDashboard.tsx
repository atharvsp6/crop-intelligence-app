import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  SelectChangeEvent,
} from '@mui/material';
import { TrendingUp, Calculate } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface ROIData {
  crop_type: string;
  area_acres: number;
  expected_yield_per_acre: number;
  additional_costs?: Record<string, number>;
}

interface ROIResult {
  success: boolean;
  financial_metrics?: {
    total_investment: number;
    total_revenue: number;
    net_profit: number;
    roi_percentage: number;
    profit_per_acre: number;
    breakeven_yield_per_acre: number;
  };
  cost_breakdown?: Record<string, number>;
  market_info?: {
    current_price_per_kg: number;
    price_source: string;
    price_change_24h?: number;
    price_change_percent?: number;
    last_updated?: string;
  };
  risk_assessment?: string | {
    overall_risk: string;
    risk_factors: Record<string, string>;
    recommendation: string;
  };
  recommendations?: string[];
  error?: string;
}

interface MarketTrend {
  success: boolean;
  market_trends?: Record<string, {
    price_history?: Array<{ date: string; price: number }>;
    current_price: number;
    price_change_24h?: number;
    price_change_percentage?: number;
    data_source: string;
    volatility?: number;
    support_level?: number;
    resistance_level?: number;
    trend_direction: string;
    ma_7_day?: number;
    ma_30_day?: number;
    last_updated: string;
    note?: string;
  }>;
  market_summary?: {
    market_sentiment: string;
    total_commodities_tracked: number;
    upward_trending: number;
    best_performer?: string;
    worst_performer?: string;
    summary: string;
  };
  data_freshness?: string;
  error?: string;
}

const FinancialDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [roiData, setRoiData] = useState<ROIData>({
    crop_type: 'wheat',
    area_acres: 10,
    expected_yield_per_acre: 2500,
  });
  const [roiResult, setRoiResult] = useState<ROIResult | null>(null);
  const [marketTrends, setMarketTrends] = useState<MarketTrend | null>(null);
  const [loading, setLoading] = useState(false);
  const [marketLoading, setMarketLoading] = useState(false);
  const { token } = useAuth();

  const cropTypes = ['wheat', 'rice', 'corn', 'soybean', 'cotton'];

  useEffect(() => {
    fetchMarketTrends();
  }, []);

  const fetchMarketTrends = async () => {
    setMarketLoading(true);
    try {
      const response = await axios.get<MarketTrend>('http://localhost:5001/api/financial/market-trends?days=30', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMarketTrends(response.data);
    } catch (error) {
      setMarketTrends({
        success: false,
        error: 'Failed to fetch market trends',
      });
    } finally {
      setMarketLoading(false);
    }
  };

  const calculateROI = async () => {
    setLoading(true);
    setRoiResult(null);

    try {
      const response = await axios.post<ROIResult>(
        'http://localhost:5001/api/financial/roi',
        roiData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRoiResult(response.data);
    } catch (error) {
      setRoiResult({
        success: false,
        error: 'Failed to connect to the server. Please ensure the backend is running.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ROIData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = field === 'crop_type' ? event.target.value : parseFloat(event.target.value);
    setRoiData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getRiskColor = (risk: any) => {
    if (!risk) return 'info';
    
    // Handle both string and object formats
    const riskLevel = typeof risk === 'string' ? risk.toLowerCase() : risk?.overall_risk?.toLowerCase() || '';
    
    if (riskLevel.includes('low')) return 'success';
    if (riskLevel.includes('medium')) return 'warning';
    if (riskLevel.includes('high')) return 'error';
    return 'info';
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <TrendingUp sx={{ mr: 2, verticalAlign: 'bottom' }} />
        Financial Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Analyze ROI, track market trends, and make informed financial decisions
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="ROI Calculator" />
          <Tab label="Market Trends" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Investment Parameters
                </Typography>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>Crop Type</InputLabel>
                  <Select
                    value={roiData.crop_type}
                    onChange={(e: SelectChangeEvent) => setRoiData(prev => ({ ...prev, crop_type: e.target.value }))}
                  >
                    {cropTypes.map(crop => (
                      <MenuItem key={crop} value={crop}>
                        {crop.charAt(0).toUpperCase() + crop.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Farm Area (acres)"
                  type="number"
                  value={roiData.area_acres}
                  onChange={handleInputChange('area_acres')}
                  margin="normal"
                  inputProps={{ step: 0.1, min: 0.1 }}
                />

                <TextField
                  fullWidth
                  label="Expected Yield per Acre (kg)"
                  type="number"
                  value={roiData.expected_yield_per_acre}
                  onChange={handleInputChange('expected_yield_per_acre')}
                  margin="normal"
                  inputProps={{ step: 10, min: 100 }}
                />

                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 3 }}
                  onClick={calculateROI}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <Calculate />}
                >
                  {loading ? 'Calculating...' : 'Calculate ROI'}
                </Button>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: 1 }}>
            {roiResult && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ROI Analysis Results
                  </Typography>
                  
                  {roiResult.success ? (
                    <Box>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                            <Typography variant="h4">
                              {roiResult.financial_metrics?.roi_percentage.toFixed(1)}%
                            </Typography>
                            <Typography variant="body2">ROI</Typography>
                          </Paper>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                            <Typography variant="h5">
                              ${roiResult.financial_metrics?.net_profit.toLocaleString()}
                            </Typography>
                            <Typography variant="body2">Net Profit</Typography>
                          </Paper>
                        </Box>
                      </Box>

                      <Paper sx={{ p: 2, mt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Financial Breakdown
                        </Typography>
                        <Typography variant="body2">
                          Total Investment: ${roiResult.financial_metrics?.total_investment.toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                          Expected Revenue: ${roiResult.financial_metrics?.total_revenue.toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                          Profit per Acre: ${roiResult.financial_metrics?.profit_per_acre.toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                          Break-even Yield: {roiResult.financial_metrics?.breakeven_yield_per_acre.toFixed(0)} kg/acre
                        </Typography>
                      </Paper>

                      {roiResult.market_info && (
                        <Paper sx={{ p: 2, mt: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Market Information
                          </Typography>
                          <Typography variant="body2">
                            Current Price: ${roiResult.market_info.current_price_per_kg.toFixed(4)}/kg
                          </Typography>
                          {roiResult.market_info.price_change_24h !== undefined && (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: roiResult.market_info.price_change_24h >= 0 ? 'success.main' : 'error.main' 
                              }}
                            >
                              24h Change: {roiResult.market_info.price_change_24h >= 0 ? '+' : ''}
                              ${roiResult.market_info.price_change_24h.toFixed(4)} 
                              ({(roiResult.market_info.price_change_percent ?? 0) >= 0 ? '+' : ''}
                              {(roiResult.market_info.price_change_percent ?? 0).toFixed(2)}%)
                            </Typography>
                          )}
                          <Typography variant="body2" color="textSecondary">
                            Data Source: {roiResult.market_info.price_source === 'fallback' 
                              ? 'Realistic Market Estimate' 
                              : roiResult.market_info.price_source.replace('_', ' ').toUpperCase()
                            }
                          </Typography>
                          {roiResult.market_info.last_updated && (
                            <Typography variant="caption" color="textSecondary">
                              Last Updated: {new Date(roiResult.market_info.last_updated).toLocaleString()}
                            </Typography>
                          )}
                        </Paper>
                      )}

                      {roiResult.risk_assessment && (
                        <Alert severity={getRiskColor(roiResult.risk_assessment)} sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Risk Assessment: {typeof roiResult.risk_assessment === 'string' 
                              ? roiResult.risk_assessment 
                              : `${roiResult.risk_assessment.overall_risk?.toUpperCase() || 'UNKNOWN'} RISK`}
                          </Typography>
                          {typeof roiResult.risk_assessment === 'object' && roiResult.risk_assessment.recommendation && (
                            <Typography variant="body2">
                              {roiResult.risk_assessment.recommendation}
                            </Typography>
                          )}
                        </Alert>
                      )}

                      {roiResult.recommendations && (
                        <Paper sx={{ p: 2, mt: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Recommendations
                          </Typography>
                          {roiResult.recommendations.map((rec, index) => (
                            <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                              • {rec}
                            </Typography>
                          ))}
                        </Paper>
                      )}
                    </Box>
                  ) : (
                    <Alert severity="error">
                      {roiResult.error || 'ROI calculation failed'}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          {marketLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : marketTrends?.success && marketTrends.market_trends ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* Market Summary */}
              {marketTrends.market_summary && (
                <Card sx={{ gridColumn: { xs: 'span 1', md: 'span 2' }, mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Market Summary
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {marketTrends.market_summary.summary}
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mt: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Market Sentiment
                        </Typography>
                        <Typography variant="h6">
                          {marketTrends.market_summary.market_sentiment}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Trending Up
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {marketTrends.market_summary.upward_trending}/{marketTrends.market_summary.total_commodities_tracked}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Best Performer
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {marketTrends.market_summary.best_performer?.charAt(0).toUpperCase() + 
                           (marketTrends.market_summary.best_performer?.slice(1) || '')}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {Object.entries(marketTrends.market_trends).map(([crop, data]) => (
                <Card key={crop}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                        {crop.charAt(0).toUpperCase() + crop.slice(1)} Price Trends
                      </Typography>
                      
                      <Box sx={{ height: 300 }}>
                        {data.price_history && data.price_history.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.price_history}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Line
                                type="monotone"
                                dataKey="price"
                                stroke="#2196F3"
                                strokeWidth={2}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <Typography variant="body2" color="text.secondary">
                              {data.note || 'Price history unavailable'}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mt: 2 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Current Price
                          </Typography>
                          <Typography variant="h6">
                            ${data.current_price.toFixed(4)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            24h Change
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color={
                              data.price_change_24h !== undefined
                                ? (data.price_change_24h >= 0 ? 'success.main' : 'error.main')
                                : 'text.primary'
                            }
                          >
                            {data.price_change_24h !== undefined
                              ? `${data.price_change_24h >= 0 ? '+' : ''}$${data.price_change_24h.toFixed(4)}`
                              : 'N/A'
                            }
                          </Typography>
                          {data.price_change_percentage !== undefined && (
                            <Typography 
                              variant="caption" 
                              color={data.price_change_percentage >= 0 ? 'success.main' : 'error.main'}
                            >
                              ({data.price_change_percentage >= 0 ? '+' : ''}{data.price_change_percentage.toFixed(2)}%)
                            </Typography>
                          )}
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Trend
                          </Typography>
                          <Typography variant="h6">
                            {data.trend_direction.charAt(0).toUpperCase() + data.trend_direction.slice(1)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Data source and additional info */}
                      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary">
                          Data Source: {data.data_source === 'fallback' 
                            ? 'Market Estimate' 
                            : data.data_source.replace('_', ' ').toUpperCase()
                          }
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          Last Updated: {new Date(data.last_updated).toLocaleString()}
                        </Typography>
                        {data.ma_7_day && (
                          <>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              7-day MA: ${data.ma_7_day.toFixed(4)}
                              {data.ma_30_day && ` | 30-day MA: $${data.ma_30_day.toFixed(4)}`}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
          ) : (
            <Alert severity="error">
              {marketTrends?.error || 'Failed to load market trends'}
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

export default FinancialDashboard;