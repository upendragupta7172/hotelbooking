// src/utils/api.js – wrapper around fetch for the backend API
const handleResponse = async (res, method, endpoint) => {
  const payload = res.ok ? null : await res.json().catch(() => ({}));
  if (res.status === 401 || (res.status === 403 && payload.message === 'Admin access required')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
  if (!res.ok) {
    const message = payload.message || payload.errors?.[0]?.msg || `${method} ${endpoint} failed`;
    throw new Error(payload.detail ? `${message} (${payload.detail})` : message);
  }
  return res.json();
};

export const api = {
  get: async (endpoint) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(endpoint, { method: 'GET', headers });
    return handleResponse(res, 'GET', endpoint);
  },
  post: async (endpoint, data) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(data) });
    return handleResponse(res, 'POST', endpoint);
  },
  put: async (endpoint, data) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(endpoint, { method: 'PUT', headers, body: JSON.stringify(data) });
    return handleResponse(res, 'PUT', endpoint);
  },
  delete: async (endpoint) => {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(endpoint, { method: 'DELETE', headers });
    return handleResponse(res, 'DELETE', endpoint);
  },
};
