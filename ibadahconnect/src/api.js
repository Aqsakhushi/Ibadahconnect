import axios from 'axios';
import toast from 'react-hot-toast';
import { clearAuth, getToken, isTokenExpired } from './utils/auth';

const API = axios.create({ baseURL: '/api' });

function expireSession() {
  const { pathname, search, hash } = window.location;
  const isLoginPage = pathname === '/login';

  if (!isLoginPage && pathname !== '/register') {
    sessionStorage.setItem('postLoginRedirect', `${pathname}${search}${hash}`);
  }
  sessionStorage.setItem('authExpiredMessage', 'true');
  clearAuth();
  toast.error('Session expired, please log in again.', { id: 'auth-expired' });

  if (!isLoginPage) window.location.assign('/login');
}

API.interceptors.request.use((config) => {
  const token = getToken();
  if (token && isTokenExpired(token)) {
    if (!config.skipAuthRedirect) expireSession();
    return Promise.reject(new Error('Authentication token has expired.'));
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error.config || {};
    const isAuthRequest = /\/auth\/(login|register|signup)(?:\?|$)/i.test(config.url || '');
    if (
      error.response?.status === 401 &&
      getToken() &&
      !config.skipAuthRedirect &&
      !isAuthRequest
    ) {
      expireSession();
    }
    return Promise.reject(error);
  }
);

export default API;
