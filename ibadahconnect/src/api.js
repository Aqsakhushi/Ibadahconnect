import axios from 'axios';

const API = axios.create({
  baseURL: '/api'  // Same-origin: Vite proxy isse backend (port 5000) tak pahunchata hai
});

// Har request ke sath login token bhejo (Admin rules upload, waghera ke liye zaroori)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;