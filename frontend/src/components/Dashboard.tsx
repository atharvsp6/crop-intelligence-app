import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';

const baseStatHighlights = [
  {
    labelKey: 'dashboard.stats.items.success.label',
    fallbackLabel: 'Successful predictions',
    value: '1,284',
    deltaKey: 'dashboard.stats.items.success.delta',
    fallbackDelta: '+12% this week',
    icon: <ShowChart fontSize="small" />,
  },
  {
    labelKey: 'dashboard.stats.items.farms.label',
    fallbackLabel: 'Farms optimized',
    value: '642',
    deltaKey: 'dashboard.stats.items.farms.delta',
    fallbackDelta: '+48 new partners',
    icon: <Grass fontSize="small" />,
  },
  {
    labelKey: 'dashboard.stats.items.risk.label',
    fallbackLabel: 'Risk alerts resolved',
    value: '87%',
    deltaKey: 'dashboard.stats.items.risk.delta',
    fallbackDelta: 'Response time ↓ 18%',
    icon: <Bolt fontSize="small" />,
  },
];

const baseFeatureShortcuts = [
  {
    titleKey: 'dashboard.modules.cropPredictor.title',
    descriptionKey: 'dashboard.modules.cropPredictor.description',
    icon: <Agriculture fontSize="medium" />,
    path: '/dashboard/crop-predictor',
  },
  {
    titleKey: 'dashboard.modules.diseaseDetector.title',
    descriptionKey: 'dashboard.modules.diseaseDetector.description',
    icon: <LocalHospital fontSize="medium" />,
    path: '/dashboard/disease-detector',
  },
  {
    titleKey: 'dashboard.modules.financialDashboard.title',
    descriptionKey: 'dashboard.modules.financialDashboard.description',
    icon: <TrendingUp fontSize="medium" />,
    path: '/dashboard/financial-dashboard',
  },
  {
    titleKey: 'dashboard.modules.communityForum.title',
    descriptionKey: 'dashboard.modules.communityForum.description',
    icon: <Forum fontSize="medium" />,
    path: '/dashboard/community-forum',
  },
  {
    titleKey: 'dashboard.modules.chatbot.title',
    descriptionKey: 'dashboard.modules.chatbot.description',
    icon: <Chat fontSize="medium" />,
    path: '/dashboard/chatbot',
  },
];

const baseYieldTrendData = [
  { monthKey: 'mar', yield: 42 },
  { monthKey: 'apr', yield: 48 },
  { monthKey: 'may', yield: 57 },
  { monthKey: 'jun', yield: 63 },
  { monthKey: 'jul', yield: 71 },
  { monthKey: 'aug', yield: 76 },
  { monthKey: 'sep', yield: 83 },
];

const baseSoilHealthSignals = [
  {
    titleKey: 'dashboard.soil.signals.moisture.title',
    fallbackTitle: 'Soil moisture',
    score: '68%',
    stateKey: 'dashboard.soil.signals.moisture.state',
    fallbackState: 'Optimal',
    tone: 'success',
  },
  {
    titleKey: 'dashboard.soil.signals.nutrients.title',
    fallbackTitle: 'Nutrient balance',
    score: 'Moderate',
    stateKey: 'dashboard.soil.signals.nutrients.state',
    fallbackState: 'Add organic matter',
    tone: 'warning',
  },
  {
    titleKey: 'dashboard.soil.signals.pest.title',
    fallbackTitle: 'Pest pressure',
    score: 'Low',
    stateKey: 'dashboard.soil.signals.pest.state',
    fallbackState: 'Scouting recommended next week',
    tone: 'info',
  },
  {
    titleKey: 'dashboard.soil.signals.weather.title',
    fallbackTitle: 'Weather risk',
    score: 'Alert',
    stateKey: 'dashboard.soil.signals.weather.state',
    fallbackState: 'High winds predicted Friday',
    tone: 'error',
  },
];

const baseQuickInsights = [
  { labelKey: 'dashboard.quickInsights.irrigation', icon: <Timeline fontSize="small" />, accent: 'primary.main' },
  { labelKey: 'dashboard.quickInsights.mandi', icon: <Map fontSize="small" />, accent: 'secondary.main' },
];

