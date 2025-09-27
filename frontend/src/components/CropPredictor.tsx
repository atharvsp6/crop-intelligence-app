import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { Agriculture, TrendingUp } from '@mui/icons-material';
import axios from 'axios';
import { API_BASE } from '../config';

interface LegacyPredictionData {
  crop_type: string;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

interface ExtendedPredictionData {
  crop_type: string;
  season: string;
  state: string;
  area: number;
  annual_rainfall: number;
  fertilizer_input: number;
  pesticide_input: number;
}

interface PredictionResult {
  success: boolean;
  predicted_yield?: number;
  raw_predicted_yield?: number;
  feature_importance?: Record<string, number>;
  confidence_interval?: {
    lower: number;
    upper: number;
    std: number;
  };
  target_transform?: string;
  yield_unit?: string;
  calibration_factor?: number;
  error?: string;
}

interface ExplanationResult {
  success: boolean;
  predicted_yield?: number;
  base_value?: number;
  shap_values?: Record<string, number>;
  features?: string[];
  error?: string;
}

const CropPredictor: React.FC = () => {
  const [mode, setMode] = useState<'legacy' | 'extended'>('legacy');
  const [legacyData, setLegacyData] = useState<LegacyPredictionData>({
    crop_type: 'wheat',
    temperature: 25,
    humidity: 65,
    ph: 6.5,
    rainfall: 900,
    nitrogen: 85,
    phosphorus: 45,
    potassium: 60,
  });
  const [extendedData, setExtendedData] = useState<ExtendedPredictionData>({
    crop_type: 'Wheat',
    season: 'Rabi',
    state: 'Punjab',
    area: 1000,
    annual_rainfall: 800,
    fertilizer_input: 500000,
    pesticide_input: 15000
  });

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<ExplanationResult | null>(null);

  const cropTypes = ['wheat', 'rice', 'corn', 'soybean', 'cotton'];

  const handleLegacyChange = (field: keyof LegacyPredictionData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = field === 'crop_type' ? event.target.value : parseFloat(event.target.value);
    setLegacyData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleExtendedChange = (field: keyof ExtendedPredictionData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = field === 'crop_type' || field === 'season' || field === 'state' ? event.target.value : parseFloat(event.target.value);
    setExtendedData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setPrediction(null);

    try {
      const payload = mode === 'legacy' ? legacyData : extendedData;
      const response = await axios.post<PredictionResult>(`${API_BASE}/api/predict-yield`, payload);
      setPrediction(response.data);
      setExplanation(null);
    } catch (error) {
      setPrediction({
        success: false,
        error: 'Failed to connect to the server. Please ensure the backend is running.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async () => {
    if (!prediction) return;
    setExplaining(true);
    try {
      const payload = mode === 'legacy' ? legacyData : extendedData;
      const response = await axios.post<ExplanationResult>(`${API_BASE}/api/predict-yield/explain`, payload);
      setExplanation(response.data);
    } catch (e) {
      setExplanation({ success: false, error: 'Failed to get explanation' });
    } finally {
      setExplaining(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <Agriculture sx={{ mr: 2, verticalAlign: 'bottom' }} />
        Crop Yield Predictor
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Predict crop yields using machine learning based on environmental and soil conditions
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Input Parameters
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Mode</InputLabel>
                    <Select value={mode} onChange={(e: SelectChangeEvent) => setMode(e.target.value as any)}>
                      <MenuItem value="legacy">Legacy</MenuItem>
                      <MenuItem value="extended">Extended</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Crop Type</InputLabel>
                    <Select
                      value={mode === 'legacy' ? legacyData.crop_type : extendedData.crop_type}
                      onChange={(e: SelectChangeEvent) => {
                        if (mode === 'legacy') setLegacyData(p => ({ ...p, crop_type: e.target.value }));
                        else setExtendedData(p => ({ ...p, crop_type: e.target.value }));
                      }}
                    >
                      {cropTypes.map(crop => (
                        <MenuItem key={crop} value={crop}>
                          {crop.charAt(0).toUpperCase() + crop.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {mode === 'legacy' && (
                  <>
                    <TextField fullWidth label="Temperature (°C)" type="number" value={legacyData.temperature} onChange={handleLegacyChange('temperature')} margin="normal" inputProps={{ step: 0.1, min: -10, max: 50 }} />
                    <TextField fullWidth label="Humidity (%)" type="number" value={legacyData.humidity} onChange={handleLegacyChange('humidity')} margin="normal" inputProps={{ step: 1, min: 0, max: 100 }} />
                    <TextField fullWidth label="Soil pH" type="number" value={legacyData.ph} onChange={handleLegacyChange('ph')} margin="normal" inputProps={{ step: 0.1, min: 3, max: 10 }} />
                    <TextField fullWidth label="Rainfall (mm)" type="number" value={legacyData.rainfall} onChange={handleLegacyChange('rainfall')} margin="normal" inputProps={{ step: 1, min: 0, max: 3000 }} />
                    <TextField fullWidth label="Nitrogen (N) mg/kg" type="number" value={legacyData.nitrogen} onChange={handleLegacyChange('nitrogen')} margin="normal" inputProps={{ step: 1, min: 0, max: 200 }} />
                    <TextField fullWidth label="Phosphorus (P) mg/kg" type="number" value={legacyData.phosphorus} onChange={handleLegacyChange('phosphorus')} margin="normal" inputProps={{ step: 1, min: 0, max: 100 }} />
                    <TextField fullWidth label="Potassium (K) mg/kg" type="number" value={legacyData.potassium} onChange={handleLegacyChange('potassium')} margin="normal" inputProps={{ step: 1, min: 0, max: 200 }} />
                  </>
                )}

                {mode === 'extended' && (
                  <>
                    <TextField fullWidth label="Season" value={extendedData.season} onChange={handleExtendedChange('season')} margin="normal" />
                    <TextField fullWidth label="State" value={extendedData.state} onChange={handleExtendedChange('state')} margin="normal" />
                    <TextField fullWidth label="Area (hectares)" type="number" value={extendedData.area} onChange={handleExtendedChange('area')} margin="normal" />
                    <TextField fullWidth label="Annual Rainfall (mm)" type="number" value={extendedData.annual_rainfall} onChange={handleExtendedChange('annual_rainfall')} margin="normal" />
                    <TextField fullWidth label="Fertilizer Input (units)" type="number" value={extendedData.fertilizer_input} onChange={handleExtendedChange('fertilizer_input')} margin="normal" />
                    <TextField fullWidth label="Pesticide Input (units)" type="number" value={extendedData.pesticide_input} onChange={handleExtendedChange('pesticide_input')} margin="normal" />
                  </>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ mt: 3 }}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <TrendingUp />}
                >
                  {loading ? 'Predicting...' : 'Predict Yield'}
                </Button>
                {prediction?.success && (
                  <Button
                    onClick={handleExplain}
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 1 }}
                    disabled={explaining}
                  >
                    {explaining ? 'Generating Explanation...' : 'Explain Prediction'}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          {prediction && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Prediction Results
                </Typography>
                
                {prediction.success ? (
                  <Box>
                    <Paper sx={{ p: 2, mb: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                      <Typography variant="h4" align="center">
                        {prediction.predicted_yield?.toFixed(2)} {prediction.yield_unit || 't/ha'}
                      </Typography>
                      <Typography variant="body2" align="center">
                        Predicted Yield
                      </Typography>
                      {prediction.target_transform && (
                        <Typography variant="caption" align="center" display="block">
                          (Model trained with {prediction.target_transform}; raw={prediction.raw_predicted_yield?.toFixed(3)})
                        </Typography>
                      )}
                      {prediction.calibration_factor && prediction.calibration_factor !== 1 && (
                        <Typography variant="caption" align="center" display="block" color="secondary">
                          Calibration factor applied: {prediction.calibration_factor.toFixed(2)}
                        </Typography>
                      )}
                    </Paper>

                    {prediction.confidence_interval && (
                      <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Confidence Interval
                        </Typography>
                        <Typography variant="body2">
                          Range: {prediction.confidence_interval.lower.toFixed(2)} - {prediction.confidence_interval.upper.toFixed(2)} kg/hectare
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Units: {prediction.yield_unit || 't/ha'}
                        </Typography>
                        <Typography variant="body2">
                          Standard Deviation: ±{prediction.confidence_interval.std.toFixed(2)}
                        </Typography>
                      </Paper>
                    )}

                    {prediction.feature_importance && (
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Feature Importance
                        </Typography>
                        {Object.entries(prediction.feature_importance)
                          .sort(([,a], [,b]) => b - a)
                          .map(([feature, importance]) => (
                            <Box key={feature} sx={{ mb: 1 }}>
                              <Typography variant="body2" component="div">
                                {feature.replace('_', ' ').toUpperCase()}: {(importance * 100).toFixed(1)}%
                              </Typography>
                              <Box sx={{ width: '100%', bgcolor: 'grey.300', height: 8, borderRadius: 1 }}>
                                <Box
                                  sx={{
                                    width: `${importance * 100}%`,
                                    bgcolor: 'primary.main',
                                    height: '100%',
                                    borderRadius: 1,
                                  }}
                                />
                              </Box>
                            </Box>
                          ))
                        }
                      </Paper>
                    )}
                    {explanation && explanation.success && explanation.shap_values && (
                      <Paper sx={{ p: 2, mt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          SHAP Explanation (Contribution to Prediction)
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          Base value: {explanation.base_value?.toFixed(2)} | Predicted: {explanation.predicted_yield?.toFixed(2)}
                        </Typography>
                        {Object.entries(explanation.shap_values)
                          .sort(([,a],[,b]) => Math.abs(b) - Math.abs(a))
                          .map(([feature, val]) => (
                            <Box key={feature} sx={{ mb: 1 }}>
                              <Typography variant="body2" component="div">
                                {feature}: {val.toFixed(2)}
                              </Typography>
                              <Box sx={{ width: '100%', bgcolor: 'grey.300', height: 8, borderRadius: 1, position:'relative' }}>
                                <Box
                                  sx={{
                                    position:'absolute',
                                    left: val >= 0 ? '50%' : `${50 + (val/ (2* (Math.abs(val)+1e-9))) * 100}%`,
                                    transform: val >=0 ? 'translateX(0)' : 'translateX(-100%)',
                                    width: `${Math.min(100, Math.abs(val)*10)}%`,
                                    bgcolor: val >= 0 ? 'primary.main' : 'error.main',
                                    height: '100%',
                                    borderRadius: 1,
                                  }}
                                />
                                <Box sx={{ position:'absolute', left:'50%', top:0, bottom:0, width:2, bgcolor:'white' }} />
                              </Box>
                            </Box>
                          ))}
                        <Typography variant="caption" color="text.secondary">
                          Positive bars push prediction up; negative bars push it down relative to base.
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                ) : (
                  <Alert severity="error">
                    {prediction.error || 'Prediction failed'}
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tips for Better Predictions
              </Typography>
              <Typography variant="body2" paragraph>
                • Ensure soil pH is between 6.0-7.0 for most crops
              </Typography>
              <Typography variant="body2" paragraph>
                • Monitor nitrogen levels as they significantly impact yield
              </Typography>
              <Typography variant="body2" paragraph>
                • Consider seasonal rainfall patterns for your region
              </Typography>
              <Typography variant="body2" paragraph>
                • Temperature should be within the optimal range for your crop
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default CropPredictor;