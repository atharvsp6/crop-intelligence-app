import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  Avatar,
} from '@mui/material';
import {
  Agriculture,
  LocalHospital,
  TrendingUp,
  Forum,
  Chat,
  WbSunny,
  OpacitySharp as Water,
  Thermostat,
  Cloud,
  LocationOn,
  ShowChart,
  Timeline,
  Bolt,
  Grass,
  Map,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartTooltip,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config';

const statHighlights = [
  {
    label: 'Successful predictions',
    value: '1,284',
    delta: '+12% this week',
    icon: <ShowChart fontSize="small" />,
  },
  {
    label: 'Farms optimized',
    value: '642',
    delta: '+48 new partners',
    icon: <Grass fontSize="small" />,
  },
  {
    label: 'Risk alerts resolved',
    value: '87%',
    delta: 'Response time ↓ 18%',
    icon: <Bolt fontSize="small" />,
  },
];

const featureShortcuts = [
  {
    title: 'Crop Predictor',
    description: 'Personalized yield simulations and seasonal planning.',
    icon: <Agriculture fontSize="medium" />,
    path: '/dashboard/crop-predictor',
  },
  {
    title: 'Disease Detector',
    description: 'Upload plant imagery and get AI-driven diagnostics.',
    icon: <LocalHospital fontSize="medium" />,
    path: '/dashboard/disease-detector',
  },
  {
    title: 'Financial Dashboard',
    description: 'ROI calculators, price intelligence, and market alerts.',
    icon: <TrendingUp fontSize="medium" />,
    path: '/dashboard/financial-dashboard',
  },
  {
    title: 'Community Forum',
    description: 'Multilingual knowledge shares from growers worldwide.',
    icon: <Forum fontSize="medium" />,
    path: '/dashboard/community-forum',
  },
  {
    title: 'AI Assistant',
    description: 'Conversational agronomy with context-aware insights.',
    icon: <Chat fontSize="medium" />,
    path: '/dashboard/chatbot',
  },
];

const yieldTrendData = [
  { month: 'Mar', yield: 42 },
  { month: 'Apr', yield: 48 },
  { month: 'May', yield: 57 },
  { month: 'Jun', yield: 63 },
  { month: 'Jul', yield: 71 },
  { month: 'Aug', yield: 76 },
  { month: 'Sep', yield: 83 },
];

const soilHealthSignals = [
  { title: 'Soil moisture', score: '68%', state: 'Optimal', tone: 'success' },
  { title: 'Nutrient balance', score: 'Moderate', state: 'Add organic matter', tone: 'warning' },
  { title: 'Pest pressure', score: 'Low', state: 'Scouting recommended next week', tone: 'info' },
  { title: 'Weather risk', score: 'Alert', state: 'High winds predicted Friday', tone: 'error' },
];

const quickInsights = [
  { label: 'Irrigation schedule synced', icon: <Timeline fontSize="small" />, accent: 'primary.main' },
  { label: 'New mandi price bulletin ready', icon: <Map fontSize="small" />, accent: 'secondary.main' },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [location, setLocation] = useState<string>('Getting location...');
  const [dashboardStats, setDashboardStats] = useState(statHighlights);
  const [yieldData, setYieldData] = useState(yieldTrendData);
  const [soilSignals, setSoilSignals] = useState(soilHealthSignals);

  const fetchWeatherData = useCallback(async (lat: number, lon: number) => {
    try {
      const response = await axios.get(`${API_BASE}/api/weather/current?lat=${lat}&lon=${lon}`);

      if (response.data.success) {
        const weatherData = response.data.current;
        const locationData = response.data.location;
        setWeather({
          temperature: Math.round(weatherData.temperature),
          condition: weatherData.main,
          humidity: weatherData.humidity,
          description: weatherData.description,
          location: locationData.name,
        });
        setLocation(locationData.name || 'Your location');
      } else {
        throw new Error(response.data.error || 'Failed to fetch weather');
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
      setWeatherError('Failed to fetch weather data');
      setWeather({
        temperature: 22,
        condition: 'Sunny',
        humidity: 65,
        description: 'Weather data unavailable',
      });
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch real-time dashboard stats
      const statsResponse = await axios.get(`${API_BASE}/api/dashboard/stats`);
      if (statsResponse.data.success && statsResponse.data.stats) {
        setDashboardStats(statsResponse.data.stats);
      }

      // Fetch yield trends
      const yieldResponse = await axios.get(`${API_BASE}/api/dashboard/yield-trends`);
      if (yieldResponse.data.success && yieldResponse.data.trends) {
        setYieldData(yieldResponse.data.trends);
      }

      // Fetch soil health signals
      const soilResponse = await axios.get(`${API_BASE}/api/dashboard/soil-health`);
      if (soilResponse.data.success && soilResponse.data.signals) {
        setSoilSignals(soilResponse.data.signals);
      }
    } catch (error) {
      console.log('Using fallback dashboard data:', error);
      // Keep using hardcoded fallbacks if API fails
    }
  }, []);

  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherData(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          setWeatherError('Location access denied. Using default weather data.');
          setLocation('Location unavailable');
          setWeatherLoading(false);
          setWeather({
            temperature: 22,
            condition: 'Sunny',
            humidity: 65,
            description: 'Perfect growing weather',
          });
        }
      );
    } else {
      setWeatherError('Geolocation not supported by this browser.');
      setLocation('Location unavailable');
      setWeatherLoading(false);
    }
  }, [fetchWeatherData]);

  useEffect(() => {
    getUserLocation();
    fetchDashboardData();
  }, [getUserLocation, fetchDashboardData]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Card
        className="glass-card"
        sx={{
          p: { xs: 3, md: 4 },
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            justifyContent: 'space-between',
            gap: { xs: 3, lg: 4 },
          }}
        >
          <Box sx={{ flex: 1.2 }}>
            <Chip
              label="Live intelligence"
              size="small"
              className="chip-muted"
              icon={<ShowChart fontSize="small" />}
              sx={{ mb: 2 }}
            />
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              Steering smarter fields with real-time intelligence
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520, mb: 3 }}>
              YieldWise brings together crop prediction, disease diagnostics, market pricing, and farmer collaboration in one intuitive workspace.
            </Typography>
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              {quickInsights.map((insight, index) => (
                <Chip
                  key={index}
                  icon={insight.icon}
                  label={insight.label}
                  sx={{
                    borderRadius: '999px',
                    backgroundColor: 'rgba(125, 223, 146, 0.16)',
                    color: 'text.primary',
                    '.MuiChip-icon': { color: insight.accent },
                  }}
                />
              ))}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/dashboard/crop-predictor')}
              >
                Open crop predictor
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/dashboard/chatbot')}
              >
                Ask the AI agronomist
              </Button>
            </Stack>
          </Box>

          <Box
            sx={{
              flex: 0.9,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              background: 'var(--bg-surface-subtle)',
              borderRadius: 3,
              border: '1px solid var(--border-soft)',
              p: 3,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Field weather snapshot
            </Typography>

            {weatherError && (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                {weatherError}
              </Alert>
            )}

            {weatherLoading ? (
              <Chip
                icon={<CircularProgress size={16} />}
                label="Loading weather..."
                sx={{ alignSelf: 'flex-start', borderRadius: '999px' }}
              />
            ) : (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <Avatar
                  sx={{
                    width: 70,
                    height: 70,
                    borderRadius: 22,
                    background: 'linear-gradient(135deg, rgba(125, 223, 146, 0.28) 0%, rgba(47, 133, 90, 0.48) 100%)',
                    color: '#0f1411',
                  }}
                >
                  {weather?.condition === 'Sunny' || weather?.condition === 'Clear' ? <WbSunny fontSize="large" /> : <Cloud fontSize="large" />}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {weather?.temperature ?? 22}°C
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {weather?.description || 'Weather unavailable'}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip icon={<LocationOn />} label={location} size="small" sx={{ borderRadius: '999px' }} />
                    <Chip icon={<Thermostat />} label={`${weather?.temperature ?? 22}°C`} size="small" sx={{ borderRadius: '999px' }} />
                    {weather?.humidity && (
                      <Chip icon={<Water />} label={`Humidity ${weather.humidity}%`} size="small" sx={{ borderRadius: '999px' }} />
                    )}
                  </Stack>
                </Box>
              </Stack>
            )}
          </Box>
        </Box>
      </Card>

      <Box className="layout-grid three">
        {dashboardStats && dashboardStats.length > 0 ? dashboardStats.map((stat) => (
          <Card key={stat.label} className="surface-card">
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: 'rgba(125, 223, 146, 0.18)',
                    color: 'primary.main',
                  }}
                >
                  {stat.icon}
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                    {stat.delta}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )) : (
          <Typography>Loading stats...</Typography>
        )}
      </Box>

      <Box className="layout-grid two">
        <Card className="surface-card" sx={{ p: { xs: 2.5, md: 3 } }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            Yield outlook
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Projected yield trajectory combining soil telemetry, satellite weather, and historical trends.
          </Typography>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={yieldData && yieldData.length > 0 ? yieldData : yieldTrendData}>
              <defs>
                <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7DDF92" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#7DDF92" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,223,146,0.25)" horizontal vertical={false} />
              <XAxis dataKey="month" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} width={40} />
              <RechartTooltip
                cursor={{ stroke: 'rgba(125,223,146,0.35)', strokeWidth: 1 }}
                contentStyle={{
                  borderRadius: 14,
                  border: '1px solid rgba(125,223,146,0.35)',
                  background: 'var(--bg-surface)',
                  boxShadow: 'var(--shadow-soft)',
                }}
              />
              <Area type="monotone" dataKey="yield" stroke="#2f855a" fill="url(#yieldGradient)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="surface-card" sx={{ p: { xs: 2.5, md: 3 } }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            Field readiness signals
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Automated agronomy checks compiled from IoT probes and scouting updates across your farms.
          </Typography>
          <Stack spacing={2.2}>
            {soilSignals && soilSignals.length > 0 ? soilSignals.map((signal) => (
              <Box
                key={signal.title}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: 3,
                  border: '1px solid var(--border-soft)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  px: 2,
                  py: 1.5,
                }}
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {signal.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {signal.state}
                  </Typography>
                </Box>
                <Chip label={signal.score} color={signal.tone as any} variant="outlined" sx={{ borderRadius: '999px' }} />
              </Box>
            )) : (
              <Typography>Loading soil data...</Typography>
            )}
          </Stack>
        </Card>
      </Box>

      <Card className="surface-card" sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Explore modules
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Navigate to a workspace and continue where you left off. Actions auto-sync across devices.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ flex: 2 }}>
            {featureShortcuts.map((feature) => (
              <Box
                key={feature.title}
                onClick={() => navigate(feature.path)}
                sx={{
                  cursor: 'pointer',
                  flex: '1 1 240px',
                  minWidth: 220,
                  p: 2,
                  borderRadius: 3,
                  border: '1px solid var(--border-soft)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  display: 'flex',
                  gap: 1.5,
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 20px 45px rgba(31, 64, 45, 0.15)',
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: 'rgba(125, 223, 146, 0.16)',
                    color: 'primary.main',
                  }}
                >
                  {feature.icon}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Card>
    </Box>
  );
};

export default Dashboard;