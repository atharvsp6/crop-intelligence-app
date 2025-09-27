import React from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  useTheme,
  Avatar,
} from '@mui/material';
import {
  Agriculture,
  LocalHospital,
  TrendingUp,
  Lightbulb,
  People,
  AccountBalance,
  Login,
  Language,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onGetStarted: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, onGetStarted }) => {
  const theme = useTheme();
  
  return (
    <Card
      sx={{
        height: '100%',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, rgba(22, 29, 26, 0.9) 0%, rgba(31, 41, 34, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 247, 243, 0.9) 100%)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(125, 228, 154, 0.1)' : 'rgba(47, 133, 90, 0.1)'}`,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0px 20px 40px rgba(0, 0, 0, 0.4)'
            : '0px 20px 40px rgba(47, 133, 90, 0.15)',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(125, 228, 154, 0.2)' : 'rgba(47, 133, 90, 0.2)'}`,
        },
      }}
      onClick={onGetStarted}
    >
      <CardContent sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 3 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              margin: '0 auto',
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              fontSize: '2rem',
            }}
          >
            {icon}
          </Avatar>
        </Box>
        <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          {title}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            alignItems: 'center',
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>
        <Button
          variant="contained"
          size="small"
          sx={{
            mt: 3,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onGetStarted();
          }}
        >
          Get Started
        </Button>
      </CardContent>
    </Card>
  );
};

const HomePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  const features = [
    {
      icon: <Agriculture />,
      title: 'Yield Prediction',
      description: 'AI-powered crop yield forecasting with 99.55% accuracy',
    },
    {
      icon: <LocalHospital />,
      title: 'Disease Detection',
      description: 'Advanced plant disease identification and treatment recommendations',
    },
    {
      icon: <TrendingUp />,
      title: 'Market Intelligence',
      description: 'Real-time pricing and market trend analysis for better decisions',
    },
    {
      icon: <Lightbulb />,
      title: 'AI Recommendations',
      description: 'Personalized farming advice based on your crops and conditions',
    },
    {
      icon: <People />,
      title: 'Community',
      description: 'Connect with fellow farmers and agricultural experts worldwide',
    },
    {
      icon: <AccountBalance />,
      title: 'Financial Tools',
      description: 'ROI calculators and financial planning tools for your farm',
    },
  ];

  const stats = [
    { value: '99.55%', label: 'ML Accuracy' },
    { value: '10+', label: 'Crop Varieties' },
    { value: '8+', label: 'Languages' },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0f1411 0%, #1a2420 100%)'
          : 'linear-gradient(135deg, #f5f7f3 0%, #e6f3ea 100%)',
        position: 'relative',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at 20% 20%, rgba(125, 228, 154, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(80, 155, 115, 0.04) 0%, transparent 50%)'
            : 'radial-gradient(circle at 20% 20%, rgba(79, 209, 145, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(56, 161, 105, 0.06) 0%, transparent 50%)',
          zIndex: 0,
        }}
      />

      {/* Header */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          background: 'transparent',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(125, 228, 154, 0.1)' : 'rgba(47, 133, 90, 0.1)'}`,
          width: '100%',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            <Box component="span" sx={{ color: 'primary.main' }}>🌾</Box> YieldWise
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              startIcon={<Language />}
              sx={{ textTransform: 'none' }}
            >
              English
            </Button>
            <Button
              variant="contained"
              startIcon={<Login />}
              onClick={handleGetStarted}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Login
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Container 
        maxWidth="lg" 
        sx={{ 
          position: 'relative', 
          zIndex: 1, 
          pt: { xs: 6, md: 10 },
          px: { xs: 2, md: 3 },
          width: '100%',
        }}
      >
        <Box textAlign="center" sx={{ mb: { xs: 6, md: 10 } }}>
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
              fontWeight: 700,
              mb: 3,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #7ddf92 0%, #63c07a 100%)'
                : 'linear-gradient(135deg, #2f855a 0%, #276749 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.1,
            }}
          >
            Smart AI-Powered Farming for Better Yields
          </Typography>
          <Typography
            variant="h5"
            component="p"
            color="text.secondary"
            sx={{
              mb: 5,
              maxWidth: 800,
              margin: '0 auto 40px auto',
              lineHeight: 1.6,
              fontSize: { xs: '1.1rem', md: '1.3rem' },
            }}
          >
            Transform your farming with AI-driven crop recommendations, disease detection, market 
            intelligence, and expert guidance for Indian agriculture.
          </Typography>

          {/* Stats */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: { xs: 4, md: 8 },
              mb: 6,
              flexWrap: 'wrap',
            }}
          >
            {stats.map((stat, index) => (
              <Box key={index} textAlign="center">
                <Typography
                  variant="h3"
                  component="div"
                  sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                    mb: 1,
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* CTA Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleGetStarted}
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              Learn More
            </Button>
          </Box>
        </Box>

        {/* Features Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 4,
            mb: { xs: 6, md: 10 },
            width: '100%',
            overflow: 'hidden',
          }}
        >
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              onGetStarted={handleGetStarted}
            />
          ))}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(125, 228, 154, 0.1)' : 'rgba(47, 133, 90, 0.1)'}`,
            mt: { xs: 6, md: 10 },
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © 2025 YieldWise. Intelligent Agriculture Platform for Better Yields.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;