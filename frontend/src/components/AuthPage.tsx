import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Stack,
  InputAdornment,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Person,
  Lock,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE } from '../config';
import { AuthContext } from '../context/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination, or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 3,
      backgroundColor: '#fafafa',
      '& fieldset': {
        borderColor: 'rgba(47, 133, 90, 0.2)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(47, 133, 90, 0.4)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#2f855a',
        borderWidth: 2,
      },
      '& .MuiOutlinedInput-input': {
        color: '#333333',
      },
    },
    '& .MuiInputLabel-root': {
      color: '#666666',
      '&.Mui-focused': {
        color: '#2f855a',
      },
      '&.MuiFormLabel-filled': {
        color: '#2f855a',
      },
    },
    '& .MuiFormHelperText-root': {
      color: '#666666',
    },
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError('');
    setSuccess('');
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleGoogleLoginSuccess = async (tokenResponse: any) => {
    setLoading(true);
    setError('');

    try {
      // useGoogleLogin with implicit flow returns access_token, not credential
      const response = await axios.post(`${API_BASE}/api/auth/google-login`, {
        accessToken: tokenResponse.access_token,
      });

      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        authContext?.login(user, token);
        setSuccess('Google login successful! Redirecting...');
        
        // Redirect after a short delay to show success message
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1500);
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      setError(error.response?.data?.message || error.response?.data?.error || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: () => {
      setError('Google login failed. Please try again.');
    },
    flow: 'implicit',
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, {
        email: loginForm.email,
        password: loginForm.password,
      });

      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        authContext?.login(user, token);
        setSuccess('Login successful! Redirecting...');
        
        // Redirect after a short delay to show success message
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1500);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (registerForm.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
  const response = await axios.post(`${API_BASE}/api/auth/register`, {
        username: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        full_name: registerForm.name,
      });

      if (response.data.success) {
        setSuccess('Registration successful! Please log in.');
        setActiveTab(0);
        setRegisterForm({ name: '', email: '', password: '', confirmPassword: '' });
      }
    } catch (error: any) {
      console.log('Registration error:', error);
      console.log('Error response:', error.response);
      setError(error.response?.data?.message || error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #0f1411 0%, #1a2420 50%, #2f855a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: { xs: 1, sm: 2 },
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <Paper
        elevation={20}
        sx={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 4,
          background: 'linear-gradient(145deg, #ffffff 0%, #fafafa 100%)',
          overflow: 'hidden',
          margin: 'auto',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(125, 228, 154, 0.1)',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #2f855a 0%, #276749 100%)',
            color: 'white',
            padding: 4,
            textAlign: 'center',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 30%, rgba(125, 228, 154, 0.15) 0%, transparent 50%)',
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box 
              sx={{ 
                fontSize: '3rem', 
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              🌾
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, fontSize: '2.2rem' }}>
              YieldWise
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, fontSize: '1.1rem' }}>
              Smart AI-Powered Farming for Better Yields
            </Typography>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(47, 133, 90, 0.2)' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '1rem',
                color: '#666666',
                '&.Mui-selected': {
                  color: '#2f855a',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#2f855a',
                height: 3,
                borderRadius: '3px 3px 0 0',
              }
            }}
          >
            <Tab label="SIGN IN" />
            <Tab label="SIGN UP" />
          </Tabs>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ m: 2, mb: 0 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ m: 2, mb: 0 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Login Panel */}
        <TabPanel value={activeTab} index={0}>
          <form onSubmit={handleLoginSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                placeholder="demo2@gmail.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
                variant="outlined"
                helperText="Demo email: demo2@gmail.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#2f855a' }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="demo123"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
                variant="outlined"
                helperText="Demo password: demo123"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#2f855a' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleClickShowPassword}
                        edge="end"
                        sx={{ color: '#666666' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  borderRadius: 3,
                  height: 56,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #2f855a 0%, #276749 100%)',
                  boxShadow: '0 8px 32px rgba(47, 133, 90, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #276749 0%, #1e4d33 100%)',
                    boxShadow: '0 12px 40px rgba(47, 133, 90, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                  '&:disabled': {
                    background: 'rgba(47, 133, 90, 0.6)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
              <Divider sx={{ my: 2, color: '#cccccc' }}>OR</Divider>
              <Button
                onClick={() => googleLogin()}
                fullWidth
                variant="outlined"
                size="large"
                disabled={loading}
                sx={{
                  borderRadius: 3,
                  height: 56,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderColor: '#2f855a',
                  color: '#2f855a',
                  backgroundColor: '#ffffff',
                  border: '2px solid #2f855a',
                  '&:hover': {
                    backgroundColor: 'rgba(47, 133, 90, 0.05)',
                    borderColor: '#276749',
                  },
                  '&:disabled': {
                    borderColor: 'rgba(47, 133, 90, 0.3)',
                    color: 'rgba(47, 133, 90, 0.3)',
                  },
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  gap: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>
            </Stack>
          </form>
        </TabPanel>

        {/* Register Panel */}
        <TabPanel value={activeTab} index={1}>
          <form onSubmit={handleRegisterSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Full Name"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                required
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#2f855a' }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                required
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#2f855a' }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                required
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#2f855a' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleClickShowPassword}
                        edge="end"
                        sx={{ color: '#666666' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
              <TextField
                fullWidth
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                required
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#2f855a' }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  borderRadius: 3,
                  height: 56,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #2f855a 0%, #276749 100%)',
                  boxShadow: '0 8px 32px rgba(47, 133, 90, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #276749 0%, #1e4d33 100%)',
                    boxShadow: '0 12px 40px rgba(47, 133, 90, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                  '&:disabled': {
                    background: 'rgba(47, 133, 90, 0.6)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
              </Button>
              <Divider sx={{ my: 2, color: '#cccccc' }}>OR</Divider>
              <Button
                onClick={() => googleLogin()}
                fullWidth
                variant="outlined"
                size="large"
                disabled={loading}
                sx={{
                  borderRadius: 3,
                  height: 56,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderColor: '#2f855a',
                  color: '#2f855a',
                  backgroundColor: '#ffffff',
                  border: '2px solid #2f855a',
                  '&:hover': {
                    backgroundColor: 'rgba(47, 133, 90, 0.05)',
                    borderColor: '#276749',
                  },
                  '&:disabled': {
                    borderColor: 'rgba(47, 133, 90, 0.3)',
                    color: 'rgba(47, 133, 90, 0.3)',
                  },
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  gap: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign up with Google
              </Button>
            </Stack>
          </form>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AuthPage;