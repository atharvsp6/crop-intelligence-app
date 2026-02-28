import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShowChart,
  CandlestickChart,
  Refresh,
} from '@mui/icons-material';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import axios from 'axios';
import { API_BASE } from '../config';
import { useAuth } from '../context/AuthContext';

interface MarketTrend {
  success: boolean;
  market_trends?: Record<string, {
    price_history?: Array<{ date: string; price: number }>;
    current_price: number;
    price_change_24h?: number;
    price_change_percentage?: number;
    data_source?: string;
    source?: string;
    data_freshness?: string;
    from_cache?: boolean;
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

const DATA_SOURCE_LABELS: Record<string, string> = {
  yahoo_finance: 'Yahoo Finance',
  alpha_vantage: 'Alpha Vantage',
  data_gov_in: 'data.gov.in – Mandi Feed',
  commodities_api: 'Commodities-API',
  world_bank: 'World Bank Open Data',
  mock_realtime: 'Simulated (configure API keys)',
};

const DATA_FRESHNESS_LABELS: Record<string, string> = {
  real_time: 'Real-time',
  intraday: 'Intraday',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  simulated: 'Simulated',
  cached: 'Cached',
  unknown: 'Unknown',
};

const formatLabel = (value?: string, dictionary?: Record<string, string>) => {
  if (!value) return 'Unknown';
  const normalized = value.toLowerCase();
  if (dictionary && dictionary[normalized]) {
    return dictionary[normalized];
  }
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDataSourceLabel = (source?: string) => formatLabel(source, DATA_SOURCE_LABELS);
const formatFreshnessLabel = (freshness?: string) => formatLabel(freshness, DATA_FRESHNESS_LABELS);

const FinancialDashboard: React.FC = () => {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  const accentColor = dark ? theme.palette.primary.main : theme.palette.primary.dark;

  const [marketTrends, setMarketTrends] = useState<MarketTrend | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const { token } = useAuth();

  const fetchMarketTrends = useCallback(async () => {
    setMarketLoading(true);
    try {
      const response = await axios.get<MarketTrend>(`${API_BASE}/api/financial/market-trends?days=30`, {
        headers: { Authorization: `Bearer ${token}` },
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
  }, [token]);

  useEffect(() => {
    fetchMarketTrends();
  }, [fetchMarketTrends]);

  const getTrendIcon = (direction: string) => {
    const d = direction.toLowerCase();
    if (d.includes('up') || d.includes('bull')) return <TrendingUp />;
    if (d.includes('down') || d.includes('bear')) return <TrendingDown />;
    return <ShowChart />;
  };

  const getTrendColor = (direction: string) => {
    const d = direction.toLowerCase();
    if (d.includes('up') || d.includes('bull')) return 'success';
    if (d.includes('down') || d.includes('bear')) return 'error';
    return 'default';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(accentColor, 0.2)} 0%, ${alpha(accentColor, 0.35)} 100%)`,
              color: accentColor,
            }}
          >
            <CandlestickChart />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Market Intelligence
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Live commodity prices and trend analysis
            </Typography>
          </Box>
        </Box>
        <Chip
          icon={<Refresh sx={{ fontSize: 16 }} />}
          label="Refresh"
          variant="outlined"
          onClick={() => fetchMarketTrends()}
          sx={{ borderRadius: 2, cursor: 'pointer' }}
        />
      </Box>

      {marketLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress />
        </Box>
      ) : marketTrends?.success && marketTrends.market_trends ? (
        <>
          {/* Market summary banner */}
          {marketTrends.market_summary && (
            <Card
              sx={{
                borderRadius: 4,
                overflow: 'hidden',
                background: dark
                  ? `linear-gradient(135deg, ${alpha(accentColor, 0.08)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`
                  : `linear-gradient(135deg, ${alpha(accentColor, 0.06)} 0%, ${theme.palette.background.paper} 100%)`,
                border: `1px solid ${alpha(accentColor, dark ? 0.15 : 0.1)}`,
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <Typography variant="body1" sx={{ mb: 2.5, color: 'text.secondary', lineHeight: 1.7 }}>
                  {marketTrends.market_summary.summary}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                      Market Sentiment
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {marketTrends.market_summary.market_sentiment}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                      Trending Up
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: 'success.main' }}>
                      {marketTrends.market_summary.upward_trending}/{marketTrends.market_summary.total_commodities_tracked}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                      Best Performer
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: 'success.main' }}>
                      {marketTrends.market_summary.best_performer
                        ? marketTrends.market_summary.best_performer.charAt(0).toUpperCase() +
                          marketTrends.market_summary.best_performer.slice(1)
                        : 'N/A'}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Commodity cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {Object.entries(marketTrends.market_trends).map(([crop, data]) => {
              const changePositive =
                data.price_change_24h !== undefined ? data.price_change_24h >= 0 : true;
              const changeColor = changePositive ? 'success.main' : 'error.main';

              return (
                <Card
                  key={crop}
                  sx={{
                    borderRadius: 4,
                    border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: dark
                        ? '0 12px 40px rgba(0,0,0,0.4)'
                        : '0 12px 40px rgba(0,0,0,0.08)',
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    {/* Card header */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                        {crop}
                      </Typography>
                      <Chip
                        icon={getTrendIcon(data.trend_direction)}
                        label={data.trend_direction.charAt(0).toUpperCase() + data.trend_direction.slice(1)}
                        size="small"
                        color={getTrendColor(data.trend_direction) as any}
                        variant="outlined"
                        sx={{ borderRadius: 2, fontWeight: 600 }}
                      />
                    </Stack>

                    {/* Price chart */}
                    <Box sx={{ height: 220, mb: 2.5 }}>
                      {data.price_history && data.price_history.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data.price_history}>
                            <defs>
                              <linearGradient id={`grad-${crop}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={changePositive ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={changePositive ? '#22c55e' : '#ef4444'} stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                              vertical={false}
                            />
                            <XAxis
                              dataKey="date"
                              stroke={dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                              tickLine={false}
                              axisLine={false}
                              tick={{ fontSize: 11 }}
                            />
                            <YAxis
                              stroke={dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                              tickLine={false}
                              axisLine={false}
                              width={55}
                              tick={{ fontSize: 11 }}
                              tickFormatter={(v: number) => `₹${v.toFixed(2)}`}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: 12,
                                border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                background: dark ? '#1e1e1e' : '#fff',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                              }}
                              formatter={(value: number) => [`₹${value.toFixed(4)}`, 'Price']}
                              labelStyle={{ fontWeight: 600 }}
                            />
                            <Area
                              type="monotone"
                              dataKey="price"
                              stroke={changePositive ? '#22c55e' : '#ef4444'}
                              fill={`url(#grad-${crop})`}
                              strokeWidth={2.5}
                              dot={false}
                              activeDot={{ r: 5, strokeWidth: 2 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Typography variant="body2" color="text.secondary">
                            {data.note || 'Price history unavailable'}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Price stats row */}
                    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, fontSize: '0.65rem' }}>
                          Current Price
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.25 }}>
                          ₹{data.current_price.toFixed(4)}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, fontSize: '0.65rem' }}>
                          24h Change
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.25, color: changeColor }}>
                          {data.price_change_24h !== undefined
                            ? `${changePositive ? '+' : ''}₹${data.price_change_24h.toFixed(4)}`
                            : 'N/A'}
                        </Typography>
                        {data.price_change_percentage !== undefined && (
                          <Typography variant="caption" sx={{ color: changeColor, fontWeight: 600 }}>
                            ({data.price_change_percentage >= 0 ? '+' : ''}
                            {data.price_change_percentage.toFixed(2)}%)
                          </Typography>
                        )}
                      </Box>
                    </Stack>

                    {/* Moving averages */}
                    {(data.ma_7_day || data.ma_30_day) && (
                      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
                        {data.ma_7_day && (
                          <Chip
                            label={`7d MA: ₹${data.ma_7_day.toFixed(4)}`}
                            size="small"
                            sx={{
                              borderRadius: 2,
                              fontSize: '0.7rem',
                              backgroundColor: alpha(accentColor, dark ? 0.12 : 0.08),
                              color: 'text.primary',
                            }}
                          />
                        )}
                        {data.ma_30_day && (
                          <Chip
                            label={`30d MA: ₹${data.ma_30_day.toFixed(4)}`}
                            size="small"
                            sx={{
                              borderRadius: 2,
                              fontSize: '0.7rem',
                              backgroundColor: alpha(accentColor, dark ? 0.12 : 0.08),
                              color: 'text.primary',
                            }}
                          />
                        )}
                      </Stack>
                    )}

                    {/* Data source footer */}
                    <Box
                      sx={{
                        pt: 2,
                        borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                        Source: {formatDataSourceLabel(data.data_source || data.source)}
                        {data.from_cache ? ' · Cached' : ' · Live'}
                        {data.data_freshness && ` · ${formatFreshnessLabel(data.data_freshness)}`}
                        <br />
                        Updated: {new Date(data.last_updated).toLocaleString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </>
      ) : (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {marketTrends?.error || 'Failed to load market trends'}
        </Alert>
      )}
    </Box>
  );
};

export default FinancialDashboard;