import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box, Typography, Tabs, Tab, Card, CardContent, TextField, Button,
  CircularProgress, Alert, Chip, Select, MenuItem, FormControl,
  InputLabel, IconButton, Tooltip, Paper, Divider, List,
  ListItem, ListItemIcon, ListItemText, ToggleButtonGroup, ToggleButton,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  Agriculture, BugReport, TrendingUp, AccountBalance, WbSunny,
  Forum, RecordVoiceOver, Science, Spa,
  CheckCircle, Mic, VolumeUp, Send,
  WaterDrop, Thermostat, LocationOn,
  Warning, LocalHospital, Shield, EnergySavingsLeaf, AttachMoney, CalendarMonth, 
  MyLocation,
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

// ─── Reusable result renderer (smart formatter) ──────────────────
function formatKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function SmartValue({ value }: { value: any }) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{value}</Typography>;
  if (typeof value === 'number' || typeof value === 'boolean') return <Typography variant="body2">{String(value)}</Typography>;
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    if (typeof value[0] === 'string') {
      return (
        <List dense disablePadding>
          {value.map((item, i) => (
            <ListItem key={i} sx={{ py: 0.25, px: 0 }}>
              <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle fontSize="small" color="success" /></ListItemIcon>
              <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItem>
          ))}
        </List>
      );
    }
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {value.map((item, i) => (
          <Paper key={i} variant="outlined" sx={{ p: 1.5 }}>
            {typeof item === 'object' ? Object.entries(item).map(([k, v]) => (
              <Typography key={k} variant="body2"><strong>{formatKey(k)}:</strong> {typeof v === 'string' || typeof v === 'number' ? String(v) : JSON.stringify(v)}</Typography>
            )) : <Typography variant="body2">{String(item)}</Typography>}
          </Paper>
        ))}
      </Box>
    );
  }
  if (typeof value === 'object') {
    return (
      <Box sx={{ pl: 1 }}>
        {Object.entries(value).map(([k, v]) => (
          <Box key={k} sx={{ mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">{formatKey(k)}</Typography>
            <SmartValue value={v} />
          </Box>
        ))}
      </Box>
    );
  }
  return <Typography variant="body2">{String(value)}</Typography>;
}

function ResultCard({ data, loading, error }: { data: any; loading: boolean; error: string }) {
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={48} /></Box>;
  if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  if (!data) return null;
  if (typeof data === 'string') return <Paper sx={{ p: 3, mt: 2, whiteSpace: 'pre-wrap' }}>{data}</Paper>;
  if (data.error) return <Alert severity="error" sx={{ mt: 2 }}>{data.error}</Alert>;
  return (
    <Paper sx={{ p: 3, mt: 2, maxHeight: 600, overflow: 'auto' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {Object.entries(data).map(([key, value]) => (
          <Box key={key}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mb: 1, color: 'primary.main', borderBottom: '1px solid', borderColor: 'divider', pb: 0.5 }}>
              {formatKey(key)}
            </Typography>
            <SmartValue value={value} />
          </Box>
        ))}
      </Box>
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

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={48} /></Box>}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {result && !loading && !error && (
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Treatment mode structured view */}
          {mode === 'treatment' && result.disease_info ? (
            <>
              {/* Disease Info Card */}
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <BugReport color="error" />
                    <Typography variant="h6">{result.disease_info.name || 'Disease Info'}</Typography>
                    {result.disease_info.type && <Chip label={result.disease_info.type} size="small" color="warning" />}
                  </Box>
                  {result.disease_info.scientific_name && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>{result.disease_info.scientific_name}</Typography>
                  )}
                  <Typography variant="body2">{result.disease_info.description}</Typography>
                </CardContent>
              </Card>

              {/* Severity Assessment */}
              {result.severity_assessment && (
                <Card variant="outlined" sx={{ borderColor: 'error.light' }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Warning color="warning" /> Severity Assessment
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Severity Level</Typography>
                        <Chip label={result.severity_assessment.level} size="small" color="error" sx={{ display: 'block', mt: 0.5, width: 'fit-content' }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Spread Risk</Typography>
                        <Typography variant="body2" fontWeight={600}>{result.severity_assessment.spread_risk}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Est. Crop Loss</Typography>
                        <Typography variant="body2" fontWeight={600}>{result.severity_assessment.crop_loss_estimate}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Treatment Plan */}
              {result.treatment_plan && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <LocalHospital color="primary" /> Treatment Plan
                    </Typography>
                    {result.treatment_plan.immediate_actions?.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Alert severity="warning" sx={{ mb: 1 }}>
                          <Typography variant="subtitle2">Immediate Actions Required</Typography>
                        </Alert>
                        <List dense>
                          {result.treatment_plan.immediate_actions.map((a: string, i: number) => (
                            <ListItem key={i} sx={{ py: 0.25 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle fontSize="small" color="warning" /></ListItemIcon>
                              <ListItemText primary={a} primaryTypographyProps={{ variant: 'body2' }} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                      {result.treatment_plan.organic_remedies?.length > 0 && (
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <EnergySavingsLeaf fontSize="small" color="success" /> Organic Remedies
                          </Typography>
                          {result.treatment_plan.organic_remedies.map((r: any, i: number) => (
                            <Box key={i} sx={{ mb: 1, pl: 1, borderLeft: '2px solid', borderColor: 'success.light' }}>
                              <Typography variant="body2" fontWeight={600}>{r.name}</Typography>
                              <Typography variant="caption" display="block">Application: {r.application}</Typography>
                              <Typography variant="caption" display="block">Frequency: {r.frequency}</Typography>
                            </Box>
                          ))}
                        </Paper>
                      )}
                      {result.treatment_plan.chemical_treatments?.length > 0 && (
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <Science fontSize="small" color="info" /> Chemical Treatments
                          </Typography>
                          {result.treatment_plan.chemical_treatments.map((t: any, i: number) => (
                            <Box key={i} sx={{ mb: 1, pl: 1, borderLeft: '2px solid', borderColor: 'info.light' }}>
                              <Typography variant="body2" fontWeight={600}>{t.name}</Typography>
                              <Typography variant="caption" display="block">Dosage: {t.dosage}</Typography>
                              <Typography variant="caption" display="block">Method: {t.application_method}</Typography>
                              {t.safety_period && <Typography variant="caption" display="block" color="error">Safety period: {t.safety_period}</Typography>}
                            </Box>
                          ))}
                        </Paper>
                      )}
                    </Box>
                    {result.treatment_plan.biological_controls?.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Biological Controls</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {result.treatment_plan.biological_controls.map((b: string, i: number) => (
                            <Chip key={i} label={b} size="small" variant="outlined" color="success" />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Prevention */}
              {result.prevention && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Shield color="primary" /> Prevention
                    </Typography>
                    {result.prevention.cultural_practices?.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">Cultural Practices</Typography>
                        <List dense>
                          {result.prevention.cultural_practices.map((p: string, i: number) => (
                            <ListItem key={i} sx={{ py: 0.1 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                              <ListItemText primary={p} primaryTypographyProps={{ variant: 'body2' }} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                    {result.prevention.resistant_varieties?.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">Resistant Varieties</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {result.prevention.resistant_varieties.map((v: string, i: number) => (
                            <Chip key={i} label={v} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    )}
                    {result.prevention.monitoring_schedule && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        <Typography variant="body2"><strong>Monitoring:</strong> {result.prevention.monitoring_schedule}</Typography>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Recovery & Expert */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                {result.estimated_recovery_time && (
                  <Alert severity="success"><strong>Estimated Recovery:</strong> {result.estimated_recovery_time}</Alert>
                )}
                {result.when_to_seek_expert && (
                  <Alert severity="warning"><strong>Seek Expert When:</strong> {result.when_to_seek_expert}</Alert>
                )}
              </Box>
            </>
          ) : mode === 'identify' && result.possible_diseases ? (
            /* Pest identification structured view */
            <>
              <Typography variant="subtitle1" fontWeight={600}>Possible Diseases Identified</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                {result.possible_diseases.map((d: any, i: number) => (
                  <Card key={i} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6" fontSize="1rem">{d.name}</Typography>
                        <Chip label={d.confidence} size="small"
                          color={d.confidence === 'high' ? 'error' : d.confidence === 'medium' ? 'warning' : 'default'} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{d.description}</Typography>
                      {d.matching_symptoms?.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {d.matching_symptoms.map((s: string, j: number) => (
                            <Chip key={j} label={s} size="small" variant="outlined" color="error" />
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
              {result.recommended_tests?.length > 0 && (
                <Alert severity="info">
                  <Typography variant="subtitle2">Recommended Tests</Typography>
                  <List dense>
                    {result.recommended_tests.map((t: string, i: number) => (
                      <ListItem key={i} sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}><Science fontSize="small" /></ListItemIcon>
                        <ListItemText primary={t} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              )}
              {result.immediate_action && <Alert severity="warning"><strong>Immediate Action:</strong> {result.immediate_action}</Alert>}
              {result.prevention_tips?.length > 0 && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>Prevention Tips</Typography>
                    <List dense>
                      {result.prevention_tips.map((t: string, i: number) => (
                        <ListItem key={i} sx={{ py: 0.1 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                          <ListItemText primary={t} primaryTypographyProps={{ variant: 'body2' }} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <ResultCard data={result} loading={false} error="" />
          )}
        </Box>
      )}
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

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={48} /></Box>}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {result && !loading && !error && (
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {result.financial_summary ? (
            <>
              {/* Financial Summary Cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2 }}>
                {[
                  { label: 'Total Investment', value: result.financial_summary.total_investment, color: '#e53e3e' },
                  { label: 'Expected Revenue', value: result.financial_summary.expected_revenue, color: '#2f855a' },
                  { label: 'Expected Profit', value: result.financial_summary.expected_profit, color: '#38a169' },
                  { label: 'ROI', value: result.financial_summary.roi_percentage != null ? `${result.financial_summary.roi_percentage}%` : 'N/A', color: '#805ad5' },
                  { label: 'Breakeven Yield', value: result.financial_summary.breakeven_yield, color: '#dd6b20' },
                ].map((item, i) => (
                  <Card key={i} variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: item.color, fontSize: '1.1rem' }}>{item.value || 'N/A'}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Revenue Projection */}
              {result.revenue_projection && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp color="success" /> Revenue Projection
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                      {[
                        { label: 'Optimistic', value: result.revenue_projection.optimistic, color: 'success.main' },
                        { label: 'Realistic', value: result.revenue_projection.realistic, color: 'info.main' },
                        { label: 'Pessimistic', value: result.revenue_projection.pessimistic, color: 'warning.main' },
                      ].map((item, i) => (
                        <Paper key={i} variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: item.color }}>{item.value || 'N/A'}</Typography>
                        </Paper>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Cost Breakdown */}
              {result.cost_breakdown?.length > 0 && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachMoney color="secondary" /> Cost Breakdown
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Share</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {result.cost_breakdown.map((item: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell>{item.category}</TableCell>
                              <TableCell>{item.amount}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LinearProgress variant="determinate" value={Math.min(item.percentage || 0, 100)} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                                  <Typography variant="caption">{item.percentage}%</Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}

              {/* Crop Rotation Plan */}
              {result.crop_rotation_plan?.length > 0 && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarMonth color="primary" /> Crop Rotation Plan
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                      {result.crop_rotation_plan.map((item: any, i: number) => (
                        <Paper key={i} variant="outlined" sx={{ p: 1.5 }}>
                          <Chip label={item.season} size="small" color="primary" sx={{ mb: 0.5 }} />
                          <Typography variant="body2" fontWeight={600}>{item.crop}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.reason}</Typography>
                        </Paper>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Risk Mitigation & Government Schemes side by side */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {result.risk_mitigation?.length > 0 && (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Shield color="warning" /> Risk Mitigation
                      </Typography>
                      {result.risk_mitigation.map((item: any, i: number) => (
                        <Box key={i} sx={{ mb: 1.5, pl: 1.5, borderLeft: '3px solid', borderColor: 'warning.light' }}>
                          <Typography variant="body2" fontWeight={600}>{item.risk}</Typography>
                          <Typography variant="caption" display="block">Mitigation: {item.mitigation}</Typography>
                          {item.insurance_option && <Typography variant="caption" display="block" color="info.main">Insurance: {item.insurance_option}</Typography>}
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                )}
                {result.government_schemes?.length > 0 && (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccountBalance color="info" /> Government Schemes
                      </Typography>
                      {result.government_schemes.map((item: any, i: number) => (
                        <Box key={i} sx={{ mb: 1.5, pl: 1.5, borderLeft: '3px solid', borderColor: 'info.light' }}>
                          <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                          <Typography variant="caption" display="block">Benefit: {item.benefit}</Typography>
                          <Typography variant="caption" display="block" color="success.main">How to apply: {item.how_to_apply}</Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </Box>

              {/* Monthly Cash Flow */}
              {result.monthly_cash_flow?.length > 0 && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Monthly Cash Flow</Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Month</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Expense</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Income</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {result.monthly_cash_flow.map((item: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell>{item.month}</TableCell>
                              <TableCell sx={{ color: 'error.main' }}>{item.expense}</TableCell>
                              <TableCell sx={{ color: 'success.main' }}>{item.income}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}

              {/* Business Plan Summary */}
              {result.business_plan_summary && (
                <Alert severity="info" icon={<Spa />}>
                  <Typography variant="subtitle2" gutterBottom>Business Plan Summary</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{result.business_plan_summary}</Typography>
                </Alert>
              )}
            </>
          ) : (
            <ResultCard data={result} loading={false} error="" />
          )}
        </Box>
      )}
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
  const [detectedCity, setDetectedCity] = useState('');
  const autoFetched = useRef(false);

  const submitWithWeather = useCallback(async (weatherOverride?: any, cityOverride?: string) => {
    setLoading(true); setError(''); setResult(null);
    try {
      const token = localStorage.getItem('token');
      let weatherData: any = weatherOverride || {};
      const cityVal = cityOverride ?? form.city;
      if (!weatherData.current && cityVal) {
        try {
          const wRes = await fetch(`${API_BASE}/api/weather/current?city=${encodeURIComponent(cityVal)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const wJson = await wRes.json();
          if (wJson.success) weatherData = wJson;
        } catch { /* use fallback */ }
      }
      if (!weatherData.current) {
        weatherData = {
          current: { temperature: 30, humidity: 70, description: 'Partly cloudy', wind_speed: 12 },
          location: { name: cityVal || form.region },
        };
      }
      const res = await groqFetch('weather-alerts', { weather_data: weatherData, crops: form.crops, region: form.region, language: form.language });
      if (res.success) setResult(res.data); else setError(res.error || 'Failed');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [form]);

  // Auto-detect location and fetch alerts on mount
  useEffect(() => {
    if (autoFetched.current) return;
    autoFetched.current = true;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const token = localStorage.getItem('token');
            const wRes = await fetch(`${API_BASE}/api/weather/current?lat=${latitude}&lon=${longitude}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const wJson = await wRes.json();
            if (wJson.success) {
              const cityName = wJson.location?.name || '';
              setDetectedCity(cityName);
              setForm(f => ({ ...f, city: cityName }));
              submitWithWeather(wJson, cityName);
            }
          } catch { /* silent */ }
        },
        () => { /* geolocation denied – user can enter city manually */ }
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WbSunny sx={{ color: '#f6ad55' }} /> Weather Smart Alerts
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        AI-powered farming alerts based on weather conditions
        {detectedCity && <Chip icon={<MyLocation />} label={`Location: ${detectedCity}`} size="small" sx={{ ml: 1 }} color="primary" variant="outlined" />}
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
        startIcon={<WbSunny />} onClick={() => submitWithWeather()} disabled={loading}>
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
  const [listenStatus, setListenStatus] = useState<'idle' | 'listening' | 'processing'>('idle');

  const startListening = useCallback(async () => {
    setError('');
    setIsListening(true);
    setListenStatus('listening');
    try {
      const { startRecording } = await import('../services/groqSpeech');
      await startRecording();
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone.');
      } else {
        setError(err.message || 'Failed to start recording');
      }
      setIsListening(false);
      setListenStatus('idle');
    }
  }, []);

  const stopListening = useCallback(async () => {
    setListenStatus('processing');
    try {
      const { stopAndTranscribe } = await import('../services/groqSpeech');
      // Map language codes for Whisper
      const langMap: Record<string, string> = { en: 'en', hi: 'hi', mr: 'mr', ta: 'ta', te: 'te', bn: 'bn' };
      const result = await stopAndTranscribe(langMap[language] || 'en');
      if (result.success && result.text) {
        setQuery(result.text);
      } else {
        setError(result.error || 'Could not transcribe. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Transcription failed');
    } finally {
      setIsListening(false);
      setListenStatus('idle');
    }
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
                <Tooltip title={isListening ? 'Click to stop' : 'Click to speak'}>
                  <IconButton
                    onClick={isListening ? stopListening : startListening}
                    color={isListening ? 'error' : 'default'}
                    sx={isListening ? {
                      animation: 'pulse 1.5s ease-in-out infinite',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.15)' },
                        '100%': { transform: 'scale(1)' },
                      },
                    } : {}}
                  >
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

      {isListening && (
        <Alert severity="info" sx={{ mt: 2, display: 'flex', alignItems: 'center' }} icon={<Mic />}>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {listenStatus === 'processing' ? 'Processing your speech...' : 'Listening... Speak now'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Click the mic button again to stop
            </Typography>
          </Box>
        </Alert>
      )}

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
          Ultra-fast, multilingual farming intelligence
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
