import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Agriculture,
  LocalHospital,
  TrendingUp,
  Forum,
  Chat,
  Translate,
  Insights,
  ShowChart,
  Storefront,
  AutoAwesome,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  open: boolean;
  width?: number;
  collapsedWidth?: number;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, width = 272, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { t } = useTranslation();

  const menuItems = [
    { key: 'dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { key: 'cropPredictor', icon: <Agriculture />, path: '/dashboard/crop-predictor', badge: 'ML' },
    { key: 'diseaseDetector', icon: <LocalHospital />, path: '/dashboard/disease-detector', badge: 'AI' },
    { key: 'financialDashboard', icon: <TrendingUp />, path: '/dashboard/financial-dashboard', badge: 'ROI' },
    { key: 'marketIntelligence', icon: <ShowChart />, path: '/dashboard/market-intelligence', badge: 'Live' },
    { key: 'mandiData', icon: <Storefront />, path: '/dashboard/mandi-data', badge: 'Gov' },
    { key: 'communityForum', icon: <Forum />, path: '/dashboard/community-forum', badge: 'Social' },
    { key: 'chatbot', icon: <Chat />, path: '/dashboard/chatbot', badge: 'Beta' },
    { key: 'multilingualChat', icon: <Translate />, path: '/dashboard/multilingual-chatbot' },
    { key: 'smartAdvisor', icon: <AutoAwesome />, path: '/dashboard/smart-advisor', badge: 'AI' },
  ];

  const collapsedWidth = 64;

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: isMobile ? 0 : (open ? `${width}px` : `${collapsedWidth}px`),
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isMobile ? `${width}px` : (open ? `${width}px` : `${collapsedWidth}px`),
          boxSizing: 'border-box',
          marginTop: isMobile ? 0 : '72px',
          padding: open ? '28px 18px 32px' : '28px 8px 32px',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
          overflowX: 'hidden',
          transition: 'width 0.3s ease, padding 0.3s ease',
        },
      }}
    >
      <Box>
        <Typography
          variant="overline"
          sx={{
            color: 'text.secondary',
            letterSpacing: '0.08em',
            fontWeight: 600,
            mb: 1,
            display: 'block',
          }}
        >
          {t('sidebar.navigation')}
        </Typography>
        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {menuItems.map((item) => {
            const selected = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                selected={selected}
                sx={{
                  borderRadius: 2,
                  px: 1.5,
                  py: 1.2,
                  alignItems: 'center',
                  gap: 1,
                  backgroundColor: selected ? 'rgba(125, 228, 154, 0.12)' : 'transparent',
                  border: selected ? '1px solid rgba(125, 228, 154, 0.35)' : '1px solid transparent',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(125, 228, 154, 0.16)',
                    borderColor: 'rgba(125, 228, 154, 0.4)',
                    transform: 'translateX(6px)',
                  },
                  '& .MuiTypography-root': {
                    fontWeight: selected ? 600 : 500,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: selected ? 'primary.main' : 'text.secondary',
                    '& svg': { fontSize: 22 },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={t(`sidebar.items.${item.key}`)}
                  primaryTypographyProps={{
                    fontSize: '0.95rem',
                    letterSpacing: '0.01em',
                  }}
                />
                {item.badge && (
                  <Chip
                    label={item.badge}
                    size="small"
                    color={item.badge === 'Beta' ? 'secondary' : 'primary'}
                    sx={{
                      height: 22,
                      borderRadius: '999px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                    }}
                  />
                )}
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      <Box sx={{ mt: 'auto' }}>
        <Box
          sx={{
            p: 2.2,
            borderRadius: 3,
            background: 'linear-gradient(140deg, rgba(124, 219, 138, 0.18) 0%, rgba(45, 85, 63, 0.25) 100%)',
            border: '1px solid rgba(124, 219, 138, 0.35)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '14px',
                backgroundColor: 'rgba(124, 219, 138, 0.25)',
                display: 'grid',
                placeItems: 'center',
                color: 'primary.main',
              }}
            >
              <Insights fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {t('sidebar.tips.title')}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('sidebar.tips.subtitle')}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={t('sidebar.tips.cta')}
            size="small"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'text.primary',
              fontWeight: 600,
              marginBottom:10
            }}
          />
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;