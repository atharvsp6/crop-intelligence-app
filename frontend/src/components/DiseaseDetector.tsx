import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
} from '@mui/material';
import { 
  LocalHospital, 
  CloudUpload, 
  PhotoCamera,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  LightbulbOutlined,
  Shield,
  Healing,
  BugReport,
  CameraAlt,
  WbSunny,
  CenterFocusStrong,
  Spa,
  ImageSearch,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE } from '../config';

interface DetectionResult {
  success: boolean;
  prediction?: {
    plant_type: string;
    condition: string;
    confidence: number;
    is_healthy: boolean;
    disease?: string;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setDetection(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!selectedImage || !selectedFile) return;

    setLoading(true);
    setDetection(null);
    setProgress(0);
    setProgressMessage('Preparing image...');

    const token = localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      setProgress(20);
      setProgressMessage('Uploading to detection service...');
      
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      setProgress(40);
      setProgressMessage('Analyzing plant health...');
      
      const response = await axios.post<DetectionResult>(
        `${API_BASE}/api/detect-disease`,
        formData,
        { headers: authHeaders }
      );
      
      setProgress(80);
      setProgressMessage('Finalizing results...');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress(100);
      setProgressMessage('Analysis complete!');
      setDetection(response.data);

      try {
        const src = (response.data as any)?.prediction_source;
        const method = (response.data as any)?.detection_method;
        if (src === 'gemini_ai' || method === 'gemini_ai_fallback') {
          console.log('Disease detection completed (fallback method)');
        } else if (src === 'custom_api') {
          console.log('Disease detection completed (primary method)');
        }
      } catch {}
    } catch (error: unknown) {
      let message = 'Disease detection request failed. Ensure you are logged in and try another clear plant image.';
      if (axios.isAxiosError(error)) {
        const backendError = (error.response?.data as any)?.error || (error.response?.data as any)?.message;
        if (backendError) {
          message = backendError;
        } else if (error.response?.status === 401) {
          message = 'Please log in to analyze plant diseases.';
        }
      }
      setDetection({ success: false, error: message });
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        setProgressMessage('');
      }, 500);
    }
  };

  const getSeverityColor = (severity: string): 'error' | 'warning' | 'info' | 'success' => {
    switch (severity.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'success';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return <ErrorIcon />;
      case 'medium': return <Warning />;
      case 'low': return <Warning />;
      default: return <CheckCircle />;
    }
  };

  const tipsList = [
    { icon: <WbSunny fontSize="small" />, text: 'Use clear, well-lit images' },
    { icon: <CenterFocusStrong fontSize="small" />, text: 'Focus on affected plant parts' },
    { icon: <CameraAlt fontSize="small" />, text: 'Avoid blurry or dark images' },
    { icon: <Spa fontSize="small" />, text: 'Include leaves, stems, or fruits clearly' },
  ];

  const accentColor = dark ? theme.palette.primary.main : theme.palette.primary.dark;

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Hero Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(accentColor, 0.15)} 0%, ${alpha(accentColor, 0.08)} 100%)`,
              border: `1px solid ${alpha(accentColor, 0.2)}`,
              display: 'grid',
              placeItems: 'center',
              color: 'primary.main',
            }}
          >
            <BugReport />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
              Plant Disease Detection
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload a plant image to instantly diagnose diseases and get treatment recommendations
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Left Column */}
        <Box sx={{ flex: 1 }}>
          {/* Upload Card */}
          <Card
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(accentColor, dark ? 0.15 : 0.1)}`,
              overflow: 'visible',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Upload Image
              </Typography>
              
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                ref={fileInputRef}
              />
              
              <Box sx={{ mb: 2 }}>
                {selectedImage ? (
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: 3,
                      overflow: 'hidden',
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <img
                      src={selectedImage}
                      alt="Selected plant"
                      style={{
                        width: '100%',
                        maxHeight: '340px',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 1.5,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                        display: 'flex',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => fileInputRef.current?.click()}
                        startIcon={<PhotoCamera />}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(8px)',
                          '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' },
                        }}
                      >
                        Change
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Paper
                    elevation={0}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      height: 220,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: 1.5,
                      borderRadius: 3,
                      border: `2px dashed ${dragOver ? accentColor : theme.palette.divider}`,
                      backgroundColor: dragOver
                        ? alpha(accentColor, 0.06)
                        : alpha(theme.palette.action.hover, 0.03),
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: alpha(accentColor, 0.5),
                        backgroundColor: alpha(accentColor, 0.04),
                        '& .upload-icon': {
                          transform: 'translateY(-4px)',
                          color: 'primary.main',
                        },
                      },
                    }}
                  >
                    <ImageSearch
                      className="upload-icon"
                      sx={{
                        fontSize: 48,
                        color: 'text.disabled',
                        transition: 'all 0.3s ease',
                      }}
                    />
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Drag & drop or click to upload
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Supports JPG, PNG, WebP
                    </Typography>
                  </Paper>
                )}
              </Box>

              {/* Progress bar */}
              {loading && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="primary" sx={{ fontWeight: 500 }}>
                      {progressMessage}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(progress)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      borderRadius: 4,
                      height: 6,
                      backgroundColor: alpha(accentColor, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              )}
              
              {/* Analyze button */}
              <Button
                variant="contained"
                onClick={handleAnalyze}
                disabled={!selectedImage || loading}
                fullWidth
                size="large"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LocalHospital />}
                sx={{
                  borderRadius: 2.5,
                  py: 1.4,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              >
                {loading ? 'Analyzing...' : 'Analyze Disease'}
              </Button>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card
            sx={{
              mt: 2,
              borderRadius: 3,
              border: `1px solid ${alpha(accentColor, dark ? 0.12 : 0.08)}`,
              background: alpha(accentColor, dark ? 0.03 : 0.02),
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <LightbulbOutlined sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Tips for Best Results
                </Typography>
              </Box>
              <List dense disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {tipsList.map((tip, i) => (
                  <ListItem key={i} disablePadding sx={{ py: 0.3 }}>
                    <ListItemIcon sx={{ minWidth: 32, color: 'text.secondary' }}>
                      {tip.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={tip.text}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Results Column */}
        <Box sx={{ flex: 1 }}>
          {!detection && !loading && (
            <Box
              sx={{
                height: '100%',
                minHeight: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2,
                borderRadius: 3,
                border: `1px dashed ${theme.palette.divider}`,
                p: 4,
              }}
            >
              <LocalHospital sx={{ fontSize: 56, color: 'text.disabled' }} />
              <Typography variant="body1" color="text.secondary" textAlign="center">
                Upload a plant image and click <strong>Analyze Disease</strong> to see results here
              </Typography>
            </Box>
          )}

          {detection && (
            <Card
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha(accentColor, dark ? 0.15 : 0.1)}`,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Analysis Results
                </Typography>
                
                {detection.success ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Main Prediction */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 2.5,
                        backgroundColor: alpha(accentColor, dark ? 0.06 : 0.04),
                        border: `1px solid ${alpha(accentColor, dark ? 0.15 : 0.1)}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Box sx={{ color: detection.prediction?.is_healthy ? 'success.main' : 'warning.main' }}>
                          {getSeverityIcon(detection.prediction?.severity || 'none')}
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {detection.prediction?.plant_type || (detection.prediction as any)?.crop || 'Unknown Plant'}
                        </Typography>
                      </Box>
                      
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
                        {detection.prediction?.condition}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip
                          label={`Confidence: ${((detection.prediction?.confidence ?? 0) * 100).toFixed(1)}%`}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                        {(detection.prediction as any)?.crop && !(detection.prediction as any)?.plant_type && (
                          <Chip
                            label={`Crop: ${(detection.prediction as any)?.crop}`}
                            color="info"
                            variant="outlined"
                            size="small"
                          />
                        )}
                        {detection.prediction?.disease && detection.prediction?.disease.toLowerCase() !== 'none' && (
                          <Chip label={`Disease: ${detection.prediction?.disease}`} color="secondary" size="small" />
                        )}
                        <Chip
                          label={`Severity: ${detection.prediction?.severity}`}
                          color={getSeverityColor(detection.prediction?.severity || 'none')}
                          size="small"
                        />
                      </Box>
                      
                      {detection.prediction?.is_healthy ? (
                        <Alert severity="success" sx={{ borderRadius: 2 }}>
                          Great! Your plant appears to be healthy.
                        </Alert>
                      ) : (
                        <Alert severity="warning" sx={{ borderRadius: 2 }}>
                          Disease detected. Please review the recommendations below.
                        </Alert>
                      )}
                    </Paper>

                    {/* Top Predictions */}
                    {detection.top_predictions && detection.top_predictions.length > 1 && (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 2.5,
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                          Alternative Predictions
                        </Typography>
                        {detection.top_predictions.slice(1, 3).map((pred, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              py: 0.8,
                              borderBottom: index === 0 ? `1px solid ${theme.palette.divider}` : 'none',
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              {pred.plant_type} — {pred.condition}
                            </Typography>
                            <Chip
                              label={`${(pred.confidence * 100).toFixed(1)}%`}
                              size="small"
                              variant="outlined"
                              sx={{ minWidth: 60, justifyContent: 'center' }}
                            />
                          </Box>
                        ))}
                      </Paper>
                    )}

                    {/* Recommendations */}
                    {detection.recommendations && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {detection.recommendations.immediate_actions.length > 0 && (
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2.5,
                              borderRadius: 2.5,
                              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                              backgroundColor: alpha(theme.palette.error.main, dark ? 0.05 : 0.03),
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'error.main' }}>
                                Immediate Actions
                              </Typography>
                            </Box>
                            <List dense disablePadding>
                              {detection.recommendations.immediate_actions.map((action, index) => (
                                <ListItem key={index} disablePadding sx={{ py: 0.3 }}>
                                  <ListItemIcon sx={{ minWidth: 28 }}>
                                    <Shield sx={{ fontSize: 16, color: 'error.main' }} />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={action}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Paper>
                        )}

                        {detection.recommendations.treatment_options.length > 0 && (
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2.5,
                              borderRadius: 2.5,
                              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                              backgroundColor: alpha(theme.palette.warning.main, dark ? 0.05 : 0.03),
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Healing sx={{ color: 'warning.main', fontSize: 20 }} />
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                Treatment Options
                              </Typography>
                            </Box>
                            <List dense disablePadding>
                              {detection.recommendations.treatment_options.map((treatment, index) => (
                                <ListItem key={index} disablePadding sx={{ py: 0.3 }}>
                                  <ListItemIcon sx={{ minWidth: 28 }}>
                                    <Healing sx={{ fontSize: 16, color: 'warning.main' }} />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={treatment}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Paper>
                        )}

                        {detection.recommendations.preventive_measures.length > 0 && (
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2.5,
                              borderRadius: 2.5,
                              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                              backgroundColor: alpha(theme.palette.info.main, dark ? 0.05 : 0.03),
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <CheckCircle sx={{ color: 'info.main', fontSize: 20 }} />
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'info.main' }}>
                                Preventive Measures
                              </Typography>
                            </Box>
                            <List dense disablePadding>
                              {detection.recommendations.preventive_measures.map((measure, index) => (
                                <ListItem key={index} disablePadding sx={{ py: 0.3 }}>
                                  <ListItemIcon sx={{ minWidth: 28 }}>
                                    <CheckCircle sx={{ fontSize: 16, color: 'info.main' }} />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={measure}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Paper>
                        )}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {detection.error || 'Disease detection failed'}
                    {detection && (detection as any).plant_likelihood !== undefined && (
                      <Box sx={{ mt: 1 }}>
                        Plant likelihood score: {((detection as any).plant_likelihood * 100).toFixed(1)}% (need clearer plant image)
                      </Box>
                    )}
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