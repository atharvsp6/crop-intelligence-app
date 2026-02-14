import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Tabs, Tab, Card, CardContent, TextField, Button,
  CircularProgress, Alert, Chip, Select, MenuItem, FormControl,
  InputLabel, IconButton, Tooltip, Paper, Divider, List,
  ListItem, ListItemIcon, ListItemText, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import {
  Agriculture, BugReport, TrendingUp, AccountBalance, WbSunny,
  Forum, RecordVoiceOver, Science, Spa,
  CheckCircle, Mic, VolumeUp, Send,
  WaterDrop, Thermostat, LocationOn,
} from '@mui/icons-material';
import { API_BASE } from '../config';

// ─── Types ────────────────────────────────────────────────────────
interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
function TabPanel({ children, value, index }: TabPanelProps) {
  return <div hidden={value !== index} style={{ paddingTop: 16 }}>{value === index && children}</div>;
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
];

const SOIL_TYPES = ['Alluvial', 'Black (Regur)', 'Red', 'Laterite', 'Sandy', 'Loamy', 'Clay', 'Saline'];
const WATER_LEVELS = ['Low', 'Medium', 'High', 'Irrigated'];
const CROPS = ['Wheat', 'Rice', 'Corn', 'Soybean', 'Cotton', 'Sugarcane', 'Potato', 'Tomato',
  'Onion', 'Turmeric', 'Mustard', 'Groundnut', 'Jowar', 'Bajra', 'Ragi'];
const SEASONS = ['Kharif (Jun-Oct)', 'Rabi (Nov-Mar)', 'Zaid (Mar-Jun)', 'Year-round'];
const SEVERITIES = ['Mild', 'Moderate', 'Severe', 'Critical'];

// ─── Grid helper ──────────────────────────────────────────────────
const formGrid = (cols: string = 'repeat(3, 1fr)') => ({
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: cols },
  gap: 2,
});

