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
  const dark = theme.palette.mode === 'dark';

  const { t } = useTranslation();

  const menuItems = [
    { key: 'dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { key: 'cropPredictor', icon: <Agriculture />, path: '/dashboard/crop-predictor' },
    { key: 'diseaseDetector', icon: <LocalHospital />, path: '/dashboard/disease-detector' },
    { key: 'financialDashboard', icon: <TrendingUp />, path: '/dashboard/financial-dashboard' },
    { key: 'marketIntelligence', icon: <ShowChart />, path: '/dashboard/market-intelligence' },
    { key: 'mandiData', icon: <Storefront />, path: '/dashboard/mandi-data' },
    { key: 'communityForum', icon: <Forum />, path: '/dashboard/community-forum' },
    { key: 'chatbot', icon: <Chat />, path: '/dashboard/chatbot' },
    { key: 'multilingualChat', icon: <Translate />, path: '/dashboard/multilingual-chatbot' },
    { key: 'smartAdvisor', icon: <AutoAwesome />, path: '/dashboard/smart-advisor' },
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
          padding: open ? '24px 16px 24px' : '24px 8px 24px',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
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
            fontSize: '0.7rem',
          }}
        >
          {t('sidebar.navigation')}
        </Typography>
        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
          {menuItems.map((item) => {
            const selected = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                selected={selected}
                sx={{
                  borderRadius: 2.5,
                  px: 1.5,
                  py: 1,
                  alignItems: 'center',
                  gap: 1,
                  backgroundColor: selected
                    ? (dark ? 'rgba(125, 228, 154, 0.1)' : 'rgba(47, 133, 90, 0.08)')
                    : 'transparent',
                  border: selected
                    ? `1px solid ${dark ? 'rgba(125, 228, 154, 0.25)' : 'rgba(47, 133, 90, 0.15)'}`
                    : '1px solid transparent',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: dark ? 'rgba(125, 228, 154, 0.08)' : 'rgba(47, 133, 90, 0.06)',
                    borderColor: dark ? 'rgba(125, 228, 154, 0.15)' : 'rgba(47, 133, 90, 0.1)',
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 34,
                    color: selected ? 'primary.main' : 'text.secondary',
                    '& svg': { fontSize: 20 },
                    transition: 'color 0.2s ease',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={t(`sidebar.items.${item.key}`)}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: selected ? 600 : 450,
                    letterSpacing: '0.01em',
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>


    </Drawer>
  );
};

export default Sidebar;