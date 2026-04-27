import axios from 'axios';
import { getAdminToken } from './auth';

const isLocal =
  window.location.protocol === 'file:' ||
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

// Local: Vite proxy handles /api → localhost:5000
// Production (Vercel): calls go directly to Render backend
const API_BASE = isLocal
  ? ''
  : 'https://brews-backend.onrender.com';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
