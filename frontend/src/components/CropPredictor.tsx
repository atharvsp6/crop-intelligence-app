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

interface PredictionData {
  crop_type: string;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

interface PredictionResult {
  success: boolean;
  predicted_yield?: number;
  feature_importance?: Record<string, number>;
  confidence_interval?: {
    lower: number;
    upper: number;
    std: number;
  };
  error?: string;
}

const CropPredictor: React.FC = () => {
  const [formData, setFormData] = useState<PredictionData>({
    crop_type: 'wheat',
    temperature: 25,
    humidity: 65,
    ph: 6.5,
    rainfall: 900,
    nitrogen: 85,
    phosphorus: 45,
    potassium: 60,
  });

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const cropTypes = ['wheat', 'rice', 'corn', 'soybean', 'cotton'];

  const handleInputChange = (field: keyof PredictionData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = field === 'crop_type' ? event.target.value : parseFloat(event.target.value);
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setPrediction(null);

    try {
      const response = await axios.post<PredictionResult>(
        'http://localhost:5001/api/predict-yield',
        formData
      );
      setPrediction(response.data);
    } catch (error) {
      setPrediction({
        success: false,
        error: 'Failed to connect to the server. Please ensure the backend is running.',
      });
    } finally {
      setLoading(false);
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
                <FormControl fullWidth margin="normal">
                  <InputLabel>Crop Type</InputLabel>
                  <Select
                    value={formData.crop_type}
                    onChange={(e: SelectChangeEvent) => setFormData(prev => ({ ...prev, crop_type: e.target.value }))}
                  >
                    {cropTypes.map(crop => (
                      <MenuItem key={crop} value={crop}>
                        {crop.charAt(0).toUpperCase() + crop.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Temperature (°C)"
                  type="number"
                  value={formData.temperature}
                  onChange={handleInputChange('temperature')}
                  margin="normal"
                  inputProps={{ step: 0.1, min: -10, max: 50 }}
                />

                <TextField
                  fullWidth
                  label="Humidity (%)"
                  type="number"
                  value={formData.humidity}
                  onChange={handleInputChange('humidity')}
                  margin="normal"
                  inputProps={{ step: 1, min: 0, max: 100 }}
                />

                <TextField
                  fullWidth
                  label="Soil pH"
                  type="number"
                  value={formData.ph}
                  onChange={handleInputChange('ph')}
                  margin="normal"
                  inputProps={{ step: 0.1, min: 3, max: 10 }}
                />

                <TextField
                  fullWidth
                  label="Rainfall (mm)"
                  type="number"
                  value={formData.rainfall}
                  onChange={handleInputChange('rainfall')}
                  margin="normal"
                  inputProps={{ step: 1, min: 0, max: 3000 }}
                />

                <TextField
                  fullWidth
                  label="Nitrogen (N) mg/kg"
                  type="number"
                  value={formData.nitrogen}
                  onChange={handleInputChange('nitrogen')}
                  margin="normal"
                  inputProps={{ step: 1, min: 0, max: 200 }}
                />

                <TextField
                  fullWidth
                  label="Phosphorus (P) mg/kg"
                  type="number"
                  value={formData.phosphorus}
                  onChange={handleInputChange('phosphorus')}
                  margin="normal"
                  inputProps={{ step: 1, min: 0, max: 100 }}
                />

                <TextField
                  fullWidth
                  label="Potassium (K) mg/kg"
                  type="number"
                  value={formData.potassium}
                  onChange={handleInputChange('potassium')}
                  margin="normal"
                  inputProps={{ step: 1, min: 0, max: 200 }}
                />

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
                        {prediction.predicted_yield?.toFixed(2)} kg/hectare
                      </Typography>
                      <Typography variant="body2" align="center">
                        Predicted Yield
                      </Typography>
                    </Paper>

                    {prediction.confidence_interval && (
                      <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Confidence Interval
                        </Typography>
                        <Typography variant="body2">
                          Range: {prediction.confidence_interval.lower.toFixed(2)} - {prediction.confidence_interval.upper.toFixed(2)} kg/hectare
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