// Central API configuration
const rawApiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

// Ensure no trailing slash to avoid double-slash URLs when concatenating paths
export const API_BASE = rawApiBase.replace(/\/+$/, '');

export const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';
