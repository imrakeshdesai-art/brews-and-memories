import axios from 'axios';
import { getAdminToken } from './auth';

const isFileProtocol = window.location.protocol === 'file:';
const isLocal =
  isFileProtocol ||
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

// Local: Vite proxy handles /api → localhost:5000, but file protocol needs explicit host
// Production (Vercel): calls go directly to Render backend
const API_BASE = isFileProtocol
  ? 'http://localhost:5000'
  : isLocal
  ? ''
  : 'https://brews-backend.onrender.com';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 60000,
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
