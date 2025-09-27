import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Paper,
  Divider,
} from '@mui/material';
import {
  WbSunny,
  Cloud,
  Thermostat,
  OpacitySharp as Humidity,
  Air as Wind,
  Visibility,
  CompressSharp as Pressure,
  LocationOn,
  Refresh,
  Warning,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE } from '../config';

interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  pressure: number;
  location: string;
  timestamp: string;
}

interface WeatherAlert {
  type: string;
  severity: string;
  message: string;
  recommendation: string;
}

const WeatherComponent: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<WeatherData[]>([]);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lon: longitude });
          fetchAllWeatherData(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Location access denied. Please allow location access for accurate weather data.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
    }
  };

  const fetchAllWeatherData = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch current weather
  const currentWeather = await axios.get(`${API_BASE}/api/weather/current?lat=${lat}&lon=${lon}`);
      
      // Fetch forecast
  const forecastData = await axios.get(`${API_BASE}/api/weather/forecast?lat=${lat}&lon=${lon}&days=5`);
      
      // Fetch agricultural alerts
  const alertsData = await axios.get(`${API_BASE}/api/weather/alerts?lat=${lat}&lon=${lon}`);

      if (currentWeather.data.success) {
        const current = currentWeather.data.current;
        const location = currentWeather.data.location;
        setWeather({
          temperature: current.temperature,
          condition: current.main,
          description: current.description,
          humidity: current.humidity,
          windSpeed: current.wind_speed,
          visibility: current.visibility,
          pressure: current.pressure,
          location: location.name,
          timestamp: currentWeather.data.timestamp
        });
      }
      
      if (forecastData.data.success) {
        setForecast(forecastData.data.forecast);
      }
      
      if (alertsData.data.success) {
        setAlerts(alertsData.data.alerts);
      }

    } catch (error) {
      console.error('Weather fetch error:', error);
      setError('Failed to fetch weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshWeather = () => {
    if (location) {
      fetchAllWeatherData(location.lat, location.lon);
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <WbSunny sx={{ fontSize: 40, color: '#FFA726' }} />;
      case 'cloudy':
      case 'overcast':
        return <Cloud sx={{ fontSize: 40, color: '#78909C' }} />;
      default:
        return <WbSunny sx={{ fontSize: 40, color: '#FFA726' }} />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading weather data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Agricultural Weather
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={refreshWeather}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Agricultural Alerts */}
      {alerts.length > 0 && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            <Warning sx={{ verticalAlign: 'middle', mr: 1 }} />
            Agricultural Alerts
          </Typography>
          {alerts.map((alert, index) => (
            <Alert 
              key={index} 
              severity={alert.severity as any} 
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle2">{alert.type}</Typography>
              <Typography variant="body2">{alert.message}</Typography>
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                Recommendation: {alert.recommendation}
              </Typography>
            </Alert>
          ))}
        </Box>
      )}

      {/* Current Weather */}
      {weather && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
              {/* Weather Main Info */}
              <Box display="flex" alignItems="center" flex={1}>
                {getWeatherIcon(weather.condition)}
                <Box ml={2}>
                  <Typography variant="h3" fontWeight="bold">
                    {weather.temperature}°C
                  </Typography>
                  <Typography variant="h6" color="textSecondary">
                    {weather.condition} - {weather.description}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                    <Typography variant="body2" color="textSecondary">
                      {weather.location}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              {/* Weather Details */}
              <Box flex={1}>
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                  <Box display="flex" alignItems="center">
                    <Humidity sx={{ color: '#2196F3', mr: 1 }} />
                    <Box>
                      <Typography variant="body2" color="textSecondary">Humidity</Typography>
                      <Typography variant="h6">{weather.humidity}%</Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <Wind sx={{ color: '#4CAF50', mr: 1 }} />
                    <Box>
                      <Typography variant="body2" color="textSecondary">Wind Speed</Typography>
                      <Typography variant="h6">{weather.windSpeed || 0} km/h</Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <Visibility sx={{ color: '#FF9800', mr: 1 }} />
                    <Box>
                      <Typography variant="body2" color="textSecondary">Visibility</Typography>
                      <Typography variant="h6">{weather.visibility || 10} km</Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <Pressure sx={{ color: '#9C27B0', mr: 1 }} />
                    <Box>
                      <Typography variant="body2" color="textSecondary">Pressure</Typography>
                      <Typography variant="h6">{weather.pressure || 1013} mb</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 5-Day Forecast */}
      {forecast.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              5-Day Forecast
            </Typography>
            <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} overflow="auto">
              {forecast.map((day, index) => (
                <Paper elevation={1} sx={{ p: 2, textAlign: 'center', minWidth: 150 }} key={index}>
                  {getWeatherIcon(day.condition)}
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Day {index + 1}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {day.temperature}°C
                  </Typography>
                  <Typography variant="body2">
                    {day.condition}
                  </Typography>
                  <Chip
                    icon={<Humidity />}
                    label={`${day.humidity}%`}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Paper>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default WeatherComponent;