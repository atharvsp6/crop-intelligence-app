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
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  open: boolean;
  width?: number;
  collapsedWidth?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ open, width = 272 }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
  ];

  const collapsedWidth = 64;
  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: { xs: 0, md: open ? `${width}px` : `${collapsedWidth}px` },
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: { xs: 0, md: open ? `${width}px` : `${collapsedWidth}px` },
          boxSizing: 'border-box',
          marginTop: '72px',
          padding: { xs: 0, md: open ? '28px 18px 32px' : '28px 8px 32px' },
          border: 'none',
          display: { xs: 'none', md: 'flex' },
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
                onClick={() => navigate(item.path)}
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