type WeatherErrorType = 'fetch' | 'denied' | 'unsupported';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const defaultStats = useMemo(
    () =>
      baseStatHighlights.map((stat) => ({
        label: t(stat.labelKey),
        value: stat.value,
        delta: t(stat.deltaKey),
        icon: stat.icon,
      })),
    [t]
  );

  const statLabelMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    baseStatHighlights.forEach((stat) => {
      map[stat.fallbackLabel] = t(stat.labelKey);
    });
    return map;
  }, [t]);

  const statDeltaMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    baseStatHighlights.forEach((stat) => {
      map[stat.fallbackDelta] = t(stat.deltaKey);
    });
    return map;
  }, [t]);

  const quickInsightChips = useMemo(
    () =>
      baseQuickInsights.map((insight) => ({
        ...insight,
        label: t(insight.labelKey),
      })),
    [t]
  );

  const defaultYieldData = useMemo(
    () => baseYieldTrendData.map((entry) => ({ month: t(`dashboard.months.${entry.monthKey}`), yield: entry.yield })),
    [t]
  );

  const defaultSoilSignals = useMemo(
    () =>
      baseSoilHealthSignals.map((signal) => ({
        title: t(signal.titleKey),
        score: signal.score,
        state: t(signal.stateKey),
        tone: signal.tone,
      })),
    [t]
  );

  const soilTitleMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    baseSoilHealthSignals.forEach((signal) => {
      map[signal.fallbackTitle] = t(signal.titleKey);
    });
    return map;
  }, [t]);

  const soilStateMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    baseSoilHealthSignals.forEach((signal) => {
      map[signal.fallbackState] = t(signal.stateKey);
    });
    return map;
  }, [t]);

  const featureShortcuts = useMemo(
    () =>
      baseFeatureShortcuts.map((feature) => ({
        title: t(feature.titleKey),
        description: t(feature.descriptionKey),
        icon: feature.icon,
        path: feature.path,
      })),
    [t]
  );

  const [weather, setWeather] = useState<{ temperature: number; condition?: string; humidity?: number; description?: string | null } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<WeatherErrorType | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<any[] | null>(null);
  const [yieldData, setYieldData] = useState<any[] | null>(null);
  const [soilSignals, setSoilSignals] = useState<any[] | null>(null);

  const fetchWeatherData = useCallback(async (lat: number, lon: number) => {
    try {
      setWeatherError(null);
      const response = await axios.get(`${API_BASE}/api/weather/current?lat=${lat}&lon=${lon}`);

      if (response.data.success) {
        const weatherData = response.data.current;
        const locationData = response.data.location;
        setWeather({
          temperature: Math.round(weatherData.temperature),
          condition: weatherData.main,
          humidity: weatherData.humidity,
          description: weatherData.description || null,
        });
        setLocation(locationData.name || null);
      } else {
        throw new Error(response.data.error || 'Failed to fetch weather');
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
      setWeatherError('fetch');
      setLocation(null);
      setWeather({
        temperature: 22,
        condition: 'Sunny',
        humidity: 65,
        description: null,
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
          setWeatherError('denied');
          setLocation(null);
          setWeatherLoading(false);
          setWeather({
            temperature: 22,
            condition: 'Sunny',
            humidity: 65,
            description: null,
          });
        }
      );
    } else {
      setWeatherError('unsupported');
      setLocation(null);
      setWeatherLoading(false);
    }
  }, [fetchWeatherData]);

  useEffect(() => {
    getUserLocation();
    fetchDashboardData();
  }, [getUserLocation, fetchDashboardData]);

  const statsToDisplay = useMemo(() => {
    if (dashboardStats && dashboardStats.length > 0) {
      return dashboardStats.map((stat, index) => {
        const baseIndex = index % defaultStats.length;
        const base = defaultStats[baseIndex];
        const baseKeys = baseStatHighlights[baseIndex];
        const label = stat.labelKey
          ? t(stat.labelKey)
          : typeof stat.label === 'string'
          ? statLabelMap[stat.label] || stat.label
          : base.label;
        const delta = stat.deltaKey
          ? t(stat.deltaKey)
          : typeof stat.delta === 'string'
          ? statDeltaMap[stat.delta] || stat.delta
          : base.delta;
        return {
          ...base,
          ...stat,
          label,
          delta,
          icon: stat.icon || base.icon || baseKeys.icon,
          value: stat.value || base.value,
        };
      });
    }
    return defaultStats;
  }, [dashboardStats, defaultStats, statLabelMap, statDeltaMap, t]);

  const soilSignalItems = useMemo(() => {
    if (soilSignals && soilSignals.length > 0) {
      return soilSignals.map((signal, index) => {
        const baseIndex = index % defaultSoilSignals.length;
        const base = defaultSoilSignals[baseIndex];
        const title = signal.titleKey
          ? t(signal.titleKey)
          : soilTitleMap[signal.title as keyof typeof soilTitleMap] || signal.title || base.title;
        const state = signal.stateKey
          ? t(signal.stateKey)
          : soilStateMap[signal.state as keyof typeof soilStateMap] || signal.state || base.state;
        return {
          ...base,
          ...signal,
          title,
          state,
          score: signal.score || base.score,
          tone: signal.tone || base.tone,
        };
      });
    }
    return defaultSoilSignals;
  }, [soilSignals, defaultSoilSignals, soilTitleMap, soilStateMap, t]);

  const yieldChartData = useMemo(
    () => (yieldData && yieldData.length > 0 ? yieldData : defaultYieldData),
    [yieldData, defaultYieldData]
  );

  const weatherErrorMessage = weatherError ? t(`dashboard.weather.errors.${weatherError}`) : null;
  const locationLabel = location ?? t('dashboard.weather.locationFallback');
  const weatherDescription = weather?.description ?? t('dashboard.weather.descriptionFallback');
  const humidityLabel =
    weather && typeof weather.humidity === 'number'
      ? t('dashboard.weather.humidity', { value: weather.humidity })
      : null;

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
              label={t('dashboard.hero.badge')}
              size="small"
              className="chip-muted"
              icon={<ShowChart fontSize="small" />}
              sx={{ mb: 2 }}
            />
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              {t('dashboard.hero.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520, mb: 3 }}>
              {t('dashboard.hero.subtitle')}
            </Typography>
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              {quickInsightChips.map((insight, index) => (
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
                {t('dashboard.hero.primaryCta')}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/dashboard/chatbot')}
              >
                {t('dashboard.hero.secondaryCta')}
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
              {t('dashboard.weather.title')}
            </Typography>

            {weatherErrorMessage && (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                {weatherErrorMessage}
              </Alert>
            )}

            {weatherLoading ? (
              <Chip
                icon={<CircularProgress size={16} />}
                label={t('dashboard.weather.loading')}
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
                    {weatherDescription}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip icon={<LocationOn />} label={locationLabel} size="small" sx={{ borderRadius: '999px' }} />
                    <Chip icon={<Thermostat />} label={`${weather?.temperature ?? 22}°C`} size="small" sx={{ borderRadius: '999px' }} />
                    {humidityLabel && (
                      <Chip icon={<Water />} label={humidityLabel} size="small" sx={{ borderRadius: '999px' }} />
                    )}
                  </Stack>
                </Box>
              </Stack>
            )}
          </Box>
        </Box>
      </Card>

      <Box className="layout-grid three">
        {statsToDisplay.length > 0 ? statsToDisplay.map((stat, index) => (
          <Card key={`${stat.label}-${index}`} className="surface-card">
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
          <Typography>{t('dashboard.stats.loading')}</Typography>
        )}
      </Box>

      <Box className="layout-grid two">
        <Card className="surface-card" sx={{ p: { xs: 2.5, md: 3 } }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            {t('dashboard.yield.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('dashboard.yield.description')}
          </Typography>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={yieldChartData}>
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
            {t('dashboard.readiness.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('dashboard.readiness.description')}
          </Typography>
          <Stack spacing={2.2}>
            {soilSignalItems && soilSignalItems.length > 0 ? soilSignalItems.map((signal, index) => (
              <Box
                key={`${signal.title}-${index}`}
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
              <Typography>{t('dashboard.readiness.loading')}</Typography>
            )}
          </Stack>
        </Card>
      </Box>

      <Card className="surface-card" sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {t('dashboard.modules.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('dashboard.modules.description')}
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