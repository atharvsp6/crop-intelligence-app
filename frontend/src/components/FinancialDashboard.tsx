import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
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
    price_trend: string;
    market_volatility: number;
  };
  risk_assessment?: string;
  recommendations?: string[];
  error?: string;
}

interface MarketTrend {
  success: boolean;
  market_trends?: Record<string, {
    price_history: Array<{ date: string; price: number }>;
    current_price: number;
    price_change_percentage: number;
    volatility: number;
    support_level: number;
    resistance_level: number;
    trend_direction: string;
  }>;
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

  const cropTypes = ['wheat', 'rice', 'corn', 'soybean', 'cotton'];

  useEffect(() => {
    fetchMarketTrends();
  }, []);

  const fetchMarketTrends = async () => {
    setMarketLoading(true);
    try {
      const response = await axios.get<MarketTrend>('http://localhost:5000/api/market-trends?days=30');
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
        'http://localhost:5000/api/calculate-roi',
        roiData
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

  const getRiskColor = (risk: string) => {
    if (risk.includes('Low Risk')) return 'success';
    if (risk.includes('Medium Risk')) return 'warning';
    return 'error';
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
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
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
          </Grid>

          <Grid item xs={12} md={6}>
            {roiResult && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ROI Analysis Results
                  </Typography>
                  
                  {roiResult.success ? (
                    <Box>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                            <Typography variant="h4">
                              {roiResult.financial_metrics?.roi_percentage.toFixed(1)}%
                            </Typography>
                            <Typography variant="body2">ROI</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                            <Typography variant="h5">
                              ${roiResult.financial_metrics?.net_profit.toLocaleString()}
                            </Typography>
                            <Typography variant="body2">Net Profit</Typography>
                          </Paper>
                        </Grid>
                      </Grid>

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
                            Current Price: ${roiResult.market_info.current_price_per_kg.toFixed(2)}/kg
                          </Typography>
                          <Typography variant="body2">
                            Price Trend: {roiResult.market_info.price_trend}
                          </Typography>
                          <Typography variant="body2">
                            Volatility: {(roiResult.market_info.market_volatility * 100).toFixed(1)}%
                          </Typography>
                        </Paper>
                      )}

                      {roiResult.risk_assessment && (
                        <Alert severity={getRiskColor(roiResult.risk_assessment)} sx={{ mt: 2 }}>
                          Risk Assessment: {roiResult.risk_assessment}
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
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Box>
          {marketLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : marketTrends?.success && marketTrends.market_trends ? (
            <Grid container spacing={3}>
              {Object.entries(marketTrends.market_trends).map(([crop, data]) => (
                <Grid item xs={12} md={6} key={crop}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {crop.charAt(0).toUpperCase() + crop.slice(1)} Price Trends
                      </Typography>
                      
                      <Box sx={{ height: 300 }}>
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
                      </Box>

                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">
                            Current Price
                          </Typography>
                          <Typography variant="h6">
                            ${data.current_price.toFixed(2)}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">
                            Change
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color={data.price_change_percentage >= 0 ? 'success.main' : 'error.main'}
                          >
                            {data.price_change_percentage >= 0 ? '+' : ''}{data.price_change_percentage.toFixed(1)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">
                            Trend
                          </Typography>
                          <Typography variant="h6">
                            {data.trend_direction}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
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