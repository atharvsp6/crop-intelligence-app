import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
  InputAdornment,
  IconButton,
  Divider,
  Fade,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Person,
  Lock,
  ArrowForward,
  Agriculture,
  TrendingUp,
  LocalHospital,
} from '@mui/icons-material';
import { keyframes } from '@emotion/react';
import axios from 'axios';
import { API_BASE } from '../config';
import { AuthContext } from '../context/AuthContext';

/* ── Keyframe Animations ── */
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50%      { transform: translateY(-12px); }
`;
const orbDrift1 = keyframes`
  0%   { transform: translate(0, 0) scale(1); }
  33%  { transform: translate(40px, -60px) scale(1.15); }
  66%  { transform: translate(-30px, 30px) scale(0.9); }
  100% { transform: translate(0, 0) scale(1); }
`;
const orbDrift2 = keyframes`
  0%   { transform: translate(0, 0) scale(1); }
  33%  { transform: translate(-50px, 40px) scale(0.85); }
  66%  { transform: translate(40px, -20px) scale(1.1); }
  100% { transform: translate(0, 0) scale(1); }
`;
const shimmerLine = keyframes`
  0%   { left: -30%; }
  100% { left: 130%; }
`;

/* ── Shared Input Styles ── */
const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(8px)',
    transition: 'all 0.3s ease',
    '& fieldset': {
      borderColor: 'rgba(125, 228, 154, 0.15)',
      transition: 'all 0.3s ease',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(125, 228, 154, 0.35)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#4fd191',
      borderWidth: 2,
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(125, 228, 154, 0.04)',
    },
    '& .MuiOutlinedInput-input': {
      color: '#e8f5e9',
      '&::placeholder': { color: 'rgba(255,255,255,0.4)' },
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255,255,255,0.55)',
    '&.Mui-focused': { color: '#7ddf92' },
    '&.MuiFormLabel-filled': { color: '#7ddf92' },
  },
};

/* ── Google SVG Icon ── */
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

/* ── Submit Button Styles ── */
const submitBtnSx = {
  borderRadius: 3,
  height: 54,
  fontSize: '1.05rem',
  fontWeight: 700,
  textTransform: 'none' as const,
  background: 'linear-gradient(135deg, #4fd191 0%, #2f855a 100%)',
  boxShadow: '0 8px 28px rgba(47,133,90,0.35)',
  position: 'relative' as const,
  overflow: 'hidden' as const,
  transition: 'all 0.3s cubic-bezier(.22,1,.36,1)',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    width: '30%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
    animation: `${shimmerLine} 3s ease-in-out infinite`,
  },
  '&:hover': {
    background: 'linear-gradient(135deg, #5ee0a0 0%, #38a169 100%)',
    boxShadow: '0 12px 36px rgba(47,133,90,0.45)',
    transform: 'translateY(-2px)',
  },
  '&:disabled': {
    background: 'rgba(47,133,90,0.5)',
    boxShadow: 'none',
  },
};

/* ── Google Button Styles ── */
const googleBtnSx = {
  borderRadius: 3,
  height: 54,
  fontSize: '0.95rem',
  fontWeight: 600,
  textTransform: 'none' as const,
  backgroundColor: 'rgba(255,255,255,0.06)',
  color: '#e0e0e0',
  border: '1px solid rgba(255,255,255,0.12)',
  backdropFilter: 'blur(8px)',
  transition: 'all 0.3s ease',
  display: 'flex',
  gap: 1.5,
  justifyContent: 'center',
  alignItems: 'center',
  '&:hover': {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.25)',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
  },
  '&:disabled': {
    borderColor: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.3)',
  },
};

const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const switchTab = (tab: 'login' | 'register') => { setActiveTab(tab); setError(''); setSuccess(''); };

  const handleGoogleLoginSuccess = async (tokenResponse: any) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_BASE}/api/auth/google-login`, { accessToken: tokenResponse.access_token });
      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        authContext?.login(user, token);
        setSuccess('Google login successful! Redirecting...');
        setTimeout(() => navigate(from, { replace: true }), 1500);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || error.response?.data?.error || 'Google login failed');
    } finally { setLoading(false); }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: () => setError('Google login failed. Please try again.'),
    flow: 'implicit',
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, { email: loginForm.email, password: loginForm.password });
      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        authContext?.login(user, token);
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => navigate(from, { replace: true }), 1500);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (registerForm.password !== registerForm.confirmPassword) { setError('Passwords do not match'); return; }
    if (registerForm.password.length < 6) { setError('Password must be at least 6 characters long'); return; }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/auth/register`, {
        username: registerForm.name, email: registerForm.email, password: registerForm.password, full_name: registerForm.name,
      });
      if (response.data.success) {
        setSuccess('Registration successful! Please log in.');
        switchTab('login');
        setRegisterForm({ name: '', email: '', password: '', confirmPassword: '' });
      }
    } catch (error: any) {
      setError(error.response?.data?.message || error.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  /* ── Feature pills for left panel ── */
  const highlights = [
    { icon: <Agriculture sx={{ fontSize: 20 }} />, text: '99.55% Yield Prediction Accuracy' },
    { icon: <LocalHospital sx={{ fontSize: 20 }} />, text: 'Instant AI Disease Diagnosis' },
    { icon: <TrendingUp sx={{ fontSize: 20 }} />, text: 'Live Market Intelligence' },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        position: 'fixed',
        inset: 0,
        background: '#080d0a',
      }}
    >
      {/* ═══════ LEFT — Branding Panel (hidden on mobile) ═══════ */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          width: '50%',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #0a120e 0%, #0f1a14 40%, #132a1e 100%)',
          px: { md: 6, lg: 10 },
        }}
      >
        {/* Animated orbs */}
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <Box sx={{
            position: 'absolute', width: 400, height: 400, borderRadius: '50%', top: '-8%', right: '-10%',
            background: 'radial-gradient(circle, rgba(125,228,154,0.07) 0%, transparent 70%)',
            animation: `${orbDrift1} 22s ease-in-out infinite`,
          }} />
          <Box sx={{
            position: 'absolute', width: 350, height: 350, borderRadius: '50%', bottom: '5%', left: '-8%',
            background: 'radial-gradient(circle, rgba(80,180,120,0.05) 0%, transparent 70%)',
            animation: `${orbDrift2} 26s ease-in-out infinite`,
          }} />
          {/* Grid */}
          <Box sx={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(125,228,154,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(125,228,154,0.025) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }} />
        </Box>

        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 5, animation: `${fadeInUp} 0.8s cubic-bezier(.22,1,.36,1) both` }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: 2.5,
              background: 'linear-gradient(135deg, #4fd191, #2f855a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
            }}>
              🌾
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#fff', letterSpacing: '-0.02em' }}>
              YieldWise
            </Typography>
          </Box>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              lineHeight: 1.12,
              mb: 3,
              letterSpacing: '-0.03em',
              fontSize: { md: '2.4rem', lg: '3rem' },
              color: '#fff',
              animation: `${fadeInUp} 0.8s cubic-bezier(.22,1,.36,1) 0.1s both`,
            }}
          >
            Smart Farming{' '}
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(135deg, #a3f0bb, #4fd191)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Starts Here
            </Box>
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: '1.1rem',
              lineHeight: 1.7,
              mb: 5,
              animation: `${fadeInUp} 0.8s cubic-bezier(.22,1,.36,1) 0.2s both`,
            }}
          >
            Intelligent crop insights, disease detection, and market analysis — built for Indian farmers.
          </Typography>

          {/* Feature pills */}
          <Stack spacing={2} sx={{ animation: `${fadeInUp} 0.8s cubic-bezier(.22,1,.36,1) 0.35s both` }}>
            {highlights.map((h, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 2,
                  px: 2.5, py: 1.5, borderRadius: 3,
                  background: 'rgba(125,228,154,0.05)',
                  border: '1px solid rgba(125,228,154,0.1)',
                  color: '#d4f5de',
                  transition: 'all 0.3s ease',
                  animation: `${float} ${5 + i}s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                  '&:hover': {
                    background: 'rgba(125,228,154,0.1)',
                    transform: 'translateX(6px)',
                    borderColor: 'rgba(125,228,154,0.25)',
                  },
                }}
              >
                <Box sx={{ color: '#7ddf92' }}>{h.icon}</Box>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 500 }}>{h.text}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>

      {/* ═══════ RIGHT — Form Panel ═══════ */}
      <Box
        sx={{
          width: { xs: '100%', md: '50%' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #0c1410 0%, #101d16 50%, #0e1812 100%)',
          px: { xs: 2, sm: 4 },
        }}
      >
        {/* Subtle orb on right side */}
        <Box sx={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%', top: '10%', right: '-15%',
          background: 'radial-gradient(circle, rgba(125,228,154,0.04) 0%, transparent 70%)',
          animation: `${orbDrift2} 20s ease-in-out infinite`,
          pointerEvents: 'none',
        }} />

        <Box
          sx={{
            width: '100%',
            maxWidth: 440,
            position: 'relative',
            zIndex: 1,
            animation: `${fadeInUp} 0.7s cubic-bezier(.22,1,.36,1) both`,
          }}
        >
          {/* Mobile-only logo */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              mb: 4,
            }}
          >
            <Box sx={{
              width: 40, height: 40, borderRadius: 2,
              background: 'linear-gradient(135deg, #4fd191, #2f855a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
            }}>
              🌾
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: '#fff' }}>YieldWise</Typography>
          </Box>

          {/* Heading */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: '#fff',
              mb: 1,
              letterSpacing: '-0.02em',
              fontSize: { xs: '1.6rem', sm: '1.8rem' },
            }}
          >
            {activeTab === 'login' ? 'Welcome back' : 'Create account'}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.45)', mb: 4, fontSize: '0.95rem' }}>
            {activeTab === 'login'
              ? 'Sign in to access your farming dashboard'
              : 'Start your smart farming journey today'}
          </Typography>

          {/* Tab Switcher */}
          <Box
            sx={{
              display: 'flex',
              mb: 4,
              p: 0.5,
              borderRadius: 3,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {(['login', 'register'] as const).map((tab) => (
              <Button
                key={tab}
                onClick={() => switchTab(tab)}
                sx={{
                  flex: 1,
                  borderRadius: 2.5,
                  py: 1.2,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease',
                  color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.4)',
                  background: activeTab === tab
                    ? 'linear-gradient(135deg, rgba(79,209,145,0.2) 0%, rgba(47,133,90,0.15) 100%)'
                    : 'transparent',
                  boxShadow: activeTab === tab ? '0 2px 12px rgba(47,133,90,0.2)' : 'none',
                  '&:hover': {
                    color: '#fff',
                    background: activeTab === tab
                      ? 'linear-gradient(135deg, rgba(79,209,145,0.25), rgba(47,133,90,0.2))'
                      : 'rgba(255,255,255,0.04)',
                  },
                }}
              >
                {tab === 'login' ? 'Sign In' : 'Sign Up'}
              </Button>
            ))}
          </Box>

          {/* Alerts */}
          {error && (
            <Fade in><Alert severity="error" sx={{ mb: 3, borderRadius: 2, '& .MuiAlert-message': { color: '#fca5a5' } }} onClose={() => setError('')}>{error}</Alert></Fade>
          )}
          {success && (
            <Fade in><Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert></Fade>
          )}

          {/* ── Google Sign-in (always shown first) ── */}
          <Button
            onClick={() => googleLogin()}
            fullWidth
            variant="outlined"
            size="large"
            disabled={loading}
            sx={googleBtnSx}
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          <Divider sx={{ my: 3, '&::before, &::after': { borderColor: 'rgba(255,255,255,0.08)' } }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', px: 2 }}>
              OR
            </Typography>
          </Divider>

          {/* ── Login Form ── */}
          {activeTab === 'login' && (
            <Fade in timeout={350}>
              <form onSubmit={handleLoginSubmit}>
                <Stack spacing={2.5}>
                  <TextField
                    fullWidth label="Email Address" type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required variant="outlined"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Email sx={{ color: '#4fd191', fontSize: 20 }} /></InputAdornment>,
                    }}
                    sx={textFieldSx}
                  />
                  <TextField
                    fullWidth label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required variant="outlined"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#4fd191', fontSize: 20 }} /></InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'rgba(255,255,255,0.35)' }}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={textFieldSx}
                  />
                  <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} endIcon={!loading && <ArrowForward />} sx={submitBtnSx}>
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                  </Button>
                </Stack>
              </form>
            </Fade>
          )}

          {/* ── Register Form ── */}
          {activeTab === 'register' && (
            <Fade in timeout={350}>
              <form onSubmit={handleRegisterSubmit}>
                <Stack spacing={2.5}>
                  <TextField
                    fullWidth label="Full Name"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    required variant="outlined"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Person sx={{ color: '#4fd191', fontSize: 20 }} /></InputAdornment>,
                    }}
                    sx={textFieldSx}
                  />
                  <TextField
                    fullWidth label="Email Address" type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required variant="outlined"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Email sx={{ color: '#4fd191', fontSize: 20 }} /></InputAdornment>,
                    }}
                    sx={textFieldSx}
                  />
                  <TextField
                    fullWidth label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required variant="outlined"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#4fd191', fontSize: 20 }} /></InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'rgba(255,255,255,0.35)' }}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={textFieldSx}
                  />
                  <TextField
                    fullWidth label="Confirm Password"
                    type={showPassword ? 'text' : 'password'}
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    required variant="outlined"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#4fd191', fontSize: 20 }} /></InputAdornment>,
                    }}
                    sx={textFieldSx}
                  />
                  <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} endIcon={!loading && <ArrowForward />} sx={submitBtnSx}>
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                  </Button>
                </Stack>
              </form>
            </Fade>
          )}

          {/* Footer text */}
          <Typography sx={{ textAlign: 'center', mt: 4, color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem' }}>
            {activeTab === 'login' ? (
              <>Don't have an account?{' '}
                <Box component="span" onClick={() => switchTab('register')} sx={{ color: '#4fd191', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
                  Sign up free
                </Box>
              </>
            ) : (
              <>Already have an account?{' '}
                <Box component="span" onClick={() => switchTab('login')} sx={{ color: '#4fd191', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
                  Sign in
                </Box>
              </>
            )}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default AuthPage;