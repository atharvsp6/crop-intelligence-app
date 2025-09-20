import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  Box,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4,
  Brightness7,
  Agriculture,
} from '@mui/icons-material';

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
  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onSidebarToggle}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Agriculture sx={{ mr: 2 }} />
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Crop Intelligence Platform
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={onThemeToggle}
                icon={<Brightness7 />}
                checkedIcon={<Brightness4 />}
              />
            }
            label=""
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;