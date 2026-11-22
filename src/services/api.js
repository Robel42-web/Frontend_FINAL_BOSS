import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

export const getCsrfCookie = () => api.get('/sanctum/csrf-cookie');

export default api;