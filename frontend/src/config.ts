// Central API configuration
let rawApiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

// Ensure protocol exists if it's not localhost
if (rawApiBase && !rawApiBase.startsWith('http://') && !rawApiBase.startsWith('https://')) {
  // If it's a domain name (like azurewebsites.net), assume HTTPS
  rawApiBase = `https://${rawApiBase}`;
}

// Ensure no trailing slash to avoid double-slash URLs when concatenating paths
export const API_BASE = rawApiBase.replace(/\/+$/, '');

export const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';
