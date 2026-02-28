import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Divider,
  TextField,
  Button,
  Alert,
  Paper,
  CircularProgress,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  AccountCircle,
  Email,
  Agriculture,
  CalendarMonth,
  Save,
  Edit,
  CameraAlt,
  Star,
  AllInclusive,
  Verified,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE } from '../config';
import { useAuth } from '../context/AuthContext';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    region: '',
    crops: '',
  });

  const accentColor = dark ? theme.palette.primary.main : theme.palette.primary.dark;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Photo must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      if (photoPreview) {
        await axios.put(
          `${API_BASE}/api/auth/profile/photo`,
          { profile_photo: photoPreview },
          { headers }
        );
        updateUser({ profile_photo: photoPreview });
      }

      await axios.put(
        `${API_BASE}/api/auth/profile`,
        {
          full_name: form.name,
          region: form.region,
          crops: form.crops,
        },
        { headers }
      );
      updateUser({ name: form.name, full_name: form.name });
      setEditing(false);
      setSaved(true);
      setPhotoPreview(null);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const accountCards = [
    {
      icon: <Verified sx={{ fontSize: 28, color: 'primary.main' }} />,
      label: 'Account Type',
      value: 'Free Tier',
    },
    {
      icon: <Star sx={{ fontSize: 28, color: 'warning.main' }} />,
      label: 'Member Since',
      value: new Date().getFullYear().toString(),
    },
    {
      icon: <AllInclusive sx={{ fontSize: 28, color: 'info.main' }} />,
      label: 'Queries',
      value: 'Unlimited',
    },
  ];

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(accentColor, 0.15)} 0%, ${alpha(accentColor, 0.08)} 100%)`,
            border: `1px solid ${alpha(accentColor, 0.2)}`,
            display: 'grid',
            placeItems: 'center',
            color: 'primary.main',
          }}
        >
          <AccountCircle />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
            Profile
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your account settings and preferences
          </Typography>
        </Box>
      </Box>

      {saved && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>Profile updated successfully!</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* Profile Card */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${alpha(accentColor, dark ? 0.15 : 0.1)}`,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Avatar + Info Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3, flexWrap: 'wrap' }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                src={photoPreview || user?.profile_photo || undefined}
                sx={{
                  width: 88,
                  height: 88,
                  fontSize: '2rem',
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${alpha(accentColor, 0.3)} 0%, ${alpha(accentColor, 0.6)} 100%)`,
                  color: dark ? '#0f1411' : '#fff',
                  border: `3px solid ${alpha(accentColor, 0.35)}`,
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              {editing && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handlePhotoChange}
                  />
                  <IconButton
                    size="small"
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      bgcolor: 'primary.main',
                      color: '#fff',
                      width: 30,
                      height: 30,
                      border: `2px solid ${theme.palette.background.paper}`,
                      '&:hover': { bgcolor: 'primary.dark' },
                    }}
                  >
                    <CameraAlt sx={{ fontSize: 15 }} />
                  </IconButton>
                </>
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>{user?.name || 'User'}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {user?.email || 'No email'}
              </Typography>
              <Chip
                icon={<Agriculture />}
                label="Grower"
                size="small"
                color="primary"
                variant="outlined"
                sx={{ borderRadius: 2 }}
              />
            </Box>
            <Button
              variant={editing ? 'contained' : 'outlined'}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : editing ? <Save /> : <Edit />}
              onClick={editing ? handleSave : () => setEditing(true)}
              disabled={saving}
              sx={{
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
              }}
            >
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Edit Profile'}
            </Button>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Form Fields */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
            <TextField
              fullWidth
              label="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={!editing}
              InputProps={{ startAdornment: <AccountCircle sx={{ mr: 1, color: 'text.disabled' }} /> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              fullWidth
              label="Email"
              value={form.email}
              disabled
              helperText="Email cannot be changed"
              InputProps={{ startAdornment: <Email sx={{ mr: 1, color: 'text.disabled' }} /> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              fullWidth
              label="Region"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              disabled={!editing}
              placeholder="e.g. Maharashtra, India"
              autoComplete="address-level1"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              fullWidth
              label="Primary Crops"
              value={form.crops}
              onChange={(e) => setForm({ ...form, crops: e.target.value })}
              disabled={!editing}
              placeholder="e.g. Wheat, Rice, Cotton"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(accentColor, dark ? 0.12 : 0.08)}`,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <CalendarMonth sx={{ color: 'primary.main', fontSize: 22 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Account Info
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
            {accountCards.map((card, i) => (
              <Paper
                key={i}
                elevation={0}
                sx={{
                  p: 2.5,
                  textAlign: 'center',
                  borderRadius: 2.5,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: alpha(accentColor, 0.3),
                    backgroundColor: alpha(accentColor, 0.03),
                  },
                }}
              >
                <Box sx={{ mb: 1 }}>{card.icon}</Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.3 }}>
                  {card.label}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {card.value}
                </Typography>
              </Paper>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProfilePage;
