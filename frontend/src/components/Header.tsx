import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Badge,
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
  AutoAwesome,
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
        backdropFilter: 'blur(16px)',
        boxShadow: 'none',
      }}
    >
      <Toolbar
        sx={{
          minHeight: 72,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <IconButton
          edge="start"
          aria-label="Toggle navigation"
          onClick={onSidebarToggle}
          sx={{
            width: 46,
            height: 46,
            borderRadius: 14,
            border: '1px solid rgba(125, 228, 154, 0.25)',
            backgroundColor: 'rgba(125, 228, 154, 0.12)',
            color: 'primary.main',
            transition: 'all 0.25s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 24px rgba(47, 133, 90, 0.22)',
            },
          }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 16,
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(135deg, rgba(125, 223, 146, 0.35) 0%, rgba(47, 133, 90, 0.45) 100%)',
              color: '#0f1411',
            }}
          >
            <Agriculture fontSize="medium" />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              🌾 YieldWise
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.08em' }}>
              SMART AI-POWERED FARMING
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5, ml: 4 }}>
          <Chip
            icon={<Nature fontSize="small" />}
            label="Optimal growing window"
            className="chip-muted"
            sx={{ pl: 0.5, pr: 1.5, height: 32 }}
          />
          <Chip
            icon={<AutoAwesome fontSize="small" />}
            label="AI insights refreshed"
            sx={{
              borderRadius: '999px',
              height: 32,
              backgroundColor: 'rgba(246, 173, 85, 0.16)',
              color: 'secondary.dark',
              '& .MuiChip-icon': { color: 'secondary.dark' },
            }}
          />
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton
              onClick={onThemeToggle}
              sx={{
                width: 44,
                height: 44,
                borderRadius: 14,
                border: '1px solid rgba(125, 228, 154, 0.24)',
                color: 'primary.main',
                backgroundColor: 'rgba(125, 228, 154, 0.12)',
                '&:hover': {
                  backgroundColor: 'rgba(125, 228, 154, 0.2)',
                },
              }}
            >
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Notifications">
            <IconButton
              sx={{
                width: 44,
                height: 44,
                borderRadius: 14,
                border: '1px solid rgba(125, 228, 154, 0.16)',
              }}
            >
              <Badge color="secondary" variant="dot">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Removed Launch Planner Button as requested */}

          <Avatar
            onClick={handleClick}
            sx={{
              width: 40,
              height: 40,
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(125, 223, 146, 0.35) 0%, rgba(47, 133, 90, 0.72) 100%)',
              color: '#0f1411',
              border: '1px solid rgba(125, 228, 154, 0.45)',
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
                borderRadius: 3,
                minWidth: 220,
                border: darkMode ? '1px solid rgba(125, 228, 154, 0.28)' : '1px solid rgba(47, 133, 90, 0.12)',
                background: darkMode
                  ? 'linear-gradient(160deg, rgba(22, 29, 26, 0.96) 0%, rgba(22, 29, 26, 0.86) 100%)'
                  : 'linear-gradient(160deg, rgba(255,255,255,0.96) 0%, rgba(235, 244, 236, 0.94) 100%)',
                boxShadow: darkMode
                  ? '0 24px 48px rgba(9, 13, 11, 0.6)'
                  : '0 22px 44px rgba(47, 133, 90, 0.15)',
                color: darkMode ? '#e7f5ee' : '#1e2a1f',
              },
            }}
          >
            <MenuItem>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={user?.name || 'Grower'} secondary="Profile" />
            </MenuItem>
            <MenuItem>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Workspace Settings" />
            </MenuItem>
            <Divider sx={{ borderColor: 'rgba(125, 228, 154, 0.12)' }} />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Sign out" />
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;