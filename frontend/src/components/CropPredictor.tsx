// CropPredictor.tsx

// Clean FINAL implementation of CropPredictor. All legacy/duplicate code removed.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AlertColor,
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
  GpsFixed,
} from '@mui/icons-material';
import axios from 'axios';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { API_BASE } from '../config'; // Keep API_BASE, but we will fetch the token
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
import Chatbot, { ChatbotContext } from './predictor/Chatbot';

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
  ai_recommendations_source?: 'gemini' | 'rule_based' | string;
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

const STATE_CODE_MAP: Record<string, string> = {
  'in-ap': 'Andhra Pradesh',
  'in-as': 'Assam',
  'in-br': 'Bihar',
  'in-gj': 'Gujarat',
  'in-hr': 'Haryana',
  'in-ka': 'Karnataka',
  'in-kl': 'Kerala',
  'in-mp': 'Madhya Pradesh',
  'in-mh': 'Maharashtra',
  'in-or': 'Odisha',
  'in-pb': 'Punjab',
  'in-rj': 'Rajasthan',
  'in-tn': 'Tamil Nadu',
  'in-up': 'Uttar Pradesh',
  'in-wb': 'West Bengal',
};

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
const STATE_COORDINATES: Record<string, [number, number]> = {
  'Andhra Pradesh': [79.739987, 15.9129],
  Assam: [92.937576, 26.200604],
  Bihar: [85.313118, 25.096074],
  Gujarat: [71.192381, 22.258746],
  Haryana: [76.085602, 29.058776],
  Karnataka: [75.713888, 15.317277],
  Kerala: [76.271083, 10.850516],
  'Madhya Pradesh': [77.947, 23.473324],
  Maharashtra: [75.713888, 19.75148],
  Odisha: [85.098525, 20.951666],
  Punjab: [75.341218, 31.14713],
  Rajasthan: [74.217933, 27.023804],
  'Tamil Nadu': [78.656891, 11.127123],
  'Uttar Pradesh': [80.946166, 26.846708],
  'West Bengal': [87.855, 22.986757],
};

const STATE_ALIASES: Record<string, string> = {
  orissa: 'Odisha',
  odisha: 'Odisha',
  up: 'Uttar Pradesh',
  'uttar pradesh': 'Uttar Pradesh',
  uttarpradesh: 'Uttar Pradesh',
  'uttar-pradesh': 'Uttar Pradesh',
  mp: 'Madhya Pradesh',
  'madhya-pradesh': 'Madhya Pradesh',
  tn: 'Tamil Nadu',
  tamilnadu: 'Tamil Nadu',
  ap: 'Andhra Pradesh',
  andhrapradesh: 'Andhra Pradesh',
  wb: 'West Bengal',
  westbengal: 'West Bengal',
  maharastra: 'Maharashtra',
};

const DEFAULT_MAP_CENTER: [number, number] = [78.9629, 20.5937];
const DEFAULT_MAP_ZOOM = 4.1;

type AlertState = {
  type: AlertColor;
  message: string;
};

