import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
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

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
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
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
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
                p: 3,
                overflow: 'auto',
                marginLeft: sidebarOpen ? '240px' : '0px',
                transition: 'margin-left 0.3s',
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
      </Router>
    </ThemeProvider>
  );
}

export default App;
