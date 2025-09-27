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
} from '@mui/icons-material';

interface SidebarProps {
  open: boolean;
  width?: number;
  collapsedWidth?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ open, width = 272 }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Crop Predictor', icon: <Agriculture />, path: '/dashboard/crop-predictor', badge: 'ML' },
    { text: 'Disease Detector', icon: <LocalHospital />, path: '/dashboard/disease-detector', badge: 'AI' },
    { text: 'Financial Dashboard', icon: <TrendingUp />, path: '/dashboard/financial-dashboard', badge: 'ROI' },
    { text: 'Market Intelligence', icon: <ShowChart />, path: '/dashboard/market-intelligence', badge: 'Live' },
    { text: 'Community Forum', icon: <Forum />, path: '/dashboard/community-forum', badge: 'Social' },
    { text: 'AI Chatbot', icon: <Chat />, path: '/dashboard/chatbot', badge: 'Beta' },
    { text: 'Multilingual Chat', icon: <Translate />, path: '/dashboard/multilingual-chatbot' },
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
          navigation
        </Typography>
        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {menuItems.map((item) => {
            const selected = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.text}
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
                  primary={item.text}
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
                Smart Farming Tips
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Stay ahead with weather alerts & market signals
              </Typography>
            </Box>
          </Box>
          <Chip
            label="View today's insights"
            size="small"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'text.primary',
              fontWeight: 600,
            }}
          />
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;