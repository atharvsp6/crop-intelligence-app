// Clean FINAL implementation of CropPredictor. All legacy/duplicate code removed.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Slider,
  Snackbar,
  Stack,
  TextField,
  Tooltip as MuiTooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Agriculture,
  TrendingUp,
  Science,
  Refresh,
  InfoOutlined,
  CloudQueue,
  Opacity,
  Yard,
  OfflineBolt,
  Language,
  HealthAndSafety,
  LightbulbCircle,
  SmartToy,
  CheckCircle,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE } from '../config';
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Legend,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n';

interface PredictionRequest {
  crop_type: string;
  state: string;
  season: string;
  year: number;
  area: number;
  annual_rainfall: number;
  fertilizer: number;
  pesticide: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

interface PredictionResponse {
  success: boolean;
  predicted_yield?: number;
  yield_unit?: string;
  confidence_interval?: {
    lower: number;
    upper: number;
  };
  feature_importance?: Record<string, number>;
  model_confidence?: number;
  prediction_source?: string;
  validation_applied?: boolean;
  original_ml_prediction?: number;
  gemini_confirmation?: number;
  confidence?: string;
  method?: string;
  error?: string;
}

interface AIRecommendations {
  yield_assessment?: string;
  fertilizer_recommendations?: {
    optimal_npk?: string;
    application_schedule?: string;
    organic_options?: string;
    micronutrients?: string;
  };
  irrigation_recommendations?: {
    frequency?: string;
    critical_stages?: string;
    methods?: string;
    water_management?: string;
  };
  planting_recommendations?: {
    optimal_dates?: string;
    variety_selection?: string;
    spacing?: string;
    soil_prep?: string;
  };
  improvement_potential?: {
    expected_increase?: string;
    timeline?: string;
    priority_actions?: string;
    investment_needed?: string;
  };
  cost_benefit?: {
    roi_estimate?: string;
    payback_period?: string;
    risk_factors?: string;
  };
}

interface ExtendedPredictionResponse extends PredictionResponse {
  ai_recommendations?: AIRecommendations;
  ai_recommendations_error?: string;
  ai_recommendations_language?: string;
}

const STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Gujarat',
  'Haryana',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Uttar Pradesh',
  'West Bengal',
];

const CROPS = [
  'Rice',
  'Wheat',
  'Maize',
  'Cotton',
  'Sugarcane',
  'Groundnut',
  'Soybean',
  'Jowar',
  'Bajra',
  'Barley',
  'Gram',
  'Tur',
  'Sunflower',
];

const SEASONS = ['Kharif', 'Rabi', 'Summer', 'Whole Year'];

const INITIAL_FORM: PredictionRequest = {
  crop_type: '',
  state: '',
  season: '',
  year: new Date().getFullYear(),
  area: 0,
  annual_rainfall: 0,
  fertilizer: 0,
  pesticide: 0,
  temperature: 25,
  humidity: 70,
  ph: 6.5,
  rainfall: 1000,
  nitrogen: 80,
  phosphorus: 40,
  potassium: 60,
};

type SliderKey = 'temperature' | 'humidity' | 'ph' | 'rainfall';

const sliderConfigs: Array<{
  key: SliderKey;
  labelKey: string;
  helperKey: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    key: 'temperature',
    labelKey: 'cropPredictor.form.sliders.temperature',
    helperKey: 'cropPredictor.form.sliders.helpers.temperature',
    min: 10,
    max: 45,
    step: 1,
    unit: '°C',
    icon: <CloudQueue fontSize="small" color="warning" />,
    color: '#F57C00',
  },
  {
    key: 'humidity',
    labelKey: 'cropPredictor.form.sliders.humidity',
    helperKey: 'cropPredictor.form.sliders.helpers.humidity',
    min: 20,
    max: 100,
    step: 1,
    unit: '%',
    icon: <Opacity fontSize="small" color="info" />,
    color: '#0288D1',
  },
  {
    key: 'ph',
    labelKey: 'cropPredictor.form.sliders.soilPh',
    helperKey: 'cropPredictor.form.sliders.helpers.soilPh',
    min: 4.5,
    max: 8.5,
    step: 0.1,
    unit: '',
    icon: <Yard fontSize="small" color="success" />,
    color: '#6D4C41',
  },
  {
    key: 'rainfall',
    labelKey: 'cropPredictor.form.sliders.seasonalRainfall',
    helperKey: 'cropPredictor.form.sliders.helpers.seasonalRainfall',
    min: 200,
    max: 2000,
    step: 10,
    unit: 'mm',
    icon: <Opacity fontSize="small" color="primary" />,
    color: '#00796B',
  },
];

const NUTRIENT_TARGETS = {
  nitrogen: 120,
  phosphorus: 60,
  potassium: 60,
};

