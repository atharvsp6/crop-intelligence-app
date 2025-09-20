import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  LinearProgress,
} from '@mui/material';
import {
  Agriculture,
  LocalHospital,
  TrendingUp,
  Forum,
  Chat,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

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
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to Crop Intelligence Platform
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Your comprehensive farming assistant powered by AI and machine learning
      </Typography>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  {stat.label}
                </Typography>
                <Typography variant="h5" component="div">
                  {stat.value}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <LinearProgress variant="determinate" value={stat.progress} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Feature Cards */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Platform Features
      </Typography>
      <Grid container spacing={3}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease-in-out',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                    color: feature.color,
                  }}
                >
                  {feature.icon}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {feature.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={() => navigate(feature.path)}
                  sx={{ color: feature.color }}
                >
                  Get Started
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;