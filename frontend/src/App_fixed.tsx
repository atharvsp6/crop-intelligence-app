import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CropPredictor from './components/CropPredictor';
import DiseaseDetector from './components/DiseaseDetector';
import FinancialDashboard from './components/FinancialDashboard';
import CommunityForum from './components/CommunityForum';
import Chatbot from './components/Chatbot';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const { isAuthenticated } = useAuth();

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
      text: {
        primary: darkMode ? '#FFFFFF' : '#2C5234',
        secondary: darkMode ? '#B0B0B0' : '#5A7C65',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
        color: darkMode ? '#FFFFFF' : '#2C5234',
      },
      h2: {
        fontWeight: 600,
        fontSize: '2rem',
        color: darkMode ? '#FFFFFF' : '#2C5234',
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.75rem',
        color: darkMode ? '#FFFFFF' : '#2C5234',
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
        color: darkMode ? '#FFFFFF' : '#2C5234',
      },
      h5: {
        fontWeight: 500,
        fontSize: '1.25rem',
        color: darkMode ? '#FFFFFF' : '#2C5234',
      },
      h6: {
        fontWeight: 500,
        fontSize: '1.125rem',
        color: darkMode ? '#FFFFFF' : '#2C5234',
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
        color: darkMode ? '#E0E0E0' : '#5A7C65',
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
        color: darkMode ? '#B0B0B0' : '#7A8F85',
      },
      button: {
        fontWeight: 600,
        textTransform: 'none',
        fontSize: '0.95rem',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '16px',
            boxShadow: darkMode 
              ? '0px 4px 20px rgba(0, 0, 0, 0.3)'
              : '0px 4px 20px rgba(46, 125, 50, 0.1)',
            background: darkMode 
              ? 'linear-gradient(145deg, #1E1E1E 0%, #2A2A2A 100%)'
              : 'linear-gradient(145deg, #FFFFFF 0%, #F8F9FA 100%)',
            backdropFilter: 'blur(10px)',
            border: darkMode ? '1px solid #333' : '1px solid rgba(46, 125, 50, 0.1)',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: darkMode
                ? '0px 8px 30px rgba(0, 0, 0, 0.4)'
                : '0px 8px 30px rgba(46, 125, 50, 0.15)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '0.95rem',
            textTransform: 'none',
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