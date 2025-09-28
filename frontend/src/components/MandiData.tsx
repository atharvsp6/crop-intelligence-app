import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import {
  Storefront,
  Refresh,
  WarningAmber,
  CheckCircle,
  FilterList,
  Insights,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE } from '../config';
import { useAuth } from '../context/AuthContext';

interface MandiRecord {
  commodity?: string;
  variety?: string;
  state?: string;
  district?: string;
  market?: string;
  arrival_date?: string;
  arrival_timestamp?: string | null;
  min_price_quintal?: number | null;
  max_price_quintal?: number | null;
  modal_price_quintal?: number | null;
  price_per_kg?: number | null;
  unit?: string;
  source?: string;
}

interface MandiSummary {
  markets_tracked?: number;
  states_tracked?: number;
  average_modal_price_quintal?: number | null;
  average_price_per_kg?: number | null;
  latest_arrival?: string | null;
}

interface MandiResponse {
  success: boolean;
  fallback?: boolean;
  from_cache?: boolean;
  source?: string;
  api_url?: string;
  message?: string;
  error?: string;
  summary?: MandiSummary;
  records?: MandiRecord[];
  last_updated?: string | null;
}

const COMMODITY_OPTIONS = [
  { value: 'ALL', label: 'All Commodities' },
  { value: 'wheat', label: 'Wheat' },
  { value: 'rice', label: 'Rice' },
  { value: 'corn', label: 'Maize/Corn' },
  { value: 'soybean', label: 'Soybean' },
  { value: 'cotton', label: 'Cotton' },
  { value: 'turmeric', label: 'Turmeric' },
  { value: 'mustard', label: 'Mustard' },
  { value: 'coriander', label: 'Coriander' },
  { value: 'onion', label: 'Onion' },
  { value: 'potato', label: 'Potato' },
  { value: 'tomato', label: 'Tomato' },
];

