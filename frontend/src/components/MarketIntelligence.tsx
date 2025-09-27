import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  alpha,
  Avatar,
  Stack,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  Timeline,
  CompareArrows,
  ShowChart,
  Agriculture,
  AccessTime,
  LocationOn,
} from '@mui/icons-material';
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

const DEFAULT_COMMODITIES: Commodity[] = [
  { id: 'wheat', name: 'Wheat', category: 'Grain', unit: 'kg' },
  { id: 'rice', name: 'Rice', category: 'Grain', unit: 'kg' },
  { id: 'soybean', name: 'Soybean', category: 'Oilseed', unit: 'kg' },
  { id: 'turmeric', name: 'Turmeric', category: 'Spice', unit: 'kg' },
];

const MarketIntelligence: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [trendingData, setTrendingData] = useState<PriceData[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>(DEFAULT_COMMODITIES);
  const [selectedRegion, setSelectedRegion] = useState('US');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [error, setError] = useState<string>('');
  const theme = useTheme();

  const regions = [
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'GLOBAL', name: 'Global', flag: '🌍' },
  ];

  const fetchCommodities = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/api/market/commodities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCommodities(response.data.commodities);
      }
    } catch (err: any) {
      console.error('Error fetching commodities:', err);
    }
  }, []);

  const fetchPriceComparison = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/api/market/price-comparison`, {
        params: { region: selectedRegion },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setPriceData(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching price comparison:', err);
      setError('Failed to fetch price data. Using demo data.');
      // Use fallback mock data
      setPriceData([
        {
          commodity: 'wheat',
          price: 22.50,
          currency: 'USD',
          change: 0.75,
          change_percent: 3.45,
          last_updated: new Date().toISOString(),
          direction: 'up'
        },
        {
          commodity: 'rice',
          price: 28.00,
          currency: 'USD',
          change: -1.20,
          change_percent: -4.11,
          last_updated: new Date().toISOString(),
          direction: 'down'
        },
        {
          commodity: 'soybean',
          price: 42.00,
          currency: 'USD',
          change: 2.10,
          change_percent: 5.26,
          last_updated: new Date().toISOString(),
          direction: 'up'
        },
      ]);
    }
  }, [selectedRegion]);

  const fetchTrendingData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/api/market/trending`, {
        params: { region: selectedRegion },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setTrendingData(response.data.trending);
      }
    } catch (err: any) {
      console.error('Error fetching trending data:', err);
      // Use fallback trending data
      setTrendingData([
        {
          commodity: 'turmeric',
          price: 85.00,
          currency: 'USD',
          change: 4.50,
          change_percent: 5.6,
          last_updated: new Date().toISOString(),
          direction: 'up'
        },
      ]);
    }
  }, [selectedRegion]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([
        fetchCommodities(),
        fetchPriceComparison(),
        fetchTrendingData(),
      ]);
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      setError('Failed to load market data. Showing demo data.');
    } finally {
      setLoading(false);
    }
  }, [fetchCommodities, fetchPriceComparison, fetchTrendingData]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getCommodityIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'grain': return '🌾';
      case 'oilseed': return '🌻';
      case 'spice': return '🌶️';
      case 'vegetable': return '🥕';
      case 'fiber': return '🧶';
      default: return '📦';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={48} />
          <Typography variant="h6" color="text.secondary">
            Loading Market Data...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: 'success.main',
                width: 56,
                height: 56,
              }}
            >
              <ShowChart sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                Live Market Intelligence
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Real-time commodity prices and market trends
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Region</InputLabel>
              <Select
                value={selectedRegion}
                label="Region"
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                {regions.map((region) => (
                  <MenuItem key={region.code} value={region.code}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>{region.flag}</Typography>
                      <Typography>{region.name}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip title="Refresh Data">
              <IconButton onClick={fetchAllData} color="primary">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {lastUpdated && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AccessTime fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              Last updated: {lastUpdated}
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, mb: 3 }}>
        {/* Trending Commodities */}
        <Box sx={{ flex: { lg: '0 0 300px' } }}>
          <Card elevation={2} sx={{ height: 'fit-content' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Timeline color="primary" />
                <Typography variant="h6" component="h2">
                  Trending Now
                </Typography>
              </Box>
              
              {trendingData.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  No significant price movements detected
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {trendingData.map((item, index) => (
                    <Paper
                      key={`${item.commodity}-${index}`}
                      sx={{
                        p: 2,
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        bgcolor: alpha(
                          item.direction === 'up' ? theme.palette.success.main : theme.palette.error.main,
                          0.05
                        ),
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '1.2rem' }}>
                            {getCommodityIcon(commodities.find(c => c.id === item.commodity)?.category || 'other')}
                          </Typography>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.commodity.charAt(0).toUpperCase() + item.commodity.slice(1)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatCurrency(item.price, item.currency)}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {item.direction === 'up' ? (
                            <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />
                          ) : (
                            <TrendingDown sx={{ color: 'error.main', fontSize: 20 }} />
                          )}
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: item.direction === 'up' ? 'success.main' : 'error.main',
                            }}
                          >
                            {formatPercentage(item.change_percent)}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Price Comparison Table */}
        <Box sx={{ flex: 1 }}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <CompareArrows color="primary" />
                <Typography variant="h6" component="h2">
                  Price Comparison
                </Typography>
              </Box>
              
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                      <TableCell sx={{ fontWeight: 600 }}>Commodity</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Current Price</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Change</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Change %</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {priceData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No price data available
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      priceData.map((item, index) => (
                        <TableRow key={`${item.commodity}-${index}`} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography sx={{ fontSize: '1.2rem' }}>
                                {getCommodityIcon(commodities.find(c => c.id === item.commodity)?.category || 'other')}
                              </Typography>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {item.commodity.charAt(0).toUpperCase() + item.commodity.slice(1)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  per {commodities.find(c => c.id === item.commodity)?.unit || 'kg'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatCurrency(item.price, item.currency)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              sx={{
                                color: item.change > 0 ? 'success.main' : item.change < 0 ? 'error.main' : 'text.secondary',
                                fontWeight: 500,
                              }}
                            >
                              {item.change > 0 ? '+' : ''}{formatCurrency(item.change, item.currency)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              sx={{
                                color: item.change_percent > 0 ? 'success.main' : item.change_percent < 0 ? 'error.main' : 'text.secondary',
                                fontWeight: 600,
                              }}
                            >
                              {formatPercentage(item.change_percent)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              icon={item.change_percent > 0 ? <TrendingUp /> : <TrendingDown />}
                              label={item.change_percent > 0 ? 'Rising' : item.change_percent < 0 ? 'Falling' : 'Stable'}
                              color={item.change_percent > 0 ? 'success' : item.change_percent < 0 ? 'error' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Card sx={{ flex: 1, bgcolor: alpha(theme.palette.success.main, 0.1) }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <TrendingUp sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {trendingData.filter(item => item.direction === 'up').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rising Prices
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, bgcolor: alpha(theme.palette.error.main, 0.1) }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <TrendingDown sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {trendingData.filter(item => item.direction === 'down').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Falling Prices
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Agriculture sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {commodities.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Commodities Tracked
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <LocationOn sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {regions.find(r => r.code === selectedRegion)?.flag}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Current Region
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default MarketIntelligence;