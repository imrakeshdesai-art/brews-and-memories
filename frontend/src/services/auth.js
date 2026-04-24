import api from './api';

export async function loginAdmin(credentials) {
  const response = await api.post('/auth/login', credentials);
  return response.data;
}

export function saveAdminToken(token) {
  localStorage.setItem('bm_admin_token', token);
}

export function clearAdminToken() {
  localStorage.removeItem('bm_admin_token');
}

export function getAdminToken() {
  return localStorage.getItem('bm_admin_token');
}
