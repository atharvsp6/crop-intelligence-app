import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, Shadows } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import HomePage from './components/HomePage';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CropPredictor from './components/CropPredictor';
import DiseaseDetector from './components/DiseaseDetector';
import FinancialDashboard from './components/FinancialDashboard';
import MarketIntelligence from './components/MarketIntelligence';
import MandiData from './components/MandiData';
import CommunityForum from './components/CommunityForum';
import Chatbot from './components/Chatbot';
import MultilingualChatbot from './components/MultilingualChatbot';
import './App.css';

const SIDEBAR_WIDTH = 272;

function App() {
  const [darkMode, setDarkMode] = React.useState(() => {
    const storedPref = localStorage.getItem('yieldwise.theme');
    return storedPref ? storedPref === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(darkMode ? 'theme-dark' : 'theme-light');
    localStorage.setItem('yieldwise.theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const softShadow = darkMode
    ? '0px 12px 24px rgba(10, 15, 12, 0.45)'
    : '0px 12px 30px rgba(57, 96, 69, 0.12)';
  const mediumShadow = darkMode
    ? '0px 18px 36px rgba(6, 10, 8, 0.55)'
    : '0px 18px 40px rgba(31, 64, 45, 0.14)';
  const deepShadow = darkMode
    ? '0px 28px 60px rgba(4, 7, 6, 0.65)'
    : '0px 28px 60px rgba(24, 54, 35, 0.18)';

  const shadows: Shadows = [
    'none',
    softShadow,
    softShadow,
    mediumShadow,
    mediumShadow,
    deepShadow,
    deepShadow,
    deepShadow,
    deepShadow,
    deepShadow,
    deepShadow,
    deepShadow,
    deepShadow,
    deepShadow,
    deepShadow,
    deepShadow,
    deepShadow,
    deepShadow,
    deepShadow,
    deepShadow,
    deepShadow,
    deepShadow,
    deepShadow,
    deepShadow,
    deepShadow,
  ];

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? '#7ddf92' : '#2f855a',
        light: darkMode ? '#9cf0ac' : '#48bb78',
        dark: darkMode ? '#63c07a' : '#276749',
        contrastText: '#0f1411',
      },
      secondary: {
        main: darkMode ? '#f6b73c' : '#f6ad55',
        light: darkMode ? '#ffd57f' : '#fbd38d',
        dark: darkMode ? '#d19d34' : '#dd6b20',
        contrastText: darkMode ? '#0f1411' : '#1c160d',
      },
      success: {
        main: darkMode ? '#77e0a0' : '#2f9e44',
        light: darkMode ? '#8ff2b4' : '#51cf66',
        dark: darkMode ? '#59c27f' : '#2b8a3e',
      },
      warning: {
        main: darkMode ? '#f7b168' : '#dd6b20',
        light: darkMode ? '#ffca92' : '#f6ad55',
        dark: darkMode ? '#d99752' : '#c05621',
      },
      error: {
        main: darkMode ? '#ff6b6b' : '#e53e3e',
        light: darkMode ? '#ffa8a8' : '#fc8181',
        dark: darkMode ? '#ff5252' : '#c53030',
      },
      background: {
        default: darkMode ? '#0f1411' : '#f5f7f3',
        paper: darkMode ? '#161d1a' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#e7f5ee' : '#1e2a1f',
        secondary: darkMode ? 'rgba(231,245,238,0.7)' : 'rgba(30,42,31,0.65)',
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
      borderRadius: 16,
    },
    shadows,
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: darkMode ? '0 18px 40px rgba(5, 10, 8, 0.5)' : '0 20px 45px rgba(31, 64, 45, 0.08)',
            borderRadius: 18,
            border: `1px solid ${darkMode ? 'rgba(123, 228, 149, 0.08)' : 'rgba(47, 133, 90, 0.08)'}`,
            backgroundImage: darkMode
              ? 'linear-gradient(140deg, rgba(22,29,26,0.98) 0%, rgba(20,28,24,0.9) 100%)'
              : 'linear-gradient(140deg, rgba(255,255,255,0.96) 0%, rgba(244,247,243,0.9) 100%)',
            transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            '&:hover': {
              transform: 'translateY(-6px)',
              boxShadow: darkMode ? '0 28px 60px rgba(12, 18, 15, 0.65)' : '0 28px 60px rgba(47, 133, 90, 0.18)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            textTransform: 'none',
            fontWeight: 600,
            padding: '10px 22px',
            letterSpacing: '0.015em',
          },
          contained: {
            boxShadow: darkMode ? '0 12px 24px rgba(116, 217, 144, 0.25)' : '0 12px 24px rgba(47, 133, 90, 0.25)',
            '&:hover': {
              boxShadow: darkMode ? '0 16px 32px rgba(116, 217, 144, 0.32)' : '0 18px 36px rgba(47, 133, 90, 0.32)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: darkMode
              ? 'linear-gradient(120deg, rgba(13,25,20,0.95) 0%, rgba(20,32,25,0.85) 100%)'
              : 'linear-gradient(120deg, rgba(239, 255, 244, 0.85) 0%, rgba(217, 244, 226, 0.9) 100%)',
            color: darkMode ? '#d1ffe0' : '#1e2a1f',
            boxShadow: 'none',
            borderBottom: `1px solid ${darkMode ? 'rgba(125, 228, 154, 0.1)' : 'rgba(41, 94, 56, 0.12)'}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            background: darkMode
              ? 'linear-gradient(160deg, rgba(14, 20, 17, 0.98) 0%, rgba(8, 12, 10, 0.92) 100%)'
              : 'linear-gradient(160deg, rgba(248, 252, 248, 0.96) 0%, rgba(235, 244, 236, 0.92) 100%)',
            borderRight: `1px solid ${darkMode ? 'rgba(125, 228, 154, 0.08)' : 'rgba(47, 133, 90, 0.1)'}`,
            backdropFilter: 'blur(12px)',
          },
        },
      },
    },
  });

  const handleThemeToggle = () => {
    setDarkMode(prev => !prev);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard/*" element={
            <ProtectedRoute>
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
                <Header
                  onThemeToggle={handleThemeToggle}
                  darkMode={darkMode}
                  onSidebarToggle={handleSidebarToggle}
                />
                <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
                  <Sidebar open={sidebarOpen} width={SIDEBAR_WIDTH} />
                  <Box
                    component="main"
                    sx={{
                      flexGrow: 1,
                      width: { xs: '100%', md: '100%' },
                      px: { xs: 2, md: 3, lg: 4 },
                      py: { xs: 3, md: 4, lg: 6 },
                      overflow: 'auto',
                      marginLeft: { xs: 0, md: 0 },
                      transition: 'all 0.3s ease',
                      minHeight: '100vh',
                      backgroundColor: 'background.default',
                      backgroundImage: darkMode
                        ? 'radial-gradient(circle at 20% 20%, rgba(125, 228, 154, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 0%, rgba(80, 155, 115, 0.07) 0%, transparent 45%)'
                        : 'radial-gradient(circle at 20% 20%, rgba(79, 209, 145, 0.14) 0%, transparent 55%), radial-gradient(circle at 80% 0%, rgba(56, 161, 105, 0.08) 0%, transparent 50%)',
                      backdropFilter: 'blur(2px)',
                    }}
                  >
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/crop-predictor" element={<CropPredictor />} />
                      <Route path="/disease-detector" element={<DiseaseDetector />} />
                      <Route path="/financial-dashboard" element={<FinancialDashboard />} />
                      <Route path="/market-intelligence" element={<MarketIntelligence />} />
                      <Route path="/mandi-data" element={<MandiData />} />
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
