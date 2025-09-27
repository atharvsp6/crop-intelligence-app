import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import AuthPage from './components/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CropPredictor from './components/CropPredictor';
import DiseaseDetector from './components/DiseaseDetector';
import FinancialDashboard from './components/FinancialDashboard';
import CommunityForum from './components/CommunityForum';
import Chatbot from './components/Chatbot';
import MultilingualChatbot from './components/MultilingualChatbot';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#2E7D32', // Deep forest green
        light: '#4CAF50',
        dark: '#1B5E20',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#FF8F00', // Warm amber
        light: '#FFB74D',
        dark: '#E65100',
        contrastText: '#FFFFFF',
      },
      success: {
        main: '#388E3C',
        light: '#66BB6A',
        dark: '#2E7D32',
      },
      warning: {
        main: '#F57C00',
        light: '#FFB74D',
        dark: '#E65100',
      },
      error: {
        main: '#D32F2F',
        light: '#F44336',
        dark: '#C62828',
      },
      background: {
        default: darkMode ? '#121212' : '#F8F9FA',
        paper: darkMode ? '#1E1E1E' : '#FFFFFF',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
        lineHeight: 1.2,
      },
      h2: {
        fontWeight: 600,
        fontSize: '2rem',
        lineHeight: 1.3,
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.5rem',
        lineHeight: 1.4,
      },
      h4: {
        fontWeight: 500,
        fontSize: '1.25rem',
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: [
      'none',
      '0px 2px 4px rgba(0,0,0,0.05)',
      '0px 4px 8px rgba(0,0,0,0.1)',
      '0px 8px 16px rgba(0,0,0,0.1)',
      '0px 12px 24px rgba(0,0,0,0.15)',
      '0px 16px 32px rgba(0,0,0,0.2)',
      '0px 20px 40px rgba(0,0,0,0.25)',
      '0px 24px 48px rgba(0,0,0,0.3)',
      '0px 28px 56px rgba(0,0,0,0.35)',
      '0px 32px 64px rgba(0,0,0,0.4)',
      '0px 36px 72px rgba(0,0,0,0.45)',
      '0px 40px 80px rgba(0,0,0,0.5)',
      '0px 44px 88px rgba(0,0,0,0.55)',
      '0px 48px 96px rgba(0,0,0,0.6)',
      '0px 52px 104px rgba(0,0,0,0.65)',
      '0px 56px 112px rgba(0,0,0,0.7)',
      '0px 60px 120px rgba(0,0,0,0.75)',
      '0px 64px 128px rgba(0,0,0,0.8)',
      '0px 68px 136px rgba(0,0,0,0.85)',
      '0px 72px 144px rgba(0,0,0,0.9)',
      '0px 76px 152px rgba(0,0,0,0.95)',
      '0px 80px 160px rgba(0,0,0,1)',
      '0px 84px 168px rgba(0,0,0,1)',
      '0px 88px 176px rgba(0,0,0,1)',
      '0px 92px 184px rgba(0,0,0,1)',
    ],
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
            borderRadius: 16,
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            padding: '10px 24px',
          },
          contained: {
            boxShadow: '0px 2px 8px rgba(46, 125, 50, 0.3)',
            '&:hover': {
              boxShadow: '0px 4px 16px rgba(46, 125, 50, 0.4)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: darkMode 
              ? 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)'
              : 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
            boxShadow: '0px 2px 20px rgba(46, 125, 50, 0.15)',
          },
        },
      },
    },
  });

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
                <Header
                  onThemeToggle={handleThemeToggle}
                  darkMode={darkMode}
                  onSidebarToggle={handleSidebarToggle}
                />
                <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                  <Sidebar open={sidebarOpen} />
                  <Box
                    component="main"
                    sx={{
                      flexGrow: 1,
                      p: { xs: 1, sm: 2, md: 3 },
                      overflow: 'auto',
                      marginLeft: { xs: 0, md: sidebarOpen ? '240px' : '0px' },
                      transition: 'margin-left 0.3s',
                      minHeight: '100vh',
                      backgroundColor: 'background.default',
                    }}
                  >
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/crop-predictor" element={<CropPredictor />} />
                      <Route path="/disease-detector" element={<DiseaseDetector />} />
                      <Route path="/financial-dashboard" element={<FinancialDashboard />} />
                      <Route path="/community-forum" element={<CommunityForum />} />
                      <Route path="/chatbot" element={<Chatbot />} />
                      <Route path="/multilingual-chatbot" element={<MultilingualChatbot />} />
                    </Routes>
                  </Box>
                </Box>
              </Box>
            </ProtectedRoute>
          } />
        </Routes>
      </Box>
    </ThemeProvider>
  );
}

export default App;
