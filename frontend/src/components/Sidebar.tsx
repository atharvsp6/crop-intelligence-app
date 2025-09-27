import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Agriculture,
  LocalHospital,
  TrendingUp,
  Forum,
  Chat,
} from '@mui/icons-material';

interface SidebarProps {
  open: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Crop Predictor', icon: <Agriculture />, path: '/crop-predictor' },
    { text: 'Disease Detector', icon: <LocalHospital />, path: '/disease-detector' },
    { text: 'Financial Dashboard', icon: <TrendingUp />, path: '/financial-dashboard' },
    { text: 'Community Forum', icon: <Forum />, path: '/community-forum' },
    { text: 'AI Chatbot', icon: <Chat />, path: '/chatbot' },
    { text: 'Multilingual Chat', icon: <Chat />, path: '/multilingual-chatbot' },
  ];

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: open ? 240 : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          marginTop: '64px', // Height of AppBar
        },
      }}
    >
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
    </Drawer>
  );
};

export default Sidebar;