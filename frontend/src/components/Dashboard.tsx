import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  LinearProgress,
  Container,
  Paper,
  Chip,
  Alert,
  CircularProgress,
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
  ShowChart,
  Cloud,
  LocationOn,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [location, setLocation] = useState<string>('Getting location...');

  // Get user's current location and weather
  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherData(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          setWeatherError('Location access denied. Using default weather data.');
          setLocation('Location unavailable');
          setWeatherLoading(false);
          // Use fallback weather data
          setWeather({
            temperature: 22,
            condition: 'Sunny',
            humidity: 65,
            description: 'Perfect Growing Weather'
          });
        }
      );
    } else {
      setWeatherError('Geolocation not supported by this browser.');
      setLocation('Location unavailable');
      setWeatherLoading(false);
    }
  };

  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
  const response = await axios.get(`${API_BASE}/api/weather/current?lat=${lat}&lon=${lon}`);
      
      if (response.data.success) {
        const weatherData = response.data.current;
        const locationData = response.data.location;
        setWeather({
          temperature: Math.round(weatherData.temperature),
          condition: weatherData.main,
          humidity: weatherData.humidity,
          description: weatherData.description,
          location: locationData.name
        });
        setLocation(locationData.name || 'Your Location');
      } else {
        throw new Error(response.data.error || 'Failed to fetch weather');
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
      setWeatherError('Failed to fetch weather data');
      // Use fallback data
      setWeather({
        temperature: 22,
        condition: 'Sunny',
        humidity: 65,
        description: 'Weather data unavailable'
      });
    } finally {
      setWeatherLoading(false);
    }
  };

  const features = [
    {
      title: 'Crop Yield Predictor',
      description: 'Use ML models to predict crop yields based on environmental factors',
      icon: <Agriculture sx={{ fontSize: 40 }} />,
      path: '/crop-predictor',
      color: '#4CAF50',
    },
    {
      title: 'Disease Detection',
      description: 'Identify plant diseases using AI-powered image analysis',
      icon: <LocalHospital sx={{ fontSize: 40 }} />,
      path: '/disease-detector',
      color: '#F44336',
    },
    {
      title: 'Financial Dashboard',
      description: 'Track ROI, market trends, and financial analytics',
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      path: '/financial-dashboard',
      color: '#FF9800',
    },
    {
      title: 'Community Forum',
      description: 'Connect with farmers worldwide in multiple languages',
      icon: <Forum sx={{ fontSize: 40 }} />,
      path: '/community-forum',
      color: '#2196F3',
    },
    {
      title: 'AI Chatbot',
      description: 'Get instant farming advice from our AI assistant',
      icon: <Chat sx={{ fontSize: 40 }} />,
      path: '/chatbot',
      color: '#9C27B0',
    },
  ];

  const stats = [
    { label: 'Total Predictions Made', value: '1,234', progress: 75 },
    { label: 'Diseases Detected', value: '567', progress: 60 },
    { label: 'Forum Posts', value: '890', progress: 85 },
    { label: 'Chat Conversations', value: '2,345', progress: 90 },
  ];

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
          py: 6,
          mb: 4,
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
              }}
            >
              Welcome to AgroSmart
            </Typography>
            <Typography 
              variant="h5" 
              color="text.secondary" 
              paragraph
              sx={{ 
                maxWidth: 600,
                mx: 'auto',
                fontWeight: 400,
                lineHeight: 1.6,
              }}
            >
              Your intelligent farming companion powered by AI and machine learning. 
              Optimize crops, detect diseases, and make data-driven decisions.
            </Typography>
            
            {/* Location and Weather Status */}
            {weatherError && (
              <Alert severity="warning" sx={{ maxWidth: 400, mx: 'auto', mb: 2 }}>
                {weatherError}
              </Alert>
            )}
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              {weatherLoading ? (
                <Chip
                  icon={<CircularProgress size={16} />}
                  label="Loading weather..."
                  variant="filled"
                  sx={{ fontWeight: 500 }}
                />
              ) : (
                <>
                  <Chip
                    icon={weather?.condition === 'Sunny' || weather?.condition === 'Clear' ? <WbSunny /> : <Cloud />}
                    label={weather?.description || 'Weather unavailable'}
                    color={weather?.condition === 'Sunny' || weather?.condition === 'Clear' ? 'success' : 'default'}
                    variant="filled"
                    sx={{ fontWeight: 500 }}
                  />
                  <Chip
                    icon={<LocationOn />}
                    label={location}
                    color="primary"
                    variant="filled"
                    sx={{ fontWeight: 500 }}
                  />
                  <Chip
                    icon={<Thermostat />}
                    label={`${weather?.temperature || 22}°C`}
                    color="secondary"
                    variant="filled"
                    sx={{ fontWeight: 500 }}
                  />
                  {weather?.humidity && (
                    <Chip
                      icon={<Water />}
                      label={`Humidity ${weather.humidity}%`}
                      color="info"
                      variant="filled"
                      sx={{ fontWeight: 500 }}
                    />
                  )}
                </>
              )}
            </Box>
          </Box>

          {/* Real-time Stats Cards */}
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: 3,
              justifyItems: 'center'
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                textAlign: 'center',
                background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                color: 'white',
                borderRadius: 3,
                width: '100%',
              }}
            >
              <ShowChart sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                1,234
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Successful Predictions
              </Typography>
            </Paper>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                textAlign: 'center',
                background: 'linear-gradient(135deg, #FF8F00 0%, #FFB74D 100%)',
                color: 'white',
                borderRadius: 3,
                width: '100%',
              }}
            >
              <Agriculture sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                567
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Farms Optimized
              </Typography>
            </Paper>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                textAlign: 'center',
                background: 'linear-gradient(135deg, #F44336 0%, #EF5350 100%)',
                color: 'white',
                borderRadius: 3,
                width: '100%',
              }}
            >
              <LocalHospital sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                89
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Diseases Prevented
              </Typography>
            </Paper>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                textAlign: 'center',
                background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)',
                color: 'white',
                borderRadius: 3,
                width: '100%',
              }}
            >
              <Forum sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                2.3K
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Community Members
              </Typography>
            </Paper>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Quick Stats Overview */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Today's Overview
          </Typography>
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: 3 
            }}
          >
            {stats.map((stat, index) => (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }} key={index}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    {stat.label}
                  </Typography>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                    {stat.value}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={stat.progress}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: 'action.hover',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Feature Cards */}
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Explore Platform Features
        </Typography>
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
            gap: 3 
          }}
        >
          {features.map((feature, index) => (
            <Card
              elevation={0}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease-in-out',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  borderColor: feature.color,
                  '& .feature-icon': {
                    transform: 'scale(1.1)',
                    color: feature.color,
                  },
                  '& .feature-overlay': {
                    opacity: 0.05,
                  },
                },
              }}
              key={index}
            >
              <Box
                className="feature-overlay"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: feature.color,
                  opacity: 0,
                  transition: 'opacity 0.3s ease-in-out',
                }}
              />
              <CardContent sx={{ flexGrow: 1, position: 'relative' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    className="feature-icon"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 60,
                      height: 60,
                      borderRadius: 2,
                      backgroundColor: 'action.hover',
                      mr: 2,
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0, position: 'relative' }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate(feature.path)}
                  sx={{
                    backgroundColor: feature.color,
                    '&:hover': {
                      backgroundColor: feature.color,
                      filter: 'brightness(0.9)',
                    },
                  }}
                >
                  Get Started
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard;