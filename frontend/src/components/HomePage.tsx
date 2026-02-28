import React, { useEffect, useRef, useState } from 'react';
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
  Chip,
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
  ArrowForward,
  AutoAwesome,
  Speed,
  Security,
  CloudDone,
} from '@mui/icons-material';
import { keyframes } from '@emotion/react';
import { useNavigate } from 'react-router-dom';

/* ── Keyframe Animations ───────────────────────── */
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50%      { transform: translateY(-20px) rotate(3deg); }
`;
const float2 = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50%      { transform: translateY(-15px) rotate(-2deg); }
`;
const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(125, 228, 154, 0.4); }
  50%      { box-shadow: 0 0 0 20px rgba(125, 228, 154, 0); }
`;
const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
`;
const gradientShift = keyframes`
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;
const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.8); }
  to   { opacity: 1; transform: scale(1); }
`;
const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-60px); }
  to   { opacity: 1; transform: translateX(0); }
`;
const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(60px); }
  to   { opacity: 1; transform: translateX(0); }
`;
const orbMove1 = keyframes`
  0%   { transform: translate(0, 0) scale(1); }
  33%  { transform: translate(30px, -50px) scale(1.1); }
  66%  { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0, 0) scale(1); }
`;
const orbMove2 = keyframes`
  0%   { transform: translate(0, 0) scale(1); }
  33%  { transform: translate(-40px, 30px) scale(0.9); }
  66%  { transform: translate(30px, -30px) scale(1.1); }
  100% { transform: translate(0, 0) scale(1); }
`;

/* ── Intersection Observer Hook ──────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ── Animated Counter ─────────────────────────── */
const AnimatedCounter: React.FC<{ value: string; duration?: number }> = ({ value, duration = 2000 }) => {
  const [display, setDisplay] = useState('0');
  const { ref, visible } = useInView(0.5);

  useEffect(() => {
    if (!visible) return;
    const numeric = parseFloat(value.replace(/[^0-9.]/g, ''));
    const suffix = value.replace(/[0-9.]/g, '');
    if (isNaN(numeric)) { setDisplay(value); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = numeric * eased;
      setDisplay(
        (numeric % 1 !== 0 ? current.toFixed(2) : Math.floor(current).toString()) + suffix,
      );
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [visible, value, duration]);

  return <span ref={ref}>{display}</span>;
};

/* ── Feature Card ─────────────────────────────── */
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
  onGetStarted: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay, onGetStarted }) => {
  const theme = useTheme();
  const { ref, visible } = useInView();

  return (
    <Card
      ref={ref}
      sx={{
        height: '100%',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(160deg, rgba(22,29,26,0.85) 0%, rgba(31,41,34,0.92) 100%)'
          : 'linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(240,250,244,0.9) 100%)',
        backdropFilter: 'blur(24px)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(125,228,154,0.08)' : 'rgba(47,133,90,0.08)'}`,
        borderRadius: 4,
        overflow: 'visible',
        cursor: 'pointer',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.6s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.6s cubic-bezier(.22,1,.36,1) ${delay}ms, box-shadow 0.35s ease, border 0.35s ease`,
        '&:hover': {
          transform: 'translateY(-12px) scale(1.02)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 30px 60px -12px rgba(0,0,0,0.5), 0 0 36px -8px rgba(125,228,154,0.12)'
            : '0 30px 60px -12px rgba(47,133,90,0.18), 0 0 36px -8px rgba(47,133,90,0.08)',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(125,228,154,0.25)' : 'rgba(47,133,90,0.25)'}`,
          '& .card-icon': {
            transform: 'scale(1.15) rotate(-5deg)',
            boxShadow: '0 12px 28px rgba(125,228,154,0.35)',
          },
          '& .card-arrow': { transform: 'translateX(4px)', opacity: 1 },
        },
      }}
      onClick={onGetStarted}
    >
      <CardContent sx={{ p: { xs: 3, md: 4 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box
          className="card-icon"
          sx={{
            width: 64,
            height: 64,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            background: 'linear-gradient(135deg, #4fd191 0%, #2f855a 100%)',
            color: '#fff',
            fontSize: '1.6rem',
            transition: 'transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s ease',
            boxShadow: '0 8px 20px rgba(125,228,154,0.2)',
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 700, mb: 1.5, letterSpacing: '-0.01em' }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, lineHeight: 1.7, opacity: 0.85 }}>
          {description}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 3, color: 'primary.main', fontWeight: 600, fontSize: '0.875rem' }}>
          Explore
          <ArrowForward
            className="card-arrow"
            sx={{ ml: 0.5, fontSize: '1rem', opacity: 0.5, transition: 'transform 0.3s ease, opacity 0.3s ease' }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

/* ── How-It-Works Step ─────────────────────────── */
interface StepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  delay: number;
}
const StepCard: React.FC<StepProps> = ({ number, title, description, icon, delay }) => {
  const theme = useTheme();
  const { ref, visible } = useInView();
  return (
    <Box
      ref={ref}
      sx={{
        textAlign: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: `all 0.6s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: 80,
          height: 80,
          mx: 'auto',
          mb: 3,
          borderRadius: '50%',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(125,228,154,0.12) 0%, rgba(47,133,90,0.08) 100%)'
            : 'linear-gradient(135deg, rgba(79,209,145,0.15) 0%, rgba(56,161,105,0.08) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(125,228,154,0.2)' : 'rgba(47,133,90,0.15)'}`,
          color: 'primary.main',
          fontSize: '1.8rem',
        }}
      >
        {icon}
        <Box
          sx={{
            position: 'absolute',
            top: -6,
            right: -6,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4fd191, #2f855a)',
            color: '#fff',
            fontSize: '0.75rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {number}
        </Box>
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 260, mx: 'auto', lineHeight: 1.7 }}>
        {description}
      </Typography>
    </Box>
  );
};

/* ═══════════════════════════════════════════════ */
/*  HomePage Component                             */
/* ═══════════════════════════════════════════════ */
const HomePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dark = theme.palette.mode === 'dark';

  const handleGetStarted = () => navigate('/auth');

  const features = [
    { icon: <Agriculture />, title: 'Yield Prediction', description: 'Crop yield forecasting with 99.55% accuracy using Random Forest ML models trained on Indian agricultural data.' },
    { icon: <LocalHospital />, title: 'Disease Detection', description: 'Upload a leaf photo and get instant diagnosis with treatment plans using advanced vision analysis.' },
    { icon: <TrendingUp />, title: 'Market Intelligence', description: 'Live commodity prices, mandi rates from Data.gov.in, and intelligent trend analysis for smarter selling decisions.' },
    { icon: <Lightbulb />, title: 'Smart Advisor', description: 'Instant crop recommendations, pest identification, and personalized farming advice delivered in seconds.' },
    { icon: <People />, title: 'Community Forum', description: 'Ask questions, share knowledge, and get expert answers from the farming community.' },
    { icon: <AccountBalance />, title: 'Financial Tools', description: 'ROI calculators, production cost breakdowns, and historical price analysis to maximize your farm profits.' },
  ];

  const stats = [
    { value: '99.55%', label: 'ML Accuracy' },
    { value: '50+', label: 'API Endpoints' },
    { value: '6', label: 'Indian Languages' },
    { value: '53+', label: 'Crop Varieties' },
  ];

  const steps = [
    { icon: <CloudDone />, title: 'Sign Up Free', description: 'Create your account in seconds with email or one-click Google sign-in.' },
    { icon: <Agriculture />, title: 'Input Your Data', description: 'Enter your crop, region, and season — or upload a leaf photo for diagnosis.' },
    { icon: <AutoAwesome />, title: 'Get AI Insights', description: 'Receive yield predictions, treatment plans, market advice & financial analysis instantly.' },
  ];

  /* ── hero section InView ── */
  const heroSec = useInView(0.1);
  const featureSec = useInView(0.05);
  const stepsSec = useInView(0.1);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        background: dark
          ? 'linear-gradient(160deg, #080d0a 0%, #0f1a14 40%, #111e17 100%)'
          : 'linear-gradient(160deg, #f7faf8 0%, #eaf5ee 50%, #dff0e6 100%)',
        position: 'relative',
        overflow: 'hidden',
        m: 0,
        p: 0,
      }}
    >
      {/* ── Animated Background Orbs ── */}
      <Box sx={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <Box
          sx={{
            position: 'absolute',
            width: { xs: 300, md: 500 },
            height: { xs: 300, md: 500 },
            borderRadius: '50%',
            top: '-10%',
            left: '-5%',
            background: dark
              ? 'radial-gradient(circle, rgba(125,228,154,0.08) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(79,209,145,0.12) 0%, transparent 70%)',
            animation: `${orbMove1} 20s ease-in-out infinite`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: { xs: 250, md: 450 },
            height: { xs: 250, md: 450 },
            borderRadius: '50%',
            bottom: '5%',
            right: '-8%',
            background: dark
              ? 'radial-gradient(circle, rgba(80,155,115,0.06) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(56,161,105,0.1) 0%, transparent 70%)',
            animation: `${orbMove2} 25s ease-in-out infinite`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: { xs: 180, md: 320 },
            height: { xs: 180, md: 320 },
            borderRadius: '50%',
            top: '50%',
            left: '60%',
            background: dark
              ? 'radial-gradient(circle, rgba(100,200,140,0.04) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(70,180,120,0.06) 0%, transparent 70%)',
            animation: `${orbMove1} 18s ease-in-out infinite reverse`,
          }}
        />
        {/* Grid pattern overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: dark
              ? 'linear-gradient(rgba(125,228,154,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(125,228,154,0.02) 1px, transparent 1px)'
              : 'linear-gradient(rgba(47,133,90,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(47,133,90,0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </Box>

      {/* ════════ HEADER ════════ */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: dark ? 'rgba(8,13,10,0.7)' : 'rgba(247,250,248,0.7)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${dark ? 'rgba(125,228,154,0.08)' : 'rgba(47,133,90,0.08)'}`,
          width: '100%',
          zIndex: 10,
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 4 }, py: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #4fd191, #2f855a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
              }}
            >
              🌾
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
              YieldWise
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button color="inherit" startIcon={<Language />} sx={{ textTransform: 'none', fontWeight: 500, display: { xs: 'none', sm: 'flex' } }}>
              English
            </Button>
            <Button
              variant="contained"
              startIcon={<Login />}
              onClick={handleGetStarted}
              sx={{
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                background: 'linear-gradient(135deg, #4fd191 0%, #2f855a 100%)',
                boxShadow: '0 4px 14px rgba(47,133,90,0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5ee0a0 0%, #38a169 100%)',
                  boxShadow: '0 6px 20px rgba(47,133,90,0.4)',
                },
              }}
            >
              Login
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ════════ HERO ════════ */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pt: { xs: 8, md: 14 }, px: { xs: 2, md: 3 } }}>
        <Box
          ref={heroSec.ref}
          textAlign="center"
          sx={{ mb: { xs: 10, md: 16 } }}
        >
          {/* Heading */}
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '2.6rem', sm: '3.5rem', md: '4.2rem', lg: '5rem' },
              fontWeight: 800,
              mb: 3,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              animation: `${fadeInUp} 0.8s cubic-bezier(.22,1,.36,1) 0.15s both`,
            }}
          >
            <Box
              component="span"
              sx={{
                background: dark
                  ? 'linear-gradient(135deg, #a3f0bb 0%, #6de09a 35%, #3dba72 70%, #2a9d5e 100%)'
                  : 'linear-gradient(135deg, #1a6b3c 0%, #2f855a 35%, #38a169 70%, #48bb78 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundSize: '200% auto',
                animation: `${gradientShift} 6s ease infinite`,
              }}
            >
              Smart Data-Driven
            </Box>
            <br />
            <Box component="span" sx={{ color: 'text.primary' }}>
              Farming for{' '}
            </Box>
            <Box
              component="span"
              sx={{
                position: 'relative',
                color: 'primary.main',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  bottom: '0.05em',
                  width: '100%',
                  height: '0.12em',
                  background: 'linear-gradient(90deg, rgba(125,228,154,0.5), rgba(47,133,90,0.3))',
                  borderRadius: 2,
                },
              }}
            >
              Better Yields
            </Box>
          </Typography>

          {/* Subhead */}
          <Typography
            variant="h5"
            component="p"
            color="text.secondary"
            sx={{
              mb: 6,
              maxWidth: 720,
              mx: 'auto',
              lineHeight: 1.7,
              fontSize: { xs: '1.05rem', md: '1.25rem' },
              fontWeight: 400,
              animation: `${fadeInUp} 0.8s cubic-bezier(.22,1,.36,1) 0.3s both`,
            }}
          >
            Transform Indian agriculture with AI crop predictions, instant disease diagnosis,
            live market intelligence, and multilingual expert guidance — all in one platform.
          </Typography>

          {/* Stats Row */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: { xs: 3, md: 6 },
              mb: 6,
              flexWrap: 'wrap',
              animation: `${fadeInUp} 0.8s cubic-bezier(.22,1,.36,1) 0.45s both`,
            }}
          >
            {stats.map((stat, i) => (
              <Box
                key={i}
                sx={{
                  textAlign: 'center',
                  px: 2,
                  py: 1.5,
                  borderRadius: 3,
                  background: dark ? 'rgba(125,228,154,0.04)' : 'rgba(47,133,90,0.04)',
                  border: `1px solid ${dark ? 'rgba(125,228,154,0.08)' : 'rgba(47,133,90,0.06)'}`,
                  minWidth: 100,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: dark ? 'rgba(125,228,154,0.08)' : 'rgba(47,133,90,0.08)',
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: 'primary.main',
                    mb: 0.5,
                    fontSize: { xs: '1.6rem', md: '2rem' },
                    fontFamily: 'monospace',
                  }}
                >
                  <AnimatedCounter value={stat.value} />
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* CTA Buttons */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
              animation: `${fadeInUp} 0.8s cubic-bezier(.22,1,.36,1) 0.6s both`,
            }}
          >
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={handleGetStarted}
              sx={{
                borderRadius: 3,
                px: 5,
                py: 1.8,
                fontSize: '1.1rem',
                fontWeight: 700,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #4fd191 0%, #2f855a 100%)',
                boxShadow: '0 8px 30px rgba(47,133,90,0.35)',
                animation: `${pulse} 2.5s ease-in-out infinite`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5ee0a0 0%, #38a169 100%)',
                  boxShadow: '0 12px 40px rgba(47,133,90,0.45)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Get Started Free
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}
              sx={{
                borderRadius: 3,
                px: 5,
                py: 1.8,
                fontSize: '1.1rem',
                fontWeight: 700,
                textTransform: 'none',
                borderWidth: 2,
                borderColor: dark ? 'rgba(125,228,154,0.3)' : 'rgba(47,133,90,0.3)',
                color: 'primary.main',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderWidth: 2,
                  borderColor: 'primary.main',
                  background: dark ? 'rgba(125,228,154,0.05)' : 'rgba(47,133,90,0.05)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Learn More
            </Button>
          </Box>

          {/* Floating decorative emoji */}
          <Box sx={{ position: 'relative', mt: { xs: 4, md: 6 }, height: { xs: 60, md: 80 } }}>
            {['🌾', '🌱', '🚜', '📊', '🤖'].map((emoji, i) => (
              <Box
                key={i}
                sx={{
                  position: 'absolute',
                  left: `${15 + i * 17}%`,
                  top: `${i % 2 === 0 ? 0 : 20}%`,
                  fontSize: { xs: '1.5rem', md: '2rem' },
                  opacity: 0.5,
                  animation: `${i % 2 === 0 ? float : float2} ${4 + i * 0.8}s ease-in-out infinite`,
                  animationDelay: `${i * 0.4}s`,
                }}
              >
                {emoji}
              </Box>
            ))}
          </Box>
        </Box>

        {/* ════════ FEATURES ════════ */}
        <Box id="features-section" ref={featureSec.ref} sx={{ mb: { xs: 10, md: 16 } }}>
          <Box textAlign="center" sx={{ mb: { xs: 5, md: 8 } }}>
            <Chip
              label="FEATURES"
              size="small"
              sx={{
                mb: 2,
                fontWeight: 700,
                letterSpacing: '0.12em',
                fontSize: '0.7rem',
                background: dark ? 'rgba(125,228,154,0.08)' : 'rgba(47,133,90,0.06)',
                color: 'primary.main',
              }}
            />
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.02em',
                mb: 2,
                fontSize: { xs: '2rem', md: '2.8rem' },
                opacity: featureSec.visible ? 1 : 0,
                transform: featureSec.visible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.7s cubic-bezier(.22,1,.36,1)',
              }}
            >
              Everything You Need to Farm Smarter
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 600, mx: 'auto', lineHeight: 1.7 }}
            >
              Six powerful modules working together to give you a complete farming intelligence platform.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: { xs: 3, md: 4 },
              width: '100%',
            }}
          >
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} delay={i * 120} onGetStarted={handleGetStarted} />
            ))}
          </Box>
        </Box>

        {/* ════════ HOW IT WORKS ════════ */}
        <Box ref={stepsSec.ref} sx={{ mb: { xs: 10, md: 16 } }}>
          <Box textAlign="center" sx={{ mb: { xs: 5, md: 8 } }}>
            <Chip
              label="HOW IT WORKS"
              size="small"
              sx={{
                mb: 2,
                fontWeight: 700,
                letterSpacing: '0.12em',
                fontSize: '0.7rem',
                background: dark ? 'rgba(125,228,154,0.08)' : 'rgba(47,133,90,0.06)',
                color: 'primary.main',
              }}
            />
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.02em',
                mb: 2,
                fontSize: { xs: '2rem', md: '2.8rem' },
                opacity: stepsSec.visible ? 1 : 0,
                transform: stepsSec.visible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.7s cubic-bezier(.22,1,.36,1)',
              }}
            >
              Get Started in 3 Simple Steps
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: { xs: 5, md: 6 },
              maxWidth: 900,
              mx: 'auto',
            }}
          >
            {steps.map((s, i) => (
              <StepCard key={i} number={i + 1} {...s} delay={i * 150} />
            ))}
          </Box>
        </Box>

        {/* ════════ BOTTOM CTA ════════ */}
        <Box
          sx={{
            textAlign: 'center',
            py: { xs: 6, md: 10 },
            mb: { xs: 4, md: 8 },
            borderRadius: 5,
            background: dark
              ? 'linear-gradient(160deg, rgba(125,228,154,0.05) 0%, rgba(47,133,90,0.03) 100%)'
              : 'linear-gradient(160deg, rgba(79,209,145,0.08) 0%, rgba(56,161,105,0.04) 100%)',
            border: `1px solid ${dark ? 'rgba(125,228,154,0.08)' : 'rgba(47,133,90,0.06)'}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: '50%',
              top: '-60px',
              right: '-40px',
              background: 'radial-gradient(circle, rgba(125,228,154,0.08) 0%, transparent 70%)',
              animation: `${float} 8s ease-in-out infinite`,
            }}
          />
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.02em', fontSize: { xs: '1.6rem', md: '2.2rem' } }}
          >
            Ready to Transform Your Farming?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
            Join thousands of Indian farmers using AI to increase yields, reduce losses, and make data-driven decisions.
          </Typography>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            onClick={handleGetStarted}
            sx={{
              borderRadius: 3,
              px: 5,
              py: 1.8,
              fontSize: '1.1rem',
              fontWeight: 700,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #4fd191 0%, #2f855a 100%)',
              boxShadow: '0 8px 30px rgba(47,133,90,0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5ee0a0 0%, #38a169 100%)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            Start Free Now
          </Button>
        </Box>

        {/* ════════ FOOTER ════════ */}
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            borderTop: `1px solid ${dark ? 'rgba(125,228,154,0.06)' : 'rgba(47,133,90,0.06)'}`,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.7 }}>
            © {new Date().getFullYear()} YieldWise. Intelligent Agriculture Platform for Better Yields.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;