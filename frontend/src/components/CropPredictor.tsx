// Clean FINAL implementation of CropPredictor. All legacy/duplicate code removed.
import React, { useMemo, useState } from 'react';
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
} from '@mui/icons-material';
import axios from 'axios';
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

interface PredictionRequest { crop_type:string; state:string; season:string; year:number; area:number; annual_rainfall:number; fertilizer:number; pesticide:number; temperature:number; humidity:number; ph:number; rainfall:number; nitrogen:number; phosphorus:number; potassium:number; }
interface PredictionResponse { success:boolean; predicted_yield?:number; yield_unit?:string; confidence_interval?:{lower:number;upper:number}; feature_importance?:Record<string,number>; model_confidence?:number; error?:string; }

const STATES = ['Andhra Pradesh','Assam','Bihar','Gujarat','Haryana','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan','Tamil Nadu','Uttar Pradesh','West Bengal'];
const CROPS = ['Rice','Wheat','Maize','Cotton','Sugarcane','Groundnut','Soybean','Jowar','Bajra','Barley','Gram','Tur','Sunflower'];
const SEASONS = ['Kharif','Rabi','Summer','Whole Year'];
const INITIAL:PredictionRequest = { crop_type:'', state:'', season:'', year:new Date().getFullYear(), area:0, annual_rainfall:0, fertilizer:0, pesticide:0, temperature:25, humidity:70, ph:6.5, rainfall:1000, nitrogen:80, phosphorus:40, potassium:60 };
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

type SliderKey = 'temperature' | 'humidity' | 'ph' | 'rainfall';

const NUTRIENT_TARGETS = { nitrogen: 120, phosphorus: 60, potassium: 60 } as const;
const IDEAL_WEATHER = { temperature: 27, humidity: 65, rainfall: 900 } as const;

const sliderConfigs: Array<{ key: SliderKey; label: string; min: number; max: number; step: number; unit: string; icon: React.ReactNode; helper: string; color: string }> = [
  {
    key: 'temperature',
    label: 'Temperature',
    min: 10,
    max: 45,
    step: 1,
    unit: '°C',
    icon: <CloudQueue fontSize="small" color="warning" />,
    helper: 'Average daytime field temperature',
    color: '#F57C00',
  },
  {
    key: 'humidity',
    label: 'Humidity',
    min: 20,
    max: 100,
    step: 1,
    unit: '%',
    icon: <Opacity fontSize="small" color="primary" />,
    helper: 'Relative humidity during crop cycle',
    color: '#00796B',
  },
  {
    key: 'ph',
    label: 'Soil pH',
    min: 4.5,
    max: 8.5,
    step: 0.1,
    unit: '',
    icon: <Yard fontSize="small" color="success" />,
    helper: 'Soil acidity / alkalinity level',
    color: '#6D4C41',
  },
  {
    key: 'rainfall',
    label: 'Seasonal Rainfall',
    min: 200,
    max: 2000,
    step: 10,
    unit: 'mm',
    icon: <Opacity fontSize="small" color="info" />,
    helper: 'Rainfall expected across the growing season',
    color: '#0288D1',
  },
];

