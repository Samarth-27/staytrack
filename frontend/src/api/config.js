import axios from 'axios';

/**
 * Normalizes the base API URL so it reliably ends with `/api`
 * and handles trailing slashes properly whether set locally or in production.
 */
const getBaseUrl = () => {
  let url = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  url = url.trim().replace(/\/+$/, ''); // Remove trailing slashes
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
};

export const API_BASE_URL = getBaseUrl();

// Axios instance with centralized baseURL
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Automatic token attachment for all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
