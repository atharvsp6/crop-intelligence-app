import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { 
  LocalHospital, 
  CloudUpload, 
  PhotoCamera,
  CheckCircle,
  Warning,
  Error,
} from '@mui/icons-material';
import axios from 'axios';

interface DetectionResult {
  success: boolean;
  prediction?: {
    plant_type: string;
    condition: string;
    confidence: number;
    is_healthy: boolean;
    severity: string;
  };
  top_predictions?: Array<{
    class: string;
    plant_type: string;
    condition: string;
    confidence: number;
  }>;
  recommendations?: {
    immediate_actions: string[];
    preventive_measures: string[];
    treatment_options: string[];
  };
  error?: string;
}

const DiseaseDetector: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setDetection(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setDetection(null);

    try {
      const response = await axios.post<DetectionResult>(
        'http://localhost:5001/api/detect-disease',
        { image: selectedImage }
      );
      setDetection(response.data);
    } catch (error) {
      setDetection({
        success: false,
        error: 'Failed to connect to the server. Please ensure the backend is running.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'success';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return <Error />;
      case 'medium': return <Warning />;
      case 'low': return <Warning />;
      default: return <CheckCircle />;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <LocalHospital sx={{ mr: 2, verticalAlign: 'bottom' }} />
        Plant Disease Detection
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Upload a plant image to detect diseases using AI-powered analysis
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Image Upload
              </Typography>
              
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                ref={fileInputRef}
              />
              
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                {selectedImage ? (
                  <Box>
                    <img
                      src={selectedImage}
                      alt="Selected plant"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      }}
                    />
                  </Box>
                ) : (
                  <Paper
                    sx={{
                      height: 200,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      border: '2px dashed #ccc',
                      cursor: 'pointer',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <PhotoCamera sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Click to upload plant image
                    </Typography>
                  </Paper>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  onClick={() => fileInputRef.current?.click()}
                  fullWidth
                >
                  {selectedImage ? 'Change Image' : 'Upload Image'}
                </Button>
                
                <Button
                  variant="contained"
                  onClick={handleAnalyze}
                  disabled={!selectedImage || loading}
                  fullWidth
                  startIcon={loading ? <CircularProgress size={20} /> : <LocalHospital />}
                >
                  {loading ? 'Analyzing...' : 'Analyze Disease'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tips for Best Results
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• Use clear, well-lit images" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Focus on affected plant parts" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Avoid blurry or dark images" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Include leaves, stems, or fruits clearly" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          {detection && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Analysis Results
                </Typography>
                
                {detection.success ? (
                  <Box>
                    {/* Main Prediction */}
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {getSeverityIcon(detection.prediction?.severity || 'none')}
                        <Typography variant="h6" sx={{ ml: 1 }}>
                          {detection.prediction?.plant_type}
                        </Typography>
                      </Box>
                      
                      <Typography variant="h5" color="primary" gutterBottom>
                        {detection.prediction?.condition}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip
                          label={`Confidence: ${(detection.prediction?.confidence || 0 * 100).toFixed(1)}%`}
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={`Severity: ${detection.prediction?.severity}`}
                          color={getSeverityColor(detection.prediction?.severity || 'none')}
                        />
                      </Box>
                      
                      {detection.prediction?.is_healthy ? (
                        <Alert severity="success">
                          Great! Your plant appears to be healthy.
                        </Alert>
                      ) : (
                        <Alert severity="warning">
                          Disease detected. Please review the recommendations below.
                        </Alert>
                      )}
                    </Paper>

                    {/* Top Predictions */}
                    {detection.top_predictions && (
                      <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Alternative Predictions
                        </Typography>
                        {detection.top_predictions.slice(1, 3).map((pred, index) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <Typography variant="body2">
                              {pred.plant_type} - {pred.condition} ({(pred.confidence * 100).toFixed(1)}%)
                            </Typography>
                          </Box>
                        ))}
                      </Paper>
                    )}

                    {/* Recommendations */}
                    {detection.recommendations && (
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Treatment Recommendations
                        </Typography>
                        
                        {detection.recommendations.immediate_actions.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="error">
                              Immediate Actions:
                            </Typography>
                            <List dense>
                              {detection.recommendations.immediate_actions.map((action, index) => (
                                <ListItem key={index}>
                                  <ListItemText 
                                    primary={`• ${action}`}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}

                        {detection.recommendations.treatment_options.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="warning.main">
                              Treatment Options:
                            </Typography>
                            <List dense>
                              {detection.recommendations.treatment_options.map((treatment, index) => (
                                <ListItem key={index}>
                                  <ListItemText 
                                    primary={`• ${treatment}`}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}

                        {detection.recommendations.preventive_measures.length > 0 && (
                          <Box>
                            <Typography variant="subtitle2" color="info.main">
                              Preventive Measures:
                            </Typography>
                            <List dense>
                              {detection.recommendations.preventive_measures.map((measure, index) => (
                                <ListItem key={index}>
                                  <ListItemText 
                                    primary={`• ${measure}`}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}
                      </Paper>
                    )}
                  </Box>
                ) : (
                  <Alert severity="error">
                    {detection.error || 'Disease detection failed'}
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default DiseaseDetector;