// ─── API helper ───────────────────────────────────────────────────
async function groqFetch(endpoint: string, body: object) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/api/groq/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ─── Reusable result renderer ─────────────────────────────────────
function ResultCard({ data, loading, error }: { data: any; loading: boolean; error: string }) {
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={48} /></Box>;
  if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  if (!data) return null;
  if (typeof data === 'string') return <Paper sx={{ p: 3, mt: 2, whiteSpace: 'pre-wrap' }}>{data}</Paper>;
  if (data.error) return <Alert severity="error" sx={{ mt: 2 }}>{data.error}</Alert>;
  return (
    <Paper sx={{ p: 3, mt: 2, maxHeight: 600, overflow: 'auto' }}>
      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, fontSize: '0.9rem' }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </Paper>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 2: Crop Recommendation Tab
// ═══════════════════════════════════════════════════════════════════
function CropRecommendation() {
  const [form, setForm] = useState({ soil_type: 'Loamy', temperature: 28, humidity: 65, rainfall: 900, water_availability: 'Medium', region: 'India', season: '', budget: '', land_size: '', language: 'en' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await groqFetch('crop-recommendation', form);
      if (res.success) setResult(res.data); else setError(res.error || 'Failed');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Agriculture color="primary" /> AI Crop Recommendation
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Get personalized crop suggestions based on your soil, climate, and budget
      </Typography>
      <Box sx={formGrid()}>
        <FormControl fullWidth size="small">
          <InputLabel>Soil Type</InputLabel>
          <Select value={form.soil_type} label="Soil Type" onChange={e => setForm(f => ({ ...f, soil_type: e.target.value }))}>
            {SOIL_TYPES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField fullWidth size="small" type="number" label="Temperature (°C)" value={form.temperature}
          onChange={e => setForm(f => ({ ...f, temperature: +e.target.value }))}
          InputProps={{ startAdornment: <Thermostat sx={{ mr: 1, color: 'text.secondary' }} /> }} />
        <TextField fullWidth size="small" type="number" label="Humidity (%)" value={form.humidity}
          onChange={e => setForm(f => ({ ...f, humidity: +e.target.value }))}
          InputProps={{ startAdornment: <WaterDrop sx={{ mr: 1, color: 'text.secondary' }} /> }} />
        <TextField fullWidth size="small" type="number" label="Annual Rainfall (mm)" value={form.rainfall}
          onChange={e => setForm(f => ({ ...f, rainfall: +e.target.value }))} />
        <FormControl fullWidth size="small">
          <InputLabel>Water Availability</InputLabel>
          <Select value={form.water_availability} label="Water Availability" onChange={e => setForm(f => ({ ...f, water_availability: e.target.value }))}>
            {WATER_LEVELS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField fullWidth size="small" label="Region" value={form.region}
          onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
          InputProps={{ startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} /> }} />
        <FormControl fullWidth size="small">
          <InputLabel>Season</InputLabel>
          <Select value={form.season} label="Season" onChange={e => setForm(f => ({ ...f, season: e.target.value }))}>
            <MenuItem value="">Current</MenuItem>
            {SEASONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField fullWidth size="small" label="Budget (₹)" value={form.budget} placeholder="e.g. 50000"
          onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
        <TextField fullWidth size="small" label="Land Size (acres)" value={form.land_size} placeholder="e.g. 5"
          onChange={e => setForm(f => ({ ...f, land_size: e.target.value }))} />
        <FormControl fullWidth size="small">
          <InputLabel>Language</InputLabel>
          <Select value={form.language} label="Language" onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
            {LANGUAGES.map(l => <MenuItem key={l.code} value={l.code}>{l.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>
      <Button variant="contained" sx={{ mt: 3 }} startIcon={<Agriculture />} onClick={submit} disabled={loading}>
        {loading ? 'Analyzing...' : 'Get Recommendations'}
      </Button>

      {result && !loading && !error && (
        <Box sx={{ mt: 3 }}>
          {result.recommendations ? (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                {result.recommendations.map((rec: any, i: number) => (
                  <Card variant="outlined" key={i} sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6">{rec.crop}</Typography>
                        <Chip label={`${rec.suitability_score}/100`} color={rec.suitability_score >= 80 ? 'success' : rec.suitability_score >= 60 ? 'warning' : 'default'} size="small" />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{rec.reason}</Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="caption" display="block">Yield: {rec.expected_yield_per_acre}</Typography>
                      <Typography variant="caption" display="block">Cost: {rec.estimated_cost_per_acre}</Typography>
                      <Typography variant="caption" display="block">Revenue: {rec.expected_revenue_per_acre}</Typography>
                      <Typography variant="caption" display="block">Season: {rec.growing_season}</Typography>
                      <Typography variant="caption" display="block">Water: {rec.water_requirement}</Typography>
                      {rec.tips && rec.tips.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          {rec.tips.map((t: string, j: number) => (
                            <Chip key={j} label={t} size="small" sx={{ mr: 0.5, mb: 0.5 }} variant="outlined" />
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
              {result.general_advice && <Alert severity="info" sx={{ mt: 2 }}>{result.general_advice}</Alert>}
            </>
          ) : (
            <ResultCard data={result} loading={false} error="" />
          )}
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 3: Disease & Pest Intelligence Tab
// ═══════════════════════════════════════════════════════════════════
function DiseaseIntelligence() {
  const [mode, setMode] = useState<'treatment' | 'identify'>('treatment');
  const [form, setForm] = useState({ disease_name: '', crop: 'Tomato', severity: 'Moderate', symptoms: '', region: 'India', language: 'en' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const endpoint = mode === 'treatment' ? 'disease-treatment' : 'pest-identify';
      const res = await groqFetch(endpoint, form);
      if (res.success) setResult(res.data); else setError(res.error || 'Failed');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BugReport color="error" /> Disease & Pest Intelligence
      </Typography>
      <ToggleButtonGroup size="small" value={mode} exclusive onChange={(_, v) => v && setMode(v)} sx={{ mb: 3 }}>
        <ToggleButton value="treatment">Get Treatment Plan</ToggleButton>
        <ToggleButton value="identify">Identify from Symptoms</ToggleButton>
      </ToggleButtonGroup>
      <Box sx={formGrid('repeat(2, 1fr)')}>
        <FormControl fullWidth size="small">
          <InputLabel>Crop</InputLabel>
          <Select value={form.crop} label="Crop" onChange={e => setForm(f => ({ ...f, crop: e.target.value }))}>
            {CROPS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
        {mode === 'treatment' ? (
          <>
            <TextField fullWidth size="small" label="Disease / Pest Name" value={form.disease_name}
              placeholder="e.g. Late Blight, Aphids" onChange={e => setForm(f => ({ ...f, disease_name: e.target.value }))} />
            <FormControl fullWidth size="small">
              <InputLabel>Severity</InputLabel>
              <Select value={form.severity} label="Severity" onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                {SEVERITIES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </>
        ) : (
          <TextField fullWidth multiline rows={3} size="small" label="Describe Symptoms"
            placeholder="e.g. Yellow spots on leaves, wilting stems, brown patches..."
            value={form.symptoms} onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))}
            sx={{ gridColumn: '1 / -1' }} />
        )}
        <TextField fullWidth size="small" label="Region" value={form.region}
          onChange={e => setForm(f => ({ ...f, region: e.target.value }))} />
        <FormControl fullWidth size="small">
          <InputLabel>Language</InputLabel>
          <Select value={form.language} label="Language" onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
            {LANGUAGES.map(l => <MenuItem key={l.code} value={l.code}>{l.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>
      <Button variant="contained" color="error" sx={{ mt: 3 }} startIcon={<Science />} onClick={submit} disabled={loading}>
        {loading ? 'Analyzing...' : mode === 'treatment' ? 'Get Treatment Plan' : 'Identify Disease'}
      </Button>
      <ResultCard data={result} loading={loading} error={error} />
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 4: Market Prediction Tab
// ═══════════════════════════════════════════════════════════════════
function MarketPrediction() {
  const [form, setForm] = useState({ crop: 'Wheat', region: 'India', current_price: '', language: 'en' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const body = { ...form, current_price: form.current_price ? parseFloat(form.current_price) : undefined };
      const res = await groqFetch('market-prediction', body);
      if (res.success) setResult(res.data); else setError(res.error || 'Failed');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const DirectionChip = ({ direction }: { direction: string }) => {
    const d = (direction || '').toLowerCase();
    return <Chip size="small" label={direction}
      color={d === 'up' ? 'success' : d === 'down' ? 'error' : 'default'}
      icon={d === 'up' ? <TrendingUp /> : undefined} />;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TrendingUp color="success" /> Market Price Prediction
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        AI-powered price trend analysis with sell/hold recommendations
      </Typography>
      <Box sx={formGrid('repeat(4, 1fr)')}>
        <FormControl fullWidth size="small">
          <InputLabel>Crop</InputLabel>
          <Select value={form.crop} label="Crop" onChange={e => setForm(f => ({ ...f, crop: e.target.value }))}>
            {CROPS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField fullWidth size="small" label="Current Price (₹/kg)" value={form.current_price}
          placeholder="Optional" type="number" onChange={e => setForm(f => ({ ...f, current_price: e.target.value }))} />
        <TextField fullWidth size="small" label="Region" value={form.region}
          onChange={e => setForm(f => ({ ...f, region: e.target.value }))} />
        <FormControl fullWidth size="small">
          <InputLabel>Language</InputLabel>
          <Select value={form.language} label="Language" onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
            {LANGUAGES.map(l => <MenuItem key={l.code} value={l.code}>{l.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>
      <Button variant="contained" color="success" sx={{ mt: 3 }} startIcon={<TrendingUp />} onClick={submit} disabled={loading}>
        {loading ? 'Predicting...' : 'Get Market Prediction'}
      </Button>

      {result && !loading && !error && (
        <Box sx={{ mt: 3 }}>
          {result.advisory ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Recommendation</Typography>
                  <Chip label={result.advisory.recommendation} sx={{ mt: 1, fontSize: '1.1rem', fontWeight: 700 }}
                    color={result.advisory.recommendation === 'SELL' ? 'success' : result.advisory.recommendation === 'HOLD' ? 'warning' : 'info'} />
                  <Typography variant="body2" sx={{ mt: 1 }}>{result.advisory.reason}</Typography>
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">7-Day Forecast</Typography>
                  {result.prediction?.short_term_7d && (
                    <Box sx={{ mt: 1 }}>
                      <DirectionChip direction={result.prediction.short_term_7d.direction} />
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Change: {result.prediction.short_term_7d.estimated_change_pct}%
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">30-Day Forecast</Typography>
                  {result.prediction?.medium_term_30d && (
                    <Box sx={{ mt: 1 }}>
                      <DirectionChip direction={result.prediction.medium_term_30d.direction} />
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Change: {result.prediction.medium_term_30d.estimated_change_pct}%
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
              {result.advisory?.best_mandis && (
                <Card variant="outlined" sx={{ gridColumn: '1 / -1' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Best Mandis to Sell</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1 }}>
                      {result.advisory.best_mandis.map((m: any, i: number) => (
                        <Paper variant="outlined" sx={{ p: 1.5 }} key={i}>
                          <Typography variant="body2" fontWeight={600}>{m.name}</Typography>
                          <Typography variant="caption">{m.expected_price}</Typography>
                        </Paper>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}
              {result.market_insights && (
                <Alert severity="info" sx={{ gridColumn: '1 / -1' }}>{result.market_insights}</Alert>
              )}
            </Box>
          ) : (
            <ResultCard data={result} loading={false} error="" />
          )}
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 5: Financial Planning Tab
// ═══════════════════════════════════════════════════════════════════
function FinancialPlanning() {
  const [form, setForm] = useState({ crop: 'Wheat', area_acres: '5', region: 'India', budget: '', season: '', language: 'en' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const body = { ...form, area_acres: parseFloat(form.area_acres) || 1, budget: form.budget ? parseFloat(form.budget) : undefined };
      const res = await groqFetch('financial-plan', body);
      if (res.success) setResult(res.data); else setError(res.error || 'Failed');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccountBalance color="secondary" /> Financial Planning Assistant
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Complete farm business plan with ROI, crop rotation, and government schemes
      </Typography>
      <Box sx={formGrid()}>
        <FormControl fullWidth size="small">
          <InputLabel>Crop</InputLabel>
          <Select value={form.crop} label="Crop" onChange={e => setForm(f => ({ ...f, crop: e.target.value }))}>
            {CROPS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField fullWidth size="small" label="Land Area (acres)" value={form.area_acres} type="number"
          onChange={e => setForm(f => ({ ...f, area_acres: e.target.value }))} />
        <TextField fullWidth size="small" label="Budget (₹)" value={form.budget} type="number" placeholder="Optional"
          onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
        <TextField fullWidth size="small" label="Region" value={form.region}
          onChange={e => setForm(f => ({ ...f, region: e.target.value }))} />
        <FormControl fullWidth size="small">
          <InputLabel>Season</InputLabel>
          <Select value={form.season} label="Season" onChange={e => setForm(f => ({ ...f, season: e.target.value }))}>
            <MenuItem value="">Current</MenuItem>
            {SEASONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel>Language</InputLabel>
          <Select value={form.language} label="Language" onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
            {LANGUAGES.map(l => <MenuItem key={l.code} value={l.code}>{l.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>
      <Button variant="contained" color="secondary" sx={{ mt: 3 }} startIcon={<AccountBalance />} onClick={submit} disabled={loading}>
        {loading ? 'Planning...' : 'Generate Financial Plan'}
      </Button>
      <ResultCard data={result} loading={loading} error={error} />
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 6: Weather Alerts Tab
// ═══════════════════════════════════════════════════════════════════
function WeatherAlerts() {
  const [form, setForm] = useState({ crops: ['Wheat'] as string[], region: 'India', language: 'en', city: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const token = localStorage.getItem('token');
      let weatherData: any = {};
      if (form.city) {
        try {
          const wRes = await fetch(`${API_BASE}/api/weather/current?city=${encodeURIComponent(form.city)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const wJson = await wRes.json();
          if (wJson.success) weatherData = wJson;
        } catch { /* use fallback */ }
      }
      if (!weatherData.current) {
        weatherData = {
          current: { temperature: 30, humidity: 70, description: 'Partly cloudy', wind_speed: 12 },
          location: { name: form.city || form.region },
        };
      }
      const res = await groqFetch('weather-alerts', { weather_data: weatherData, crops: form.crops, region: form.region, language: form.language });
      if (res.success) setResult(res.data); else setError(res.error || 'Failed');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WbSunny sx={{ color: '#f6ad55' }} /> Weather Smart Alerts
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        AI-powered farming alerts based on weather conditions
      </Typography>
      <Box sx={formGrid()}>
        <TextField fullWidth size="small" label="City" value={form.city} placeholder="e.g. Pune, Delhi"
          onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
        <FormControl fullWidth size="small">
          <InputLabel>Crops</InputLabel>
          <Select multiple value={form.crops} label="Crops"
            onChange={e => setForm(f => ({ ...f, crops: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[] }))}
            renderValue={(sel) => (sel as string[]).join(', ')}>
            {CROPS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel>Language</InputLabel>
          <Select value={form.language} label="Language" onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
            {LANGUAGES.map(l => <MenuItem key={l.code} value={l.code}>{l.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>
      <Button variant="contained" sx={{ mt: 3, bgcolor: '#f6ad55', '&:hover': { bgcolor: '#dd6b20' } }}
        startIcon={<WbSunny />} onClick={submit} disabled={loading}>
        {loading ? 'Analyzing...' : 'Get Smart Alerts'}
      </Button>

      {result && !loading && !error && (
        <Box sx={{ mt: 3 }}>
          {result.alerts ? (
            <>
              {result.alerts.map((alert: any, i: number) => (
                <Alert key={i} sx={{ mb: 1 }}
                  severity={alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info'}>
                  <Typography variant="subtitle2">{alert.title}</Typography>
                  <Typography variant="body2">{alert.description}</Typography>
                  {alert.recommended_actions && (
                    <List dense>
                      {alert.recommended_actions.map((a: string, j: number) => (
                        <ListItem key={j} sx={{ py: 0 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                          <ListItemText primary={a} primaryTypographyProps={{ variant: 'body2' }} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Alert>
              ))}
              {result.daily_plan && (
                <Card variant="outlined" sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>Daily Farm Plan</Typography>
                    {Object.entries(result.daily_plan).map(([key, val]) => (
                      <Typography key={key} variant="body2"><strong>{key}:</strong> {val as string}</Typography>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <ResultCard data={result} loading={false} error="" />
          )}
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 9: Forum AI Assistant Tab
// ═══════════════════════════════════════════════════════════════════
function ForumAssistant() {
  const [form, setForm] = useState({ question: '', category: 'general', language: 'en' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const CATEGORIES = ['general', 'cultivation', 'pest_management', 'irrigation', 'fertilizers', 'harvesting', 'marketing', 'weather'];

  const submit = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await groqFetch('forum-answer', form);
      if (res.success) setResult(res.data); else setError(res.error || 'Failed');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Forum color="primary" /> Forum AI Assistant
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Get instant AI answers to any farming question
      </Typography>
      <TextField fullWidth multiline rows={3} label="Your Question"
        placeholder="e.g. What is the best fertilizer for wheat in black soil?"
        value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
        sx={{ mb: 2 }} />
      <Box sx={formGrid('repeat(2, 1fr)')}>
        <FormControl fullWidth size="small">
          <InputLabel>Category</InputLabel>
          <Select value={form.category} label="Category" onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel>Language</InputLabel>
          <Select value={form.language} label="Language" onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
            {LANGUAGES.map(l => <MenuItem key={l.code} value={l.code}>{l.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>
      <Button variant="contained" sx={{ mt: 3 }} startIcon={<Send />} onClick={submit} disabled={loading || !form.question.trim()}>
        {loading ? 'Thinking...' : 'Ask AI Expert'}
      </Button>

      {result && !loading && !error && (
        <Box sx={{ mt: 3 }}>
          {result.answer ? (
            <>
              <Paper sx={{ p: 3 }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{result.answer}</Typography>
              </Paper>
              {result.key_points && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Key Points</Typography>
                  {result.key_points.map((p: string, i: number) => (
                    <Chip key={i} label={p} sx={{ mr: 0.5, mb: 0.5 }} variant="outlined" icon={<CheckCircle />} />
                  ))}
                </Box>
              )}
              {result.expert_tips && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Expert Tips</Typography>
                  <List dense>
                    {result.expert_tips.map((t: string, i: number) => (
                      <ListItem key={i} sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}><Spa fontSize="small" /></ListItemIcon>
                        <ListItemText primary={t} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              )}
            </>
          ) : (
            <ResultCard data={result} loading={false} error="" />
          )}
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 10: Voice Advisory Tab
// ═══════════════════════════════════════════════════════════════════
function VoiceAdvisory() {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('en');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError('Speech recognition not supported in this browser'); return; }
    const recognition = new SR();
    const langMap: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN' };
    recognition.lang = langMap[language] || 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => { setQuery(e.results[0][0].transcript); };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, [language]);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      const langMap: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN' };
      utter.lang = langMap[language] || 'en-IN';
      utter.rate = 0.9;
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utter);
    }
  }, [language]);

  const submit = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await groqFetch('voice-advisory', { query, language });
      if (res.success) {
        setResult(res.data);
        if (res.data?.spoken_response) speak(res.data.spoken_response);
      } else setError(res.error || 'Failed');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RecordVoiceOver sx={{ color: '#7ddf92' }} /> Voice Advisory System
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Speak your question or type it — get spoken farming advice in your language
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' } }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Language</InputLabel>
          <Select value={language} label="Language" onChange={e => setLanguage(e.target.value)}>
            {LANGUAGES.map(l => <MenuItem key={l.code} value={l.code}>{l.label}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField fullWidth label="Ask anything about farming..." value={query}
          onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
          InputProps={{
            endAdornment: (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title={isListening ? 'Listening...' : 'Speak'}>
                  <IconButton onClick={startListening} color={isListening ? 'error' : 'default'}>
                    <Mic />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Send">
                  <IconButton onClick={submit} color="primary" disabled={loading || !query.trim()}>
                    <Send />
                  </IconButton>
                </Tooltip>
              </Box>
            ),
          }}
        />
      </Box>

      {isListening && <Alert severity="info" sx={{ mt: 2 }}>Listening... Speak now</Alert>}

      {result && !loading && !error && (
        <Box sx={{ mt: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>AI Response</Typography>
                <Tooltip title={isSpeaking ? 'Speaking...' : 'Read aloud'}>
                  <IconButton onClick={() => result.spoken_response && speak(result.spoken_response)}
                    color={isSpeaking ? 'primary' : 'default'}>
                    <VolumeUp />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
                {result.spoken_response || JSON.stringify(result)}
              </Typography>
              {result.key_advice && (
                <Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>Key Advice</Typography>
                  {result.key_advice.map((a: string, i: number) => (
                    <Chip key={i} label={a} sx={{ mr: 0.5, mb: 0.5 }} color="primary" variant="outlined" />
                  ))}
                </Box>
              )}
              {result.follow_up_question && (
                <Alert severity="info" sx={{ mt: 2 }} action={
                  <Button size="small" onClick={() => { setQuery(result.follow_up_question); }}>Ask This</Button>
                }>
                  {result.follow_up_question}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Main Component – Smart Advisory with Tabs
// ═══════════════════════════════════════════════════════════════════
export default function SmartAdvisor() {
  const [tab, setTab] = useState(0);

  const tabs = [
    { label: 'Crop Advice', icon: <Agriculture /> },
    { label: 'Disease Intel', icon: <BugReport /> },
    { label: 'Market', icon: <TrendingUp /> },
    { label: 'Finance', icon: <AccountBalance /> },
    { label: 'Weather', icon: <WbSunny /> },
    { label: 'Forum AI', icon: <Forum /> },
    { label: 'Voice', icon: <RecordVoiceOver /> },
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Spa sx={{ fontSize: 36, color: 'primary.main' }} />
          Smart AI Advisory
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Powered by Groq AI — ultra-fast, multilingual farming intelligence
        </Typography>
      </Box>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}>
          {tabs.map((t, i) => (
            <Tab key={i} label={t.label} icon={t.icon} iconPosition="start"
              sx={{ minHeight: 56, textTransform: 'none', fontWeight: 600 }} />
          ))}
        </Tabs>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <TabPanel value={tab} index={0}><CropRecommendation /></TabPanel>
          <TabPanel value={tab} index={1}><DiseaseIntelligence /></TabPanel>
          <TabPanel value={tab} index={2}><MarketPrediction /></TabPanel>
          <TabPanel value={tab} index={3}><FinancialPlanning /></TabPanel>
          <TabPanel value={tab} index={4}><WeatherAlerts /></TabPanel>
          <TabPanel value={tab} index={5}><ForumAssistant /></TabPanel>
          <TabPanel value={tab} index={6}><VoiceAdvisory /></TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
}