const SOURCE_LABELS: Record<string, string> = {
  data_gov_in: 'data.gov.in (Government of India)',
  indian_govt_mandi_live: 'data.gov.in (Mandi Live)',
  simulated: 'Simulated Dataset',
  simulated_mandi_dataset: 'Simulated Dataset',
};

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const kiloFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatSourceLabel = (source?: string) => {
  if (!source) return 'Unknown source';
  return SOURCE_LABELS[source] || source.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

const formatQuintalPrice = (value?: number | null) => {
  if (value === null || value === undefined) return '—';
  return `${currencyFormatter.format(value)} /qtl`;
};

const formatKgPrice = (value?: number | null) => {
  if (value === null || value === undefined) return '—';
  return `${kiloFormatter.format(value)} /kg`;
};

const MandiData: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<MandiRecord[]>([]);
  const [summary, setSummary] = useState<MandiSummary | null>(null);
  const [source, setSource] = useState<string | undefined>('data_gov_in');
  const [fromCache, setFromCache] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [message, setMessage] = useState<string | undefined>('');
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ commodity: 'wheat', state: 'ALL', limit: 40 });

  const fetchMandiData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { limit: filters.limit };
      if (filters.commodity !== 'ALL') {
        params.commodity = filters.commodity;
      }
      if (filters.state !== 'ALL') {
        params.state = filters.state;
      }

      const response = await axios.get<MandiResponse>(`${API_BASE}/api/market/mandi-data`, {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const data = response.data;
      setRecords(data.records || []);
      setSummary(data.summary || null);
      setSource(data.source);
      setFromCache(Boolean(data.from_cache));
      setFallback(Boolean(data.fallback));
      setMessage(data.message);

      if (!data.success && !data.fallback) {
        setError(data.error || 'Failed to fetch mandi data');
      }
    } catch (err) {
      console.error('Mandi data fetch error:', err);
      setError('Unable to reach mandi data service. Please try again later.');
      setRecords([]);
      setSummary(null);
      setSource(undefined);
      setFromCache(false);
      setFallback(false);
      setMessage(undefined);
    } finally {
      setLoading(false);
    }
  }, [filters.commodity, filters.state, filters.limit, token]);

  useEffect(() => {
    fetchMandiData();
  }, [fetchMandiData]);

  const uniqueStates = useMemo(() => {
    const states = new Set<string>();
    records.forEach((record) => {
      if (record.state) {
        states.add(record.state);
      }
    });
    return Array.from(states).sort();
  }, [records]);

  const handleCommodityChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, commodity: value }));
  };

  const handleStateChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, state: value }));
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value) || 20;
    const safeValue = Math.max(10, Math.min(value, 100));
    setFilters((prev) => ({ ...prev, limit: safeValue }));
  };

  const handleRefresh = () => {
    fetchMandiData();
  };

  return (
    <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '18px',
            display: 'grid',
            placeItems: 'center',
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <Storefront fontSize="large" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Live Mandi Prices
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time wholesale market prices from the Government of India (data.gov.in)
          </Typography>
        </Box>
        <Tooltip title="Refresh data">
          <span>
            <IconButton onClick={handleRefresh} color="primary" disabled={loading}>
              <Refresh />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      <Card elevation={3}>
        <CardContent>
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              alignItems: 'center',
              gridTemplateColumns: {
                xs: 'repeat(1, minmax(0, 1fr))',
                md: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
              },
            }}
          >
            <Box>
              <FormControl fullWidth size="small">
                <InputLabel id="commodity-label">Commodity</InputLabel>
                <Select
                  labelId="commodity-label"
                  label="Commodity"
                  value={filters.commodity}
                  onChange={handleCommodityChange}
                >
                  {COMMODITY_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl fullWidth size="small" disabled={uniqueStates.length === 0}>
                <InputLabel id="state-label">State</InputLabel>
                <Select
                  labelId="state-label"
                  label="State"
                  value={filters.state}
                  onChange={handleStateChange}
                >
                  <MenuItem value="ALL">All States</MenuItem>
                  {uniqueStates.map((state) => (
                    <MenuItem key={state} value={state}>
                      {state}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <TextField
                label="Records"
                type="number"
                size="small"
                value={filters.limit}
                onChange={handleLimitChange}
                helperText="10 – 100"
                inputProps={{ min: 10, max: 100 }}
                fullWidth
              />
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: { xs: 'flex-start', lg: 'flex-end' },
                alignItems: 'center',
                mt: { xs: 1, lg: 0 },
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  icon={fallback ? <WarningAmber /> : <CheckCircle />}
                  color={fallback ? 'warning' : 'success'}
                  variant={fallback ? 'outlined' : 'filled'}
                  label={fallback ? 'Fallback shown' : 'Live data'}
                />
                {fromCache && (
                  <Chip label="Cached" color="default" variant="outlined" />
                )}
              </Stack>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {message && (
        <Alert severity={fallback ? 'warning' : 'info'} icon={<WarningAmber />}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" icon={<WarningAmber />}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: {
            xs: 'repeat(1, minmax(0, 1fr))',
            md: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))',
          },
        }}
      >
        <Card elevation={2}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Insights color="primary" />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Average Modal Price
                </Typography>
                <Typography variant="h6">
                  {formatQuintalPrice(summary?.average_modal_price_quintal)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({formatKgPrice(summary?.average_price_per_kg)})
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        <Card elevation={2}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Markets Covered
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {summary?.markets_tracked ?? '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              across {summary?.states_tracked ?? '—'} states
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={2}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Data Source
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatSourceLabel(source)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Last updated: {formatDate(summary?.latest_arrival || undefined)}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={2}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Filters Active
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 1 }}>
              <Chip size="small" icon={<FilterList />} label={`Commodity: ${filters.commodity}`} />
              <Chip size="small" label={`State: ${filters.state}`} />
              <Chip size="small" label={`Limit: ${filters.limit}`} />
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Card elevation={2}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Market-wise Price Snapshot</Typography>
            {loading && (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Fetching live mandi prices...
                </Typography>
              </Stack>
            )}
          </Box>
          <Divider sx={{ mb: 2 }} />
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 520 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Market</TableCell>
                  <TableCell>District</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>Commodity</TableCell>
                  <TableCell>Variety</TableCell>
                  <TableCell align="right">Min Price (₹/qtl)</TableCell>
                  <TableCell align="right">Modal Price (₹/qtl)</TableCell>
                  <TableCell align="right">Max Price (₹/qtl)</TableCell>
                  <TableCell align="right">Price (₹/kg)</TableCell>
                  <TableCell>Arrival Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography color="text.secondary">
                        No mandi records available for the selected filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {records.map((record, index) => (
                  <TableRow key={`${record.market}-${record.arrival_timestamp || index}`} hover>
                    <TableCell>{record.market || '—'}</TableCell>
                    <TableCell>{record.district || '—'}</TableCell>
                    <TableCell>{record.state || '—'}</TableCell>
                    <TableCell>{record.commodity || '—'}</TableCell>
                    <TableCell>{record.variety || '—'}</TableCell>
                    <TableCell align="right">
                      {record.min_price_quintal !== undefined && record.min_price_quintal !== null
                        ? currencyFormatter.format(record.min_price_quintal)
                        : '—'}
                    </TableCell>
                    <TableCell align="right">
                      {record.modal_price_quintal !== undefined && record.modal_price_quintal !== null
                        ? currencyFormatter.format(record.modal_price_quintal)
                        : '—'}
                    </TableCell>
                    <TableCell align="right">
                      {record.max_price_quintal !== undefined && record.max_price_quintal !== null
                        ? currencyFormatter.format(record.max_price_quintal)
                        : '—'}
                    </TableCell>
                    <TableCell align="right">{formatKgPrice(record.price_per_kg)}</TableCell>
                    <TableCell>{formatDate(record.arrival_date || record.arrival_timestamp)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MandiData;
