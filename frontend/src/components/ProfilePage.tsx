import React, { useState } from 'react';
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
} from '@mui/material';
import {
  AccountCircle,
  Email,
  Agriculture,
  CalendarMonth,
  Save,
  Edit,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    region: '',
    crops: '',
  });

  const handleSave = () => {
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <AccountCircle sx={{ fontSize: 36, color: 'primary.main' }} />
        Profile
      </Typography>

      {saved && <Alert severity="success" sx={{ mb: 2 }}>Profile updated successfully!</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                fontSize: '2rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, rgba(125, 223, 146, 0.35) 0%, rgba(47, 133, 90, 0.72) 100%)',
                color: '#0f1411',
                border: '3px solid rgba(125, 228, 154, 0.45)',
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={600}>{user?.name || 'User'}</Typography>
              <Typography variant="body2" color="text.secondary">{user?.email || 'No email'}</Typography>
              <Chip
                icon={<Agriculture />}
                label="Grower"
                size="small"
                color="primary"
                variant="outlined"
                sx={{ mt: 0.5 }}
              />
            </Box>
            <Box sx={{ ml: 'auto' }}>
              <Button
                variant={editing ? 'contained' : 'outlined'}
                startIcon={editing ? <Save /> : <Edit />}
                onClick={editing ? handleSave : () => setEditing(true)}
              >
                {editing ? 'Save' : 'Edit Profile'}
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
            <TextField
              fullWidth
              label="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={!editing}
              InputProps={{ startAdornment: <AccountCircle sx={{ mr: 1, color: 'text.secondary' }} /> }}
            />
            <TextField
              fullWidth
              label="Email"
              value={form.email}
              disabled
              InputProps={{ startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} /> }}
            />
            <TextField
              fullWidth
              label="Region"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              disabled={!editing}
              placeholder="e.g. Maharashtra, India"
            />
            <TextField
              fullWidth
              label="Primary Crops"
              value={form.crops}
              onChange={(e) => setForm({ ...form, crops: e.target.value })}
              disabled={!editing}
              placeholder="e.g. Wheat, Rice, Cotton"
            />
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonth color="primary" /> Account Info
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Account Type</Typography>
              <Typography variant="body1" fontWeight={600}>Free Tier</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Member Since</Typography>
              <Typography variant="body1" fontWeight={600}>2025</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">AI Queries</Typography>
              <Typography variant="body1" fontWeight={600}>Unlimited</Typography>
            </Paper>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProfilePage;
