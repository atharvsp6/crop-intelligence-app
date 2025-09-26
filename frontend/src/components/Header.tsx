import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  Box,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4,
  Brightness7,
  Agriculture,
  Nature,
  Notifications,
  AccountCircle,
  Logout,
  Settings,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onThemeToggle: () => void;
  darkMode: boolean;
  onSidebarToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onThemeToggle,
  darkMode,
  onSidebarToggle,
}) => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };
  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        background: darkMode 
          ? 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)'
          : 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Toolbar sx={{ py: 1 }}>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onSidebarToggle}
          sx={{ 
            mr: 2,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }
          }}
        >
          <MenuIcon />
        </IconButton>
        
        {/* Logo and Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.15)',
              mr: 2,
            }}
          >
            <Agriculture sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 700,
                fontSize: '1.25rem',
                lineHeight: 1.2,
              }}
            >
              AgroSmart
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                opacity: 0.8,
                fontSize: '0.75rem',
                display: 'block',
                lineHeight: 1,
              }}
            >
              Intelligent Agriculture Platform
            </Typography>
          </Box>
        </Box>

        {/* Status Chip */}
        <Chip
          icon={<Nature sx={{ fontSize: 16 }} />}
          label="Growing Season"
          size="small"
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            color: 'white',
            '& .MuiChip-icon': {
              color: 'white',
            },
            mr: 2,
          }}
        />
        
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Right side controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            color="inherit"
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <Notifications />
          </IconButton>
          
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={onThemeToggle}
                icon={<Brightness7 sx={{ fontSize: 16 }} />}
                checkedIcon={<Brightness4 sx={{ fontSize: 16 }} />}
                sx={{
                  '& .MuiSwitch-switchBase': {
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                }}
              />
            }
            label=""
          />
          
          <Avatar
            onClick={handleClick}
            sx={{
              width: 32,
              height: 32,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              fontSize: '0.875rem',
              ml: 1,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
              }
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </Avatar>
          
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            onClick={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            sx={{
              '& .MuiPaper-root': {
                borderRadius: 2,
                minWidth: 180,
                boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.15)',
              }
            }}
          >
            <MenuItem>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={user?.name || 'User'} />
            </MenuItem>
            <MenuItem>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;