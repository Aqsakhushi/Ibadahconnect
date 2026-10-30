import axios from 'axios';

// Central axios instance — all API calls go through this
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Automatically attach the auth token to every request
API.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('ibadahToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;