const IDEAL_WEATHER = {
  temperature: 27,
  humidity: 65,
  rainfall: 900,
};

const CropPredictor: React.FC = () => {
  const [form, setForm] = useState<PredictionRequest>(INITIAL_FORM);
  const [prediction, setPrediction] = useState<ExtendedPredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t, i18n } = useTranslation();
  const aiSectionRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const [aiRefreshing, setAiRefreshing] = useState(false);

  const getLanguageLabel = useCallback((code: string) => {
    const entry = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
    return entry?.nativeName || entry?.label || code.toUpperCase();
  }, []);

  useEffect(() => {
    if (prediction?.success && prediction.ai_recommendations && aiSectionRef.current) {
      const timeoutId = window.setTimeout(() => {
        aiSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
      return () => window.clearTimeout(timeoutId);
    }
    return undefined;
  }, [prediction]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const setField = <K extends keyof PredictionRequest>(key: K, value: PredictionRequest[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectChange = (key: keyof PredictionRequest) => (event: SelectChangeEvent) => {
    setField(key, event.target.value as PredictionRequest[typeof key]);
  };

  const handleNumberChange = (key: keyof PredictionRequest) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setField(key, (Number.isNaN(value) ? 0 : value) as PredictionRequest[typeof key]);
  };

  const handleSliderChange = (key: SliderKey) => (_: Event, value: number | number[]) => {
    const numeric = Array.isArray(value) ? value[0] : value;
    setField(key, Number(numeric) as PredictionRequest[typeof key]);
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setPrediction(null);
    setAlert(null);
    setExpandedSections({});
  };

  const disabled = loading || training || !form.crop_type || !form.state || !form.season;

  const nutrientData = useMemo(
    () => [
      { name: 'Nitrogen', actual: form.nitrogen, ideal: NUTRIENT_TARGETS.nitrogen },
      { name: 'Phosphorus', actual: form.phosphorus, ideal: NUTRIENT_TARGETS.phosphorus },
      { name: 'Potassium', actual: form.potassium, ideal: NUTRIENT_TARGETS.potassium },
    ],
    [form.nitrogen, form.phosphorus, form.potassium],
  );

  const weatherData = useMemo(
    () => [
      { metric: 'Temperature', actual: form.temperature, ideal: IDEAL_WEATHER.temperature },
      { metric: 'Humidity', actual: form.humidity, ideal: IDEAL_WEATHER.humidity },
      { metric: 'Rainfall', actual: form.rainfall, ideal: IDEAL_WEATHER.rainfall },
    ],
    [form.temperature, form.humidity, form.rainfall],
  );

  const featureImportance = useMemo(() => {
    if (!prediction?.feature_importance) return [];
    return Object.entries(prediction.feature_importance)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, importance: Number((value * 100).toFixed(2)) }));
  }, [prediction]);

  const computedTips = useMemo(() => {
    const tips: string[] = [];
    if (form.ph < 6) tips.push(t('cropPredictor.tips.phLow'));
    if (form.ph > 7.5) tips.push(t('cropPredictor.tips.phHigh'));
    if (form.nitrogen < 60) tips.push(t('cropPredictor.tips.nitrogenLow'));
    if (form.phosphorus < 35) tips.push(t('cropPredictor.tips.phosphorusLow'));
    if (form.potassium < 40) tips.push(t('cropPredictor.tips.potassiumLow'));
    if (form.humidity > 85) tips.push(t('cropPredictor.tips.humidityHigh'));
    if (form.rainfall < 500) tips.push(t('cropPredictor.tips.rainfallLow'));
    if (form.fertilizer > 700000) tips.push(t('cropPredictor.tips.fertilizerHigh'));
    return tips;
  }, [form, t]);

  const requestPrediction = useCallback(
    async (
      options: {
        silent?: boolean;
        languageOverride?: string;
        allowDuringLoading?: boolean;
        background?: boolean;
      } = {},
    ) => {
      if (loadingRef.current && !options.allowDuringLoading) return;
      const targetLanguage = options.languageOverride ?? i18n.language;
      const languageLabel = getLanguageLabel(targetLanguage);
      if (options.background) {
        setAiRefreshing(true);
        setAlert({ type: 'info', message: t('cropPredictor.alerts.refreshingAI', { language: languageLabel }) });
      } else if (!options.silent) {
        setAlert(null);
      }
      if (!options.background) {
        setLoading(true);
      }
      loadingRef.current = true;
      try {
        const payload = { ...form, language: targetLanguage };
        const { data } = await axios.post<ExtendedPredictionResponse>(`${API_BASE}/api/predict-yield`, payload);
        
        // Console logging for prediction source (as requested)
        if (data.success) {
          if (data.method === 'statistical_fallback' || data.prediction_source === 'agricultural_statistics') {
            console.log('🔄 Using statistical fallback prediction method');
          } else if (data.prediction_source === 'gemini_ai') {
            console.log('🤖 Using Gemini AI prediction (validation applied)');
          } else if (data.validation_applied) {
            console.log('✅ ML prediction validated by Gemini AI');
          } else {
            console.log('🧠 Using machine learning prediction');
          }
        }
        
        setPrediction(data);
        if (data.success) {
          if (options.background) {
            setAlert({
              type: 'success',
              message: t('cropPredictor.alerts.aiRefreshed', { language: languageLabel }),
            });
          } else if (!options.silent) {
            setAlert({ type: 'success', message: t('cropPredictor.alerts.predictSuccess') });
          }
        } else {
          setAlert({ type: 'error', message: data.error || t('cropPredictor.alerts.predictFailure') });
        }
      } catch (error) {
        console.error(error);
        setAlert({ type: 'error', message: t('cropPredictor.alerts.predictError') });
      } finally {
        if (!options.background) {
          setLoading(false);
        }
        loadingRef.current = false;
        if (options.background) {
          setAiRefreshing(false);
        }
      }
    },
    [form, getLanguageLabel, i18n.language, t],
  );

  const predict = async (options?: { silent?: boolean }) => requestPrediction({ silent: options?.silent });

  useEffect(() => {
    if (!prediction?.success) return;
    if (prediction.ai_recommendations_language === i18n.language) return;
    requestPrediction({
      silent: true,
      languageOverride: i18n.language,
      allowDuringLoading: true,
      background: true,
    });
  }, [i18n.language, prediction?.ai_recommendations_language, prediction?.success, requestPrediction]);

  const train = async () => {
    if (training) return;
    setTraining(true);
    setAlert(null);
    try {
      const { data } = await axios.post<{ success: boolean; error?: string }>(
        `${API_BASE}/api/train-model`,
        { language: i18n.language },
      );
      if (data.success) {
        setAlert({ type: 'success', message: t('cropPredictor.alerts.trainSuccess') });
      } else {
        setAlert({ type: 'error', message: data.error || t('cropPredictor.alerts.trainFailure') });
      }
    } catch (error) {
      console.error(error);
      setAlert({ type: 'error', message: t('cropPredictor.alerts.trainError') });
    } finally {
      setTraining(false);
    }
  };

  const renderExpandableBlock = (key: string, text?: string, explicitKey?: string, limit = 180) => {
    if (!text) return null;
    const sectionKey = explicitKey ?? key;
    const expanded = !!expandedSections[sectionKey];
    const display = expanded || text.length <= limit ? text : `${text.slice(0, limit).trim()}…`;
    return (
      <Box key={sectionKey} sx={{ mt: 1 }}>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-line', opacity: 0.92 }}>
          {display}
        </Typography>
        {text.length > limit && (
          <Button
            size="small"
            color="success"
            variant="text"
            sx={{ mt: 0.5, px: 0.75, minWidth: 0 }}
            onClick={() => toggleSection(sectionKey)}
          >
            {expanded ? t('common.less') : t('common.more')}
          </Button>
        )}
      </Box>
    );
  };

  const renderLabeledExpandableBlock = (
    label: string,
    text?: string,
    key?: string,
    limit = 180,
  ) => {
    if (!text) return null;
    const sectionKey = key ?? label;
    const expanded = !!expandedSections[sectionKey];
    const display = expanded || text.length <= limit ? text : `${text.slice(0, limit).trim()}…`;
    return (
      <Box key={sectionKey} sx={{ mt: 0.75 }}>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-line', opacity: 0.92 }}>
          <strong>{label}:</strong> {display}
        </Typography>
        {text.length > limit && (
          <Button
            size="small"
            color="success"
            variant="text"
            sx={{ mt: 0.25, px: 0.75, minWidth: 0 }}
            onClick={() => toggleSection(sectionKey)}
          >
            {expanded ? t('common.less') : t('common.more')}
          </Button>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ minHeight: 'calc(100vh - 120px)' }}>
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={4}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden',
              color: 'common.white',
              background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 60%, #A5D6A7 100%)',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                opacity: 0.18,
                backgroundImage:
                  'url(https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1600&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <Stack spacing={2.5} sx={{ position: 'relative', zIndex: 1 }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                alignItems={{ xs: 'flex-start', md: 'center' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Agriculture sx={{ fontSize: { xs: 38, md: 48 } }} />
                  <Typography variant={isMobile ? 'h4' : 'h3'} fontWeight={700}>
                    {t('cropPredictor.hero.title')}
                  </Typography>
                </Box>
                <Chip
                  label={t('cropPredictor.hero.tagline')}
                  sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'common.white', fontWeight: 600 }}
                />
              </Stack>
              <Typography variant="body1" sx={{ maxWidth: 720, opacity: 0.92 }}>
                {t('cropPredictor.hero.subtitle')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<TrendingUp />}
                  onClick={() => predict()}
                  disabled={disabled}
                >
                  {loading ? t('cropPredictor.hero.predicting') : t('cropPredictor.hero.predictBtn')}
                </Button>
                <Button variant="outlined" color="inherit" startIcon={<Refresh />} onClick={handleReset}>
                  {t('cropPredictor.hero.resetBtn')}
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Box
            sx={{
              display: 'grid',
              gap: { xs: 3, md: 4 },
              gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' },
              gridTemplateAreas: {
                xs: prediction?.success ? `'form' 'right' 'ai' 'extras'` : `'form' 'right' 'extras'`,
                lg: prediction?.success ? `'form right' 'ai ai' 'extras extras'` : `'form right' 'extras extras'`,
              },
            }}
          >
            <Box sx={{ gridArea: 'form' }}>
              <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
                <Stack spacing={3.5}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Typography variant="h5" fontWeight={600} color="primary.dark">
                        {t('cropPredictor.form.sectionTitle')}
                      </Typography>
                      <MuiTooltip title={t('cropPredictor.form.sectionTooltip')}>
                        <IconButton size="small" color="primary">
                          <InfoOutlined fontSize="small" />
                        </IconButton>
                      </MuiTooltip>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {t('cropPredictor.form.sectionSubtitle')}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                    }}
                  >
                    <FormControl fullWidth>
                      <InputLabel>{t('cropPredictor.form.fields.crop')}</InputLabel>
                      <Select
                        label={t('cropPredictor.form.fields.crop')}
                        value={form.crop_type}
                        onChange={handleSelectChange('crop_type')}
                      >
                        {CROPS.map(crop => (
                          <MenuItem key={crop} value={crop}>
                            {crop}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel>{t('cropPredictor.form.fields.state')}</InputLabel>
                      <Select
                        label={t('cropPredictor.form.fields.state')}
                        value={form.state}
                        onChange={handleSelectChange('state')}
                      >
                        {STATES.map(state => (
                          <MenuItem key={state} value={state}>
                            {state}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel>{t('cropPredictor.form.fields.season')}</InputLabel>
                      <Select
                        label={t('cropPredictor.form.fields.season')}
                        value={form.season}
                        onChange={handleSelectChange('season')}
                      >
                        {SEASONS.map(season => (
                          <MenuItem key={season} value={season}>
                            {season}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label={t('cropPredictor.form.fields.year')}
                      type="number"
                      value={form.year}
                      onChange={handleNumberChange('year')}
                      InputProps={{ endAdornment: <InputAdornment position="end">yr</InputAdornment> }}
                    />
                    <TextField
                      label={t('cropPredictor.form.fields.area')}
                      type="number"
                      value={form.area}
                      onChange={handleNumberChange('area')}
                      InputProps={{ endAdornment: <InputAdornment position="end">ha</InputAdornment> }}
                    />
                    <TextField
                      label={t('cropPredictor.form.fields.annualRainfall')}
                      type="number"
                      value={form.annual_rainfall}
                      onChange={handleNumberChange('annual_rainfall')}
                      InputProps={{ endAdornment: <InputAdornment position="end">mm</InputAdornment> }}
                    />
                    <TextField
                      label={t('cropPredictor.form.fields.fertilizer')}
                      type="number"
                      value={form.fertilizer}
                      onChange={handleNumberChange('fertilizer')}
                      InputProps={{ endAdornment: <InputAdornment position="end">kg/ha</InputAdornment> }}
                    />
                    <TextField
                      label={t('cropPredictor.form.fields.pesticide')}
                      type="number"
                      value={form.pesticide}
                      onChange={handleNumberChange('pesticide')}
                      InputProps={{ endAdornment: <InputAdornment position="end">kg/ha</InputAdornment> }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                    }}
                  >
                    <TextField
                      label={t('cropPredictor.form.fields.nitrogen')}
                      type="number"
                      value={form.nitrogen}
                      onChange={handleNumberChange('nitrogen')}
                      InputProps={{ endAdornment: <InputAdornment position="end">kg/ha</InputAdornment> }}
                    />
                    <TextField
                      label={t('cropPredictor.form.fields.phosphorus')}
                      type="number"
                      value={form.phosphorus}
                      onChange={handleNumberChange('phosphorus')}
                      InputProps={{ endAdornment: <InputAdornment position="end">kg/ha</InputAdornment> }}
                    />
                    <TextField
                      label={t('cropPredictor.form.fields.potassium')}
                      type="number"
                      value={form.potassium}
                      onChange={handleNumberChange('potassium')}
                      InputProps={{ endAdornment: <InputAdornment position="end">kg/ha</InputAdornment> }}
                    />
                  </Box>

                  <Divider />

                  <Stack spacing={2}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {t('cropPredictor.form.sliders.title')}
                    </Typography>
                    {sliderConfigs.map(slider => (
                      <Box key={slider.key}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {slider.icon}
                            <Typography variant="subtitle2">{t(slider.labelKey)}</Typography>
                            <MuiTooltip title={t(slider.helperKey)}>
                              <InfoOutlined fontSize="small" color="disabled" />
                            </MuiTooltip>
                          </Stack>
                          <Chip
                            size="small"
                            label={`${form[slider.key].toFixed(slider.step < 1 ? 1 : 0)} ${slider.unit}`.trim()}
                            sx={{ backgroundColor: 'rgba(46,125,50,0.08)', color: 'primary.dark' }}
                          />
                        </Stack>
                        <Slider
                          value={form[slider.key]}
                          min={slider.min}
                          max={slider.max}
                          step={slider.step}
                          onChange={handleSliderChange(slider.key)}
                          valueLabelDisplay="auto"
                          sx={{ color: slider.color, mt: 1 }}
                        />
                      </Box>
                    ))}
                  </Stack>

                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    justifyContent="space-between"
                    alignItems={{ xs: 'stretch', md: 'center' }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      fullWidth={isMobile}
                      startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <TrendingUp />}
                      disabled={disabled}
                      onClick={() => predict()}
                    >
                      {loading ? t('cropPredictor.form.buttons.predicting') : t('cropPredictor.form.buttons.predict')}
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="large"
                      fullWidth={isMobile}
                      startIcon={training ? <CircularProgress size={18} color="inherit" /> : <Science />}
                      disabled={training}
                      onClick={train}
                    >
                      {training ? t('cropPredictor.form.buttons.training') : t('cropPredictor.form.buttons.train')}
                    </Button>
                    <Button
                      variant="text"
                      size="large"
                      color="inherit"
                      fullWidth={isMobile}
                      startIcon={<Refresh />}
                      onClick={handleReset}
                    >
                      {t('cropPredictor.form.buttons.reset')}
                    </Button>
                  </Stack>

                </Stack>
              </Paper>
            </Box>

            {prediction?.success && (
              <Box sx={{ gridArea: 'ai' }} ref={aiSectionRef}>
                <Paper
                  elevation={6}
                  sx={{
                    p: { xs: 2.5, md: 3.5 },
                    borderRadius: 4,
                    border: '1px solid rgba(76, 175, 80, 0.35)',
                    background:
                      'linear-gradient(135deg, rgba(0,30,0,0.85) 0%, rgba(20,60,20,0.85) 55%, rgba(46,125,50,0.65) 100%)',
                    color: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#C8E6C9' }}>
                      {t('cropPredictor.results.aiHeading')}
                    </Typography>
                    {prediction.ai_recommendations_language && (
                      <Chip
                        size="small"
                        variant="outlined"
                        color="success"
                        label={t('cropPredictor.results.aiLanguageChip', {
                          lang: getLanguageLabel(prediction.ai_recommendations_language),
                        })}
                        sx={{ bgcolor: 'rgba(76,175,80,0.12)' }}
                      />
                    )}
                    {aiRefreshing && (
                      <Chip
                        size="small"
                        color="success"
                        variant="filled"
                        label={t('cropPredictor.results.aiRefreshingChip')}
                        icon={<CircularProgress size={14} sx={{ color: 'inherit' }} />}
                        sx={{
                          bgcolor: 'rgba(76,175,80,0.22)',
                          color: '#E8F5E9',
                          '& .MuiChip-icon': { ml: '4px' },
                        }}
                      />
                    )}
                  </Stack>

                  {prediction.ai_recommendations_error && !prediction.ai_recommendations && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      {prediction.ai_recommendations_error}
                    </Alert>
                  )}

                  {prediction.ai_recommendations ? (
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', xl: 'row' }, gap: 3 }}>
                      <Stack flex={1} spacing={2}>
                        {prediction.ai_recommendations.yield_assessment && (
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: '#A5D6A7' }}>
                              {t('cropPredictor.results.aiSections.yield_assessment')}
                            </Typography>
                            {renderExpandableBlock(
                              'yield_assessment',
                              prediction.ai_recommendations.yield_assessment,
                              'yield_assessment',
                            )}
                          </Box>
                        )}

                        {prediction.ai_recommendations.improvement_potential && (
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: '#A5D6A7' }}>
                              {t('cropPredictor.results.aiSections.improvement_potential.title')}
                            </Typography>
                            <Stack spacing={0.5}>
                              {renderLabeledExpandableBlock(
                                t('cropPredictor.results.aiSections.improvement_potential.expected_increase'),
                                prediction.ai_recommendations.improvement_potential.expected_increase,
                                'imp_expected',
                              )}
                              {renderLabeledExpandableBlock(
                                t('cropPredictor.results.aiSections.improvement_potential.timeline'),
                                prediction.ai_recommendations.improvement_potential.timeline,
                                'imp_timeline',
                              )}
                              {renderLabeledExpandableBlock(
                                t('cropPredictor.results.aiSections.improvement_potential.priority_actions'),
                                prediction.ai_recommendations.improvement_potential.priority_actions,
                                'imp_priority',
                              )}
                              {renderLabeledExpandableBlock(
                                t('cropPredictor.results.aiSections.improvement_potential.investment_needed'),
                                prediction.ai_recommendations.improvement_potential.investment_needed,
                                'imp_invest',
                              )}
                            </Stack>
                          </Box>
                        )}
                      </Stack>

                      <Stack flex={1} spacing={2}>
                        {prediction.ai_recommendations.fertilizer_recommendations && (
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: '#A5D6A7' }}>
                              {t('cropPredictor.results.aiSections.fertilizer_recommendations.title')}
                            </Typography>
                            <Stack spacing={0.5}>
                              {renderLabeledExpandableBlock(
                                t('cropPredictor.results.aiSections.fertilizer_recommendations.optimal_npk'),
                                prediction.ai_recommendations.fertilizer_recommendations.optimal_npk,
                                'fert_optimal',
                              )}
                              {renderLabeledExpandableBlock(
                                t('cropPredictor.results.aiSections.fertilizer_recommendations.application_schedule'),
                                prediction.ai_recommendations.fertilizer_recommendations.application_schedule,
                                'fert_schedule',
                              )}
                              {renderLabeledExpandableBlock(
                                t('cropPredictor.results.aiSections.fertilizer_recommendations.organic_options'),
                                prediction.ai_recommendations.fertilizer_recommendations.organic_options,
                                'fert_organic',
                              )}
                              {renderLabeledExpandableBlock(
                                t('cropPredictor.results.aiSections.fertilizer_recommendations.micronutrients'),
                                prediction.ai_recommendations.fertilizer_recommendations.micronutrients,
                                'fert_micro',
                              )}
                            </Stack>
                          </Box>
                        )}

                        {prediction.ai_recommendations.planting_recommendations && (
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: '#A5D6A7' }}>
                              {t('cropPredictor.results.aiSections.planting_recommendations.title')}
                            </Typography>
                            <Stack spacing={0.5}>
                              {renderLabeledExpandableBlock(
                                t('cropPredictor.results.aiSections.planting_recommendations.optimal_dates'),
                                prediction.ai_recommendations.planting_recommendations.optimal_dates,
                                'plant_dates',
                              )}
                              {renderLabeledExpandableBlock(
                                t('cropPredictor.results.aiSections.planting_recommendations.variety_selection'),
                                prediction.ai_recommendations.planting_recommendations.variety_selection,
                                'plant_variety',
                              )}
                              {renderLabeledExpandableBlock(
                                t('cropPredictor.results.aiSections.planting_recommendations.spacing'),
                                prediction.ai_recommendations.planting_recommendations.spacing,
                                'plant_spacing',
                              )}
                              {renderLabeledExpandableBlock(
                                t('cropPredictor.results.aiSections.planting_recommendations.soil_prep'),
                                prediction.ai_recommendations.planting_recommendations.soil_prep,
                                'plant_soil',
                              )}
                            </Stack>
                          </Box>
                        )}
                      </Stack>

                      <Stack flex={1} spacing={2}>
                        {prediction.ai_recommendations.irrigation_recommendations && (
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: '#A5D6A7' }}>
                              {t('cropPredictor.results.aiSections.irrigation_recommendations.title')}
                            </Typography>
                            <Stack spacing={0.5}>
                              {renderLabeledExpandableBlock(
                                t('cropPredictor.results.aiSections.irrigation_recommendations.frequency'),
                                prediction.ai_recommendations.irrigation_recommendations.frequency,
                                'irrig_freq',
                              )}
                              {renderLabeledExpandableBlock(
                                t('cropPredictor.results.aiSections.irrigation_recommendations.critical_stages'),
                                prediction.ai_recommendations.irrigation_recommendations.critical_stages,
                                'irrig_stages',
                              )}
                              {renderLabeledExpandableBlock(
                                t('cropPredictor.results.aiSections.irrigation_recommendations.methods'),
                                prediction.ai_recommendations.irrigation_recommendations.methods,
                                'irrig_methods',
                              )}
                              {renderLabeledExpandableBlock(
                                t('cropPredictor.results.aiSections.irrigation_recommendations.water_management'),
                                prediction.ai_recommendations.irrigation_recommendations.water_management,
                                'irrig_water',
                              )}
                            </Stack>
                          </Box>
                        )}

                        {prediction.ai_recommendations.cost_benefit && (
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: '#A5D6A7' }}>
                              {t('cropPredictor.results.aiSections.cost_benefit.title')}
                            </Typography>
                            <Stack spacing={0.5}>
                              {renderLabeledExpandableBlock(
                                t('cropPredictor.results.aiSections.cost_benefit.roi_estimate'),
                                prediction.ai_recommendations.cost_benefit.roi_estimate,
                                'cost_roi',
                              )}
                              {renderLabeledExpandableBlock(
                                t('cropPredictor.results.aiSections.cost_benefit.payback_period'),
                                prediction.ai_recommendations.cost_benefit.payback_period,
                                'cost_payback',
                              )}
                              {renderLabeledExpandableBlock(
                                t('cropPredictor.results.aiSections.cost_benefit.risk_factors'),
                                prediction.ai_recommendations.cost_benefit.risk_factors,
                                'cost_risk',
                              )}
                            </Stack>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  ) : (
                    !prediction.ai_recommendations_error && (
                      <Typography variant="body2" sx={{ opacity: 0.85 }}>
                        {t('cropPredictor.results.aiUnavailable')}
                      </Typography>
                    )
                  )}
                </Paper>
              </Box>
            )}

            <Box sx={{ gridArea: 'right' }}>
              <Stack spacing={3}>
                <Paper
                  elevation={6}
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 3,
                    border: '1px solid rgba(129, 199, 132, 0.35)',
                    background:
                      'linear-gradient(145deg, rgba(0,40,20,0.92) 0%, rgba(18,75,35,0.88) 60%, rgba(76,175,80,0.74) 100%)',
                    color: 'rgba(236, 253, 245, 0.95)',
                    boxShadow: '0 18px 40px -16px rgba(0,0,0,0.45)',
                  }}
                >
                  {prediction ? (
                    prediction.success ? (
                      <Stack spacing={2}>
                        <Typography variant="h5" fontWeight={700} sx={{ color: '#C8E6C9' }}>
                          {t('cropPredictor.results.title')}
                        </Typography>
                        {prediction.predicted_yield !== undefined && (
                          <Typography
                            variant={isMobile ? 'h3' : 'h2'}
                            fontWeight={800}
                            sx={{ color: '#A5D6A7', textShadow: '0 8px 18px rgba(0,0,0,0.3)' }}
                          >
                            {prediction.predicted_yield.toFixed(2)} {prediction.yield_unit || 'ton/ha'}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {prediction.model_confidence !== undefined && (
                            <Chip
                              icon={<HealthAndSafety fontSize="small" />}
                              label={t('cropPredictor.results.confidence', {
                                value: (prediction.model_confidence * 100).toFixed(1),
                              })}
                              color="success"
                              variant="filled"
                              sx={{
                                bgcolor: 'rgba(129, 199, 132, 0.28)',
                                color: '#E8F5E9',
                                '& .MuiChip-icon': { color: '#B9F6CA' },
                              }}
                            />
                          )}
                          
                          <Chip
                            icon={<LightbulbCircle fontSize="small" />}
                            label={t('cropPredictor.results.areaChip', { value: form.area })}
                            sx={{
                              backgroundColor: 'rgba(255, 183, 77, 0.28)',
                              color: '#FFE0B2',
                              '& .MuiChip-icon': { color: '#FFE082' },
                            }}
                          />
                        </Stack>
                        {prediction.confidence_interval && (
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                            {t('cropPredictor.results.range', {
                              lower: prediction.confidence_interval.lower.toFixed(2),
                              upper: prediction.confidence_interval.upper.toFixed(2),
                              unit: prediction.yield_unit || 'ton/ha',
                            })}
                          </Typography>
                        )}
                        {computedTips.length > 0 && (
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: '#C5E1A5' }}>
                              {t('cropPredictor.results.tipsHeading')}
                            </Typography>
                            <Stack spacing={1}>
                              {computedTips.map((tip, index) => (
                                <Typography key={index} variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                                  • {tip}
                                </Typography>
                              ))}
                            </Stack>
                          </Box>
                        )}
                      </Stack>
                    ) : (
                      <Alert severity="error">{prediction.error || t('cropPredictor.results.error')}</Alert>
                    )
                  ) : (
                    <Stack spacing={2} alignItems="flex-start">
                      <Typography variant="h5" fontWeight={700} color="primary.dark">
                        {t('cropPredictor.results.emptyTitle')}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {t('cropPredictor.results.emptySubtitle')}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip icon={<TrendingUp />} label={t('cropPredictor.results.emptyHighlightChip')} color="primary" />
                        <Chip
                          icon={<LightbulbCircle />}
                          label={t('cropPredictor.results.emptyTipsChip')}
                          color="secondary"
                          variant="outlined"
                        />
                      </Stack>
                    </Stack>
                  )}
                </Paper>

                <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
                  <Typography variant="h6" fontWeight={600} color="primary.dark" gutterBottom>
                    {t('cropPredictor.snapshot.title')}
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                    }}
                  >
                    <Box sx={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={nutrientData}>
                          <PolarGrid stroke="#cfd8dc" />
                          <PolarAngleAxis dataKey="name" stroke="#4E342E" />
                          <PolarRadiusAxis angle={90} domain={[0, 150]} tick={{ fill: '#6D4C41', fontSize: 11 }} />
                          <Radar
                            name={t('cropPredictor.snapshot.nutrientActual')}
                            dataKey="actual"
                            stroke="#2E7D32"
                            fill="#2E7D32"
                            fillOpacity={0.5}
                          />
                          <Radar
                            name={t('cropPredictor.snapshot.nutrientIdeal')}
                            dataKey="ideal"
                            stroke="#FFB300"
                            fill="#FFB300"
                            fillOpacity={0.2}
                          />
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Box>
                    <Box sx={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weatherData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#CFD8DC" />
                          <XAxis dataKey="metric" tick={{ fill: '#37474F' }} />
                          <YAxis tick={{ fill: '#37474F' }} />
                          <RechartsTooltip />
                          <Area
                            type="monotone"
                            dataKey="ideal"
                            stroke="#FFB300"
                            fill="#FFE082"
                            strokeWidth={2}
                            name={t('cropPredictor.snapshot.weatherIdeal')}
                          />
                          <Area
                            type="monotone"
                            dataKey="actual"
                            stroke="#2E7D32"
                            fill="#A5D6A7"
                            strokeWidth={3}
                            name={t('cropPredictor.snapshot.weatherActual')}
                          />
                          <Legend />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                </Paper>

                {featureImportance.length > 0 && (
                  <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={600} color="primary.dark" gutterBottom>
                      {t('cropPredictor.features.title')}
                    </Typography>
                    <Box sx={{ height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={featureImportance} layout="vertical" margin={{ left: 80 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} hide />
                          <YAxis type="category" dataKey="name" width={150} tick={{ fill: '#37474F', fontSize: 12 }} />
                          <RechartsTooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                          <Bar dataKey="importance" radius={[6, 6, 6, 6]}>
                            {featureImportance.map((entry, index) => (
                              <Cell key={entry.name} fill={index === 0 ? '#1B5E20' : '#66BB6A'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                )}
              </Stack>
            </Box>

            <Box sx={{ gridArea: 'extras' }}>
              <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight={600} color="primary.dark" gutterBottom>
                  {t('cropPredictor.extras.title')}
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, minmax(0, 1fr))',
                      md: 'repeat(4, minmax(0, 1fr))',
                    },
                  }}
                >
                  <Stack
                    spacing={1.5}
                    sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(46, 125, 50, 0.08)', height: '100%' }}
                  >
                    <OfflineBolt color="primary" />
                    <Typography variant="subtitle1" fontWeight={600}>
                      {t('cropPredictor.extras.offline.title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('cropPredictor.extras.offline.description')}
                    </Typography>
                  </Stack>
                  <Stack
                    spacing={1.5}
                    sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(255, 143, 0, 0.12)', height: '100%' }}
                  >
                    <Language color="secondary" />
                    <Typography variant="subtitle1" fontWeight={600}>
                      {t('cropPredictor.extras.languages.title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('cropPredictor.extras.languages.description')}
                    </Typography>
                  </Stack>
                  <Stack
                    spacing={1.5}
                    sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(158, 158, 158, 0.1)', height: '100%' }}
                  >
                    <HealthAndSafety color="success" />
                    <Typography variant="subtitle1" fontWeight={600}>
                      {t('cropPredictor.extras.health.title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('cropPredictor.extras.health.description')}
                    </Typography>
                  </Stack>
                  <Stack
                    spacing={1.5}
                    sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(33, 150, 243, 0.1)', height: '100%' }}
                  >
                    <CloudQueue color="info" />
                    <Typography variant="subtitle1" fontWeight={600}>
                      {t('cropPredictor.extras.weather.title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('cropPredictor.extras.weather.description')}
                    </Typography>
                  </Stack>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Stack>
      </Container>

      <Snackbar
        open={!!alert}
        autoHideDuration={6000}
        onClose={() => setAlert(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {alert ? (
          <Alert onClose={() => setAlert(null)} severity={alert.type} variant="filled">
            {alert.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
};

export default CropPredictor;