const CropPredictor:React.FC = () => {
  const [form,setForm] = useState(INITIAL);
  const [prediction,setPrediction] = useState<PredictionResponse|null>(null);
  const [loading,setLoading] = useState(false);
  const [training,setTraining] = useState(false);
  const [alert,setAlert] = useState<{type:'success'|'error';message:string}|null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const setField = <K extends keyof PredictionRequest>(k:K,v:PredictionRequest[K]) => setForm(p=>({...p,[k]:v}));
  const disabled = loading || training || !form.crop_type || !form.state || !form.season;

  const handleSelectChange = (key: keyof PredictionRequest) => (event: SelectChangeEvent) => {
    setField(key, event.target.value as PredictionRequest[typeof key]);
  };

  const handleNumberChange = (key: keyof PredictionRequest) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setField(key, (Number.isNaN(value) ? 0 : value) as PredictionRequest[typeof key]);
  };

  const handleSliderChange = (key: SliderKey) => (_: Event, value: number | number[]) => {
    const numericValue = Array.isArray(value) ? value[0] : value;
    setField(key, Number(numericValue) as PredictionRequest[typeof key]);
  };

  const handleReset = () => {
    setForm(INITIAL);
    setPrediction(null);
    setAlert(null);
  };

  const nutrientData = useMemo(() => ([
    { name: 'Nitrogen', actual: form.nitrogen, ideal: NUTRIENT_TARGETS.nitrogen },
    { name: 'Phosphorus', actual: form.phosphorus, ideal: NUTRIENT_TARGETS.phosphorus },
    { name: 'Potassium', actual: form.potassium, ideal: NUTRIENT_TARGETS.potassium },
  ]), [form.nitrogen, form.phosphorus, form.potassium]);

  const weatherData = useMemo(() => ([
    { metric: 'Temperature', actual: form.temperature, ideal: IDEAL_WEATHER.temperature },
    { metric: 'Humidity', actual: form.humidity, ideal: IDEAL_WEATHER.humidity },
    { metric: 'Rainfall', actual: form.rainfall, ideal: IDEAL_WEATHER.rainfall },
  ]), [form.temperature, form.humidity, form.rainfall]);

  const featureData = useMemo(() => {
    if (!prediction?.feature_importance) return [];
    return Object.entries(prediction.feature_importance)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, importance: Number((value * 100).toFixed(2)) }));
  }, [prediction]);

  const computedTips = useMemo(() => {
    const tips: string[] = [];
    if (form.ph < 6) tips.push('Soil is slightly acidic; consider adding lime or organic compost to balance pH.');
    if (form.ph > 7.5) tips.push('Soil is alkaline; add organic matter or gypsum to nudge pH closer to 6.5-7.');
    if (form.nitrogen < 60) tips.push('Nitrogen is on the lower side—add urea or green manure to boost growth.');
    if (form.phosphorus < 35) tips.push('Phosphorus is low; single super phosphate can help root development.');
    if (form.potassium < 40) tips.push('Consider potash application to strengthen stems and disease resistance.');
    if (form.humidity > 85) tips.push('High humidity—monitor for fungal disease and ensure field ventilation.');
    if (form.rainfall < 500) tips.push('Rainfall is limited; plan supplemental irrigation or mulching.');
    if (form.fertilizer > 700000) tips.push('Fertilizer input is quite high; split doses to avoid nutrient loss.');
    return tips;
  }, [form]);

  const predict = async () => {
    if (loading) return; setLoading(true); setPrediction(null);
    try {
      const { data } = await axios.post(`${API_BASE}/api/predict-yield`, form);
      setPrediction(data);
      setAlert({ type: data.success ? 'success':'error', message: data.success ? 'Prediction successful' : (data.error || 'Prediction failed') });
    } catch (e) {
      console.error(e);
      setAlert({ type:'error', message:'Server error during prediction'});
    } finally { setLoading(false); }
  };
  const train = async () => {
    if (training) return; setTraining(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/train-model`);
      setAlert({ type: data.success ? 'success':'error', message: data.success ? 'Training started/completed' : (data.error || 'Training failed') });
    } catch (e) {
      console.error(e);
      setAlert({ type:'error', message:'Server error during training'});
    } finally { setTraining(false); }
  };

  return (
    <Box sx={{ minHeight: 'calc(100vh - 120px)', background: 'transparent' }}>
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={4}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 4,
              background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 60%, #A5D6A7 100%)',
              color: 'common.white',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'url(https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1600&q=60)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Agriculture sx={{ fontSize: 48 }} />
                  <Typography variant={isMobile ? 'h4' : 'h3'} fontWeight={700}>
                    Smart Crop Yield Planner
                  </Typography>
                </Box>
                <Chip
                  label="Farmer-friendly • Mobile-first • Insight rich"
                  sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'common.white', fontWeight: 600 }}
                />
              </Stack>
              <Typography variant="body1" sx={{ maxWidth: 720, opacity: 0.9 }}>
                Enter soil health, weather, and crop choices in a few taps. We highlight the projected yield and translate complex
                model insights into plain-language tips you can act on in the field.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<TrendingUp />}
                  onClick={predict}
                  disabled={disabled}
                >
                  {loading ? 'Predicting…' : 'Predict Yield'}
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<Refresh />}
                  onClick={handleReset}
                >
                  Reset Inputs
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Box
            sx={{
              display: 'grid',
              gap: { xs: 3, md: 4 },
              gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' },
            }}
          >
            <Box>
              <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
                <Stack spacing={3}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Typography variant="h5" fontWeight={600} color="primary.dark">
                        Field & Soil Details
                      </Typography>
                      <MuiTooltip title="These basics help the model compare your field with similar farms in our dataset.">
                        <IconButton size="small" color="primary">
                          <InfoOutlined fontSize="small" />
                        </IconButton>
                      </MuiTooltip>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Keep it simple: select crop, state, season, and enter a few quick numbers. Sliders make fine-tuning easy on mobile.
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
                      <InputLabel>Crop</InputLabel>
                      <Select
                        label="Crop"
                        value={form.crop_type}
                        onChange={handleSelectChange('crop_type')}
                      >
                        {CROPS.map(c => (
                          <MenuItem key={c} value={c}>{c}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel>State</InputLabel>
                      <Select
                        label="State"
                        value={form.state}
                        onChange={handleSelectChange('state')}
                      >
                        {STATES.map(s => (
                          <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel>Season</InputLabel>
                      <Select
                        label="Season"
                        value={form.season}
                        onChange={handleSelectChange('season')}
                      >
                        {SEASONS.map(s => (
                          <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Season Year"
                      type="number"
                      value={form.year}
                      onChange={handleNumberChange('year')}
                      fullWidth
                      InputProps={{
                        endAdornment: <InputAdornment position="end">yr</InputAdornment>,
                      }}
                    />
                    <TextField
                      label="Field Area"
                      type="number"
                      value={form.area}
                      onChange={handleNumberChange('area')}
                      fullWidth
                      InputProps={{ endAdornment: <InputAdornment position="end">ha</InputAdornment> }}
                    />
                    <TextField
                      label="Annual Rainfall"
                      type="number"
                      value={form.annual_rainfall}
                      onChange={handleNumberChange('annual_rainfall')}
                      fullWidth
                      InputProps={{ endAdornment: <InputAdornment position="end">mm</InputAdornment> }}
                    />
                    <TextField
                      label="Fertilizer"
                      type="number"
                      value={form.fertilizer}
                      onChange={handleNumberChange('fertilizer')}
                      fullWidth
                      InputProps={{ endAdornment: <InputAdornment position="end">kg/ha</InputAdornment> }}
                    />
                    <TextField
                      label="Pesticide"
                      type="number"
                      value={form.pesticide}
                      onChange={handleNumberChange('pesticide')}
                      fullWidth
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
                      label="Nitrogen"
                      type="number"
                      value={form.nitrogen}
                      onChange={handleNumberChange('nitrogen')}
                      fullWidth
                      InputProps={{ endAdornment: <InputAdornment position="end">kg/ha</InputAdornment> }}
                    />
                    <TextField
                      label="Phosphorus"
                      type="number"
                      value={form.phosphorus}
                      onChange={handleNumberChange('phosphorus')}
                      fullWidth
                      InputProps={{ endAdornment: <InputAdornment position="end">kg/ha</InputAdornment> }}
                    />
                    <TextField
                      label="Potassium"
                      type="number"
                      value={form.potassium}
                      onChange={handleNumberChange('potassium')}
                      fullWidth
                      InputProps={{ endAdornment: <InputAdornment position="end">kg/ha</InputAdornment> }}
                    />
                  </Box>

                  <Divider />

                  <Stack spacing={2}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Quick Adjustments
                    </Typography>
                    {sliderConfigs.map(config => (
                      <Box key={config.key}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {config.icon}
                            <Typography variant="subtitle2">{config.label}</Typography>
                            <MuiTooltip title={config.helper}>
                              <InfoOutlined fontSize="small" color="action" />
                            </MuiTooltip>
                          </Stack>
                          <Chip
                            size="small"
                            label={`${form[config.key].toFixed(config.step < 1 ? 1 : 0)} ${config.unit}`.trim()}
                            sx={{ backgroundColor: 'rgba(46, 125, 50, 0.1)', color: 'primary.dark' }}
                          />
                        </Stack>
                        <Slider
                          value={form[config.key]}
                          min={config.min}
                          max={config.max}
                          step={config.step}
                          onChange={handleSliderChange(config.key)}
                          valueLabelDisplay="auto"
                          sx={{ color: config.color, mt: 1 }}
                        />
                      </Box>
                    ))}
                  </Stack>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems="flex-start">
                    <Button
                      variant="contained"
                      size="large"
                      color="primary"
                      fullWidth={isMobile}
                      disabled={disabled}
                      startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <TrendingUp />}
                      onClick={predict}
                    >
                      {loading ? 'Predicting…' : 'Predict Yield'}
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      color="secondary"
                      fullWidth={isMobile}
                      disabled={training}
                      startIcon={training ? <CircularProgress size={18} color="inherit" /> : <Science />}
                      onClick={train}
                    >
                      {training ? 'Training…' : 'Train Model'}
                    </Button>
                    <Button
                      variant="text"
                      size="large"
                      color="inherit"
                      fullWidth={isMobile}
                      startIcon={<Refresh />}
                      onClick={handleReset}
                    >
                      Reset
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            </Box>

            <Box>
              <Stack spacing={3}>
                <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, background: 'linear-gradient(160deg, #FFFDE7 0%, #F1F8E9 70%)' }}>
                  {prediction ? (
                    prediction.success ? (
                      <Stack spacing={2}>
                        <Typography variant="h5" fontWeight={700} color="primary.dark">
                          Projected Yield
                        </Typography>
                        <Typography variant={isMobile ? 'h3' : 'h2'} fontWeight={700} color="primary.main">
                          {prediction.predicted_yield?.toFixed(2)} {prediction.yield_unit || 'ton/ha'}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {prediction.model_confidence !== undefined && (
                            <Chip
                              icon={<HealthAndSafety fontSize="small" />}
                              label={`Confidence ${(prediction.model_confidence * 100).toFixed(1)}%`}
                              color="primary"
                              variant="outlined"
                            />
                          )}
                          <Chip
                            icon={<LightbulbCircle fontSize="small" />}
                            label={`Area ${form.area} ha`}
                            sx={{ backgroundColor: 'rgba(255, 143, 0, 0.12)', color: 'warning.dark' }}
                          />
                        </Stack>
                        {prediction.confidence_interval && (
                          <Typography variant="body2" color="text.secondary">
                            Likely range: {prediction.confidence_interval.lower.toFixed(2)} – {prediction.confidence_interval.upper.toFixed(2)} {prediction.yield_unit || 'ton/ha'}
                          </Typography>
                        )}
                        {computedTips.length > 0 && (
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                              Quick field nudges
                            </Typography>
                            <Stack spacing={1}>
                              {computedTips.map((tip, idx) => (
                                <Typography key={idx} variant="body2" color="text.secondary">
                                  • {tip}
                                </Typography>
                              ))}
                            </Stack>
                          </Box>
                        )}
                      </Stack>
                    ) : (
                      <Alert severity="error">{prediction.error || 'Prediction failed. Please review inputs and try again.'}</Alert>
                    )
                  ) : (
                    <Stack spacing={2} alignItems="flex-start">
                      <Typography variant="h5" fontWeight={700} color="primary.dark">
                        Your yield will appear here
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Fill in the inputs on the left and hit “Predict Yield”. We’ll highlight the expected harvest and list
                        friendly tips right here.
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip icon={<TrendingUp />} label="Highlight yield" color="primary" />
                        <Chip icon={<LightbulbCircle />} label="Actionable tips" color="secondary" variant="outlined" />
                      </Stack>
                    </Stack>
                  )}
                </Paper>

                <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
                  <Typography variant="h6" fontWeight={600} color="primary.dark" gutterBottom>
                    Soil & Weather snapshot
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                    }}
                  >
                    <Box sx={{ height: 250 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={nutrientData}>
                          <PolarGrid stroke="#cfd8dc" />
                          <PolarAngleAxis dataKey="name" stroke="#4E342E" />
                          <PolarRadiusAxis angle={90} domain={[0, 150]} tick={{ fill: '#6D4C41', fontSize: 11 }} />
                          <Radar name="Actual" dataKey="actual" stroke="#2E7D32" fill="#2E7D32" fillOpacity={0.5} />
                          <Radar name="Ideal" dataKey="ideal" stroke="#FFB300" fill="#FFB300" fillOpacity={0.2} />
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Box>
                    <Box sx={{ height: 250 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weatherData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#CFD8DC" />
                          <XAxis dataKey="metric" tick={{ fill: '#37474F' }} />
                          <YAxis tick={{ fill: '#37474F' }} />
                          <RechartsTooltip />
                          <Area type="monotone" dataKey="ideal" stroke="#FFB300" fill="#FFE082" strokeWidth={2} name="Ideal" />
                          <Area type="monotone" dataKey="actual" stroke="#2E7D32" fill="#A5D6A7" strokeWidth={3} name="Your field" />
                          <Legend />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                </Paper>

                {featureData.length > 0 && (
                  <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={600} color="primary.dark" gutterBottom>
                      What drove this prediction?
                    </Typography>
                    <Box sx={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={featureData} layout="vertical" margin={{ left: 80 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} hide />
                          <YAxis type="category" dataKey="name" width={150} tick={{ fill: '#37474F', fontSize: 12 }} />
                          <RechartsTooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                          <Bar dataKey="importance" fill="#2E7D32" radius={[6, 6, 6, 6]}>
                            {featureData.map((entry, index) => (
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

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight={600} color="primary.dark" gutterBottom>
                  Farmer-first extras we recommend next
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
                  <Stack spacing={1.5} sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(46, 125, 50, 0.08)', height: '100%' }}>
                    <OfflineBolt color="primary" />
                    <Typography variant="subtitle1" fontWeight={600}>Offline mode</Typography>
                    <Typography variant="body2" color="text.secondary">Save latest predictions on-device so farmers can check them without network coverage.</Typography>
                  </Stack>
                  <Stack spacing={1.5} sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(255, 143, 0, 0.12)', height: '100%' }}>
                    <Language color="secondary" />
                    <Typography variant="subtitle1" fontWeight={600}>Local languages</Typography>
                    <Typography variant="body2" color="text.secondary">Offer the interface in popular regional languages with audio hints for non-readers.</Typography>
                  </Stack>
                  <Stack spacing={1.5} sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(158, 158, 158, 0.1)', height: '100%' }}>
                    <HealthAndSafety color="success" />
                    <Typography variant="subtitle1" fontWeight={600}>Crop health watch</Typography>
                    <Typography variant="body2" color="text.secondary">Daily tips on pest and disease alerts based on humidity, rainfall, and crop stage.</Typography>
                  </Stack>
                  <Stack spacing={1.5} sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(33, 150, 243, 0.1)', height: '100%' }}>
                    <CloudQueue color="info" />
                    <Typography variant="subtitle1" fontWeight={600}>Weather-aware reminders</Typography>
                    <Typography variant="body2" color="text.secondary">Push gentle alerts to irrigate, spray, or harvest when upcoming weather demands action.</Typography>
                  </Stack>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Stack>
      </Container>

      <Snackbar open={!!alert} autoHideDuration={6000} onClose={() => setAlert(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {alert ? (
          <Alert onClose={() => setAlert(null)} severity={alert.type} variant="filled">{alert.message}</Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
};

export default CropPredictor;