const CropPredictor: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [form, setForm] = useState<PredictionRequest>(INITIAL_FORM);
  const [prediction, setPrediction] = useState<ExtendedPredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [tempNumbers, setTempNumbers] = useState<Record<string, string>>({});
  const [aiRefreshing, setAiRefreshing] = useState(false);
  const [detectingState, setDetectingState] = useState(false);
  
  // --- NEW STATE FOR FETCHED MAPBOX TOKEN ---
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const aiSectionRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const pendingCenterRef = useRef<[number, number] | null>(null);
  
  // --- NEW: FETCH MAPBOX TOKEN ON COMPONENT MOUNT ---
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get<{ mapboxToken: string }>(`${API_BASE}/api/config`);
        const token = response.data?.mapboxToken;
        if (token) {
          setMapboxToken(token);
        } else {
          setMapError(t('cropPredictor.form.map.tokenMissingShort', {
            defaultValue: 'Mapbox token not provided by server.',
          }));
        }
      } catch (error) {
        console.error('Failed to fetch app config:', error);
        setMapError(t('cropPredictor.form.map.tokenMissingShort', {
          defaultValue: 'Could not fetch map configuration from server.',
        }));
      }
    };
    fetchConfig();
  }, [t]);


  const getLanguageLabel = useCallback(
    (code: string) => {
      const found = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
      return found?.nativeName || found?.label || code.toUpperCase();
    },
    [],
  );

  const toggleSection = useCallback((sectionKey: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  }, []);

  const updateField = useCallback(
    (key: keyof PredictionRequest, value: PredictionRequest[keyof PredictionRequest]) => {
      setForm(prev => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const matchStateName = useCallback((raw?: string | null) => {
    if (!raw) return undefined;
    const normalized = raw.trim().toLowerCase();
    if (!normalized) return undefined;

    if (STATE_CODE_MAP[normalized]) {
      return STATE_CODE_MAP[normalized];
    }

    const aliasDirect = STATE_ALIASES[normalized];
    if (aliasDirect) return aliasDirect;

    const collapsed = normalized.replace(/\s+/g, ' ');
    if (STATE_ALIASES[collapsed]) {
      return STATE_ALIASES[collapsed];
    }

    const direct = STATES.find(state => state.toLowerCase() === normalized);
    if (direct) return direct;

    const loose = STATES.find(state => normalized.includes(state.toLowerCase()));
    return loose;
  }, []);

  const updateMapLocation = useCallback(
    (lng: number, lat: number, options: { animate?: boolean; zoom?: number } = {}) => {
      const map = mapRef.current;
      if (!map || !map.isStyleLoaded()) {
        pendingCenterRef.current = [lng, lat];
        return;
      }

      if (!markerRef.current) {
        markerRef.current = new mapboxgl.Marker({ color: '#2E7D32' }).setLngLat([lng, lat]).addTo(map);
      } else {
        markerRef.current.setLngLat([lng, lat]);
      }

      const targetZoom = options.zoom ?? Math.max(map.getZoom(), 5);
      if (options.animate === false) {
        map.jumpTo({ center: [lng, lat], zoom: targetZoom });
      } else {
        map.easeTo({ center: [lng, lat], zoom: targetZoom, duration: 800 });
      }
    },
    [],
  );

  const syncStateSelection = useCallback(
    (stateName: string) => {
      const coords = STATE_COORDINATES[stateName];
      if (!coords) return;
      updateMapLocation(coords[0], coords[1]);
    },
    [updateMapLocation],
  );

  const handleSelectChange =
    (key: keyof PredictionRequest) => (event: SelectChangeEvent<unknown>) => {
      const value = event.target.value as PredictionRequest[typeof key];
      updateField(key, value);
      if (key === 'state' && typeof value === 'string') {
        setMapError(null);
        syncStateSelection(value);
      }
    };

  const handleNumberChange = (key: keyof PredictionRequest) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    setTempNumbers(prev => ({ ...prev, [key]: raw }));
    if (raw === '' || raw === '-' || raw === '.') {
      return;
    }
    const num = Number(raw);
    if (!Number.isNaN(num)) {
      updateField(key, num as PredictionRequest[typeof key]);
    }
  };

  const resolveNumberValue = (key: keyof PredictionRequest) => {
    if (tempNumbers[key] !== undefined) return tempNumbers[key];
    const current = form[key] as unknown as number;
    return current === 0 ? '' : String(current);
  };

  const handleSliderChange = (key: SliderKey) => (_: Event, value: number | number[]) => {
    const numeric = Array.isArray(value) ? value[0] : value;
    updateField(key, Number(numeric) as PredictionRequest[typeof key]);
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setTempNumbers({});
    setPrediction(null);
    setAlert(null);
    setExpandedSections({});
    setMapError(null);
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      mapRef.current.easeTo({ center: DEFAULT_MAP_CENTER, zoom: DEFAULT_MAP_ZOOM, duration: 600 });
    }
  };

  const fallbackStateLookup = useCallback(
    async (latitude: number, longitude: number) => {
      try {
        const bdcResp = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
        );
        const bdcJson = await bdcResp.json();
        const candidate =
          bdcJson.principalSubdivision ||
          bdcJson.locality ||
          bdcJson.city ||
          bdcJson?.localityInfo?.administrative?.[0]?.name;
        const matched = matchStateName(candidate);
        if (matched) {
          return matched;
        }
      } catch (error) {
        console.warn('BigDataCloud reverse geocode failed', error);
      }

      try {
        const nomResp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=5&addressdetails=1`,
          {
            headers: {
              Accept: 'application/json',
              'User-Agent': 'CropIntelligenceApp/1.0 (educational use)',
            },
          },
        );
        const nomJson = await nomResp.json();
        const fallback =
          nomJson.address?.state || nomJson.address?.region || nomJson.address?.state_district;
        const matched = matchStateName(fallback);
        if (matched) {
          return matched;
        }
      } catch (error) {
        console.warn('Nominatim reverse geocode failed', error);
      }

      return undefined;
    },
    [matchStateName],
  );

  const reverseGeocodeState = useCallback(
    async (lng: number, lat: number) => {
      if (!mapboxToken) return undefined;

      try {
        const params = new URLSearchParams({
          access_token: mapboxToken,
          types: 'region',
          country: 'IN',
          language: 'en',
          limit: '5',
        });
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?${params.toString()}`,
        );
        const data = await response.json();
        const features: any[] = Array.isArray(data?.features) ? data.features : [];
        for (const feature of features) {
          const candidates: string[] = [];
          const pushName = (value?: string) => {
            if (typeof value === 'string') {
              candidates.push(value);
            }
          };

          pushName(feature.text);
          if (typeof feature.place_name === 'string') {
            feature.place_name.split(',').forEach((part: string) => pushName(part.trim()));
          }

          if (Array.isArray(feature.context)) {
            feature.context.forEach((ctx: any) => {
              pushName(ctx?.text);
              pushName(ctx?.short_code);
            });
          }

          if (typeof feature?.properties?.short_code === 'string') {
            pushName(feature.properties.short_code);
          }

          for (const candidate of candidates) {
            const lower = candidate.toLowerCase();
            if (STATE_CODE_MAP[lower]) {
              return STATE_CODE_MAP[lower];
            }
            const matched = matchStateName(candidate);
            if (matched) {
              return matched;
            }
          }
        }
      } catch (error) {
        console.warn('Mapbox reverse geocode failed', error);
      }

      return undefined;
    },
    [matchStateName, mapboxToken],
  );

  const detectState = useCallback(async () => {
    if (detectingState) return;

    if (!mapboxToken) {
        const message = t('cropPredictor.form.map.tokenMissing', {
            defaultValue: 'Map functionality is disabled. The server did not provide a key.',
        });
        setMapError(message);
        setAlert({ type: 'error', message });
        return;
    }

    if (!('geolocation' in navigator)) {
      const message = t('cropPredictor.form.map.noGeolocation', {
        defaultValue: 'Geolocation is not supported in this browser. Please select your state manually.',
      });
      setMapError(message);
      setAlert({ type: 'error', message });
      return;
    }

    setDetectingState(true);
    setMapError(null);

    try {
      const position: GeolocationPosition = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });
      const { latitude, longitude } = position.coords;

      updateMapLocation(longitude, latitude);

      const primary = await reverseGeocodeState(longitude, latitude);
      const fallback = primary ?? (await fallbackStateLookup(latitude, longitude));

      if (fallback) {
        updateField('state', fallback as PredictionRequest['state']);
        setAlert({
          type: 'success',
          message: t('cropPredictor.form.map.detectedState', {
            defaultValue: 'Detected state: {{state}}',
            state: fallback,
          }),
        });
      } else {
        const message = t('cropPredictor.form.map.detectFailed', {
          defaultValue: 'Could not detect your state automatically. Please choose it manually.',
        });
        setMapError(message);
        setAlert({ type: 'error', message });
      }
    } catch (error: any) {
      let message = t('cropPredictor.form.map.detectError', {
        defaultValue: 'Failed to access your location.',
      });
      if (error?.code === 1) {
        message = t('cropPredictor.form.map.permissionDenied', {
          defaultValue: 'Location permission denied. Please select your state manually.',
        });
      } else if (error?.code === 2) {
        message = t('cropPredictor.form.map.positionUnavailable', {
          defaultValue: 'Location unavailable. Try again later.',
        });
      } else if (error?.code === 3) {
        message = t('cropPredictor.form.map.timeout', {
          defaultValue: 'Location request timed out. Try again.',
        });
      }
      setMapError(message);
      setAlert({ type: 'error', message });
    } finally {
      setDetectingState(false);
    }
  }, [detectingState, fallbackStateLookup, reverseGeocodeState, t, updateField, updateMapLocation, mapboxToken]);

  const handleMapClick = useCallback(
    async (event: mapboxgl.MapMouseEvent & mapboxgl.EventData) => {
      const { lng, lat } = event.lngLat;
      updateMapLocation(lng, lat);

      const matched =
        (await reverseGeocodeState(lng, lat)) ?? (await fallbackStateLookup(lat, lng));

      if (matched) {
        const alreadySelected = form.state === matched;
        updateField('state', matched as PredictionRequest['state']);
        setMapError(null);
        if (!alreadySelected) {
          setAlert({
            type: 'success',
            message: t('cropPredictor.form.map.mapSelection', {
              defaultValue: 'Selected {{state}} from the map.',
              state: matched,
            }),
          });
        }
      } else {
        const message = t('cropPredictor.form.map.mapSelectionFailed', {
          defaultValue: 'Could not map that location to a state. Try zooming in or clicking within India.',
        });
        setMapError(message);
        setAlert({ type: 'warning', message });
      }
    },
    [fallbackStateLookup, form.state, reverseGeocodeState, t, updateField, updateMapLocation],
  );
  
  // --- MODIFIED MAP INITIALIZATION EFFECT ---
  useEffect(() => {
    // Wait for the token to be fetched before trying to initialize the map
    if (!mapboxToken || !mapContainerRef.current || mapRef.current) {
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-left');

    const handleLoad = () => {
      setMapError(null);
      if (pendingCenterRef.current) {
        const [lng, lat] = pendingCenterRef.current;
        pendingCenterRef.current = null;
        updateMapLocation(lng, lat, { animate: false });
      }
    };

    map.on('load', handleLoad);
    map.on('click', handleMapClick);

    mapRef.current = map;

    return () => {
      map.off('load', handleLoad);
      map.off('click', handleMapClick);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [handleMapClick, updateMapLocation, mapboxToken]); // Dependency array now includes mapboxToken

  useEffect(() => {
    if (form.state) {
      syncStateSelection(form.state);
    }
  }, [form.state, syncStateSelection]);

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

  const chatbotContext = useMemo<ChatbotContext | null>(() => {
    if (!prediction?.success) {
      return null;
    }

    const summaryLines: string[] = [];
    const yieldUnit = prediction.yield_unit || 'ton/ha';
    const locationSummary = [
      form.crop_type && `Crop: ${form.crop_type}`,
      form.season && `Season: ${form.season}`,
      form.state && `State: ${form.state}`,
    ]
      .filter(Boolean)
      .join(' • ');

    if (locationSummary) {
      summaryLines.push(locationSummary);
    }

    if (form.area) {
      summaryLines.push(`Field area: ${form.area} ha`);
    }

    if (typeof prediction.predicted_yield === 'number') {
      summaryLines.push(`Predicted yield: ${prediction.predicted_yield.toFixed(2)} ${yieldUnit}`);
    }

    if (prediction.confidence_interval) {
      summaryLines.push(
        `Expected range: ${prediction.confidence_interval.lower.toFixed(2)} - ${prediction.confidence_interval.upper.toFixed(2)} ${yieldUnit}`,
      );
    }

    if (typeof prediction.model_confidence === 'number') {
      summaryLines.push(`Model confidence: ${(prediction.model_confidence * 100).toFixed(1)}%`);
    }

    summaryLines.push(
      `Soil nutrients (kg/ha): N ${form.nitrogen}, P ${form.phosphorus}, K ${form.potassium}`,
    );
    summaryLines.push(
      `Inputs used: fertiliser ${form.fertilizer} kg/ha, pesticide ${form.pesticide} kg/ha`,
    );
    summaryLines.push(
      `Weather assumptions: ${form.temperature}°C temp, ${form.humidity}% humidity, ${form.rainfall} mm rainfall, pH ${form.ph}`,
    );

    const recommendationSet = new Set<string>();
    const addRecommendation = (value?: string) => {
      if (!value) return;
      const trimmed = value.trim();
      if (trimmed) {
        recommendationSet.add(trimmed);
      }
    };

    if (prediction.ai_recommendations) {
      const rec = prediction.ai_recommendations;
      addRecommendation(rec.yield_assessment);

      const allNested = [
        rec.fertilizer_recommendations?.optimal_npk,
        rec.fertilizer_recommendations?.application_schedule,
        rec.fertilizer_recommendations?.organic_options,
        rec.fertilizer_recommendations?.micronutrients,
        rec.irrigation_recommendations?.frequency,
        rec.irrigation_recommendations?.critical_stages,
        rec.irrigation_recommendations?.methods,
        rec.irrigation_recommendations?.water_management,
        rec.planting_recommendations?.optimal_dates,
        rec.planting_recommendations?.variety_selection,
        rec.planting_recommendations?.spacing,
        rec.planting_recommendations?.soil_prep,
        rec.improvement_potential?.expected_increase,
        rec.improvement_potential?.timeline,
        rec.improvement_potential?.priority_actions,
        rec.improvement_potential?.investment_needed,
        rec.cost_benefit?.roi_estimate,
        rec.cost_benefit?.payback_period,
        rec.cost_benefit?.risk_factors,
      ];

      allNested.forEach(addRecommendation);
    }

    computedTips.forEach(addRecommendation);

    const trimmedSummary = summaryLines.filter(Boolean).slice(0, 8);
    const recommendationHighlights = Array.from(recommendationSet).slice(0, 12);

    return {
      summaryLines: trimmedSummary,
      recommendationHighlights,
      languageHint: prediction.ai_recommendations_language,
    };
  }, [computedTips, form, prediction]);

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

                  {mapboxToken ? (
                    <Box
                      sx={{
                        mt: 1,
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        backgroundColor: 'rgba(76, 175, 80, 0.04)',
                      }}
                    >
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                      >
                        <Typography variant="subtitle2" color="text.primary" fontWeight={600}>
                          {t('cropPredictor.form.map.title', {
                            defaultValue: 'Select state on the map (optional)',
                          })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('cropPredictor.form.map.subtitle', {
                            defaultValue:
                              'Click on the map to update the state, or use the locator button.',
                          })}
                        </Typography>
                      </Stack>
                      <Box
                        ref={mapContainerRef}
                        sx={{
                          mt: 2,
                          height: { xs: 220, sm: 260 },
                          borderRadius: 2,
                          overflow: 'hidden',
                          position: 'relative',
                          '& .mapboxgl-canvas': { width: '100%', height: '100%' },
                          '& .mapboxgl-control-container': { fontFamily: 'inherit' },
                        }}
                      />
                      {mapError && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                          {mapError}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                      {mapError ||
                        t('cropPredictor.form.map.tokenMissingShort', {
                          defaultValue:
                            'Interactive map unavailable. Provide MAPBOX_API_KEY to enable it.',
                        })}
                    </Alert>
                  )}

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
                      <Box sx={{ position: 'relative' }}>
                        <Select
                          label={t('cropPredictor.form.fields.state')}
                          value={form.state}
                          onChange={handleSelectChange('state')}
                          fullWidth
                        >
                          {STATES.map(state => (
                            <MenuItem key={state} value={state}>
                              {state}
                            </MenuItem>
                          ))}
                        </Select>
                        <MuiTooltip title={detectingState ? t('common.loading') : t('cropPredictor.form.detectState', 'Detect state from location')}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={detectState}
                              disabled={detectingState || !mapboxToken}
                              sx={{ position: 'absolute', top: 6, right: 6, zIndex: 2 }}
                              aria-label="Detect state from current location"
                            >
                              {detectingState ? <CircularProgress size={18} /> : <GpsFixed fontSize="small" />}
                            </IconButton>
                          </span>
                        </MuiTooltip>
                      </Box>
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
                      value={resolveNumberValue('year')}
                      onChange={handleNumberChange('year')}
                      onBlur={() => setTempNumbers(prev => ({ ...prev, year: undefined as unknown as string }))}
                      InputProps={{ endAdornment: <InputAdornment position="end">yr</InputAdornment> }}
                    />
                    <TextField
                      label={t('cropPredictor.form.fields.area')}
                      type="number"
                      value={resolveNumberValue('area')}
                      onChange={handleNumberChange('area')}
                      onBlur={() => setTempNumbers(prev => ({ ...prev, area: undefined as unknown as string }))}
                      InputProps={{ endAdornment: <InputAdornment position="end">ha</InputAdornment> }}
                    />
                    <TextField
                      label={t('cropPredictor.form.fields.annualRainfall')}
                      type="number"
                      value={resolveNumberValue('annual_rainfall')}
                      onChange={handleNumberChange('annual_rainfall')}
                      onBlur={() => setTempNumbers(prev => ({ ...prev, annual_rainfall: undefined as unknown as string }))}
                      InputProps={{ endAdornment: <InputAdornment position="end">mm</InputAdornment> }}
                    />
                    <TextField
                      label={t('cropPredictor.form.fields.fertilizer')}
                      type="number"
                      value={resolveNumberValue('fertilizer')}
                      onChange={handleNumberChange('fertilizer')}
                      onBlur={() => setTempNumbers(prev => ({ ...prev, fertilizer: undefined as unknown as string }))}
                      InputProps={{ endAdornment: <InputAdornment position="end">kg/ha</InputAdornment> }}
                    />
                    <TextField
                      label={t('cropPredictor.form.fields.pesticide')}
                      type="number"
                      value={resolveNumberValue('pesticide')}
                      onChange={handleNumberChange('pesticide')}
                      onBlur={() => setTempNumbers(prev => ({ ...prev, pesticide: undefined as unknown as string }))}
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
                      value={resolveNumberValue('nitrogen')}
                      onChange={handleNumberChange('nitrogen')}
                      onBlur={() => setTempNumbers(prev => ({ ...prev, nitrogen: undefined as unknown as string }))}
                      InputProps={{ endAdornment: <InputAdornment position="end">kg/ha</InputAdornment> }}
                    />
                    <TextField
                      label={t('cropPredictor.form.fields.phosphorus')}
                      type="number"
                      value={resolveNumberValue('phosphorus')}
                      onChange={handleNumberChange('phosphorus')}
                      onBlur={() => setTempNumbers(prev => ({ ...prev, phosphorus: undefined as unknown as string }))}
                      InputProps={{ endAdornment: <InputAdornment position="end">kg/ha</InputAdornment> }}
                    />
                    <TextField
                      label={t('cropPredictor.form.fields.potassium')}
                      type="number"
                      value={resolveNumberValue('potassium')}
                      onChange={handleNumberChange('potassium')}
                      onBlur={() => setTempNumbers(prev => ({ ...prev, potassium: undefined as unknown as string }))}
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
                    {prediction.ai_recommendations_source && (
                      <Chip
                        size="small"
                        variant="outlined"
                        color={prediction.ai_recommendations_source.startsWith('gemini') ? 'secondary' : 'warning'}
                        label={
                          prediction.ai_recommendations_source.startsWith('gemini')
                            ? t('cropPredictor.results.aiSourceGemini', { defaultValue: 'Gemini AI insights' })
                            : t('cropPredictor.results.aiSourceFallback', { defaultValue: 'Rule-based guidance' })
                        }
                        sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#F1F8E9' }}
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

                <Chatbot
                  context={chatbotContext}
                  isPredictionReady={!!prediction?.success}